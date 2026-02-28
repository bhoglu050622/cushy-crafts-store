import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/config";
import type { UserRole } from "@/types/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  session: { user: FirebaseUser } | null;
  loading: boolean;
  roleLoading: boolean;
  userRole: UserRole | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [session, setSession] = useState<{ user: FirebaseUser } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const ensureProfileAndRole = async (uid: string, displayName?: string | null) => {
    const now = new Date().toISOString();
    const profileRef = doc(db, "profiles", uid);
    const roleRef = doc(db, "user_roles", uid);
    const [profileSnap, roleSnap] = await Promise.all([getDoc(profileRef), getDoc(roleRef)]);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        user_id: uid,
        full_name: displayName ?? null,
        phone: null,
        avatar_url: null,
        created_at: now,
        updated_at: now,
      });
    }
    if (!roleSnap.exists()) {
      await setDoc(roleRef, { user_id: uid, role: "customer" });
    }
  };

  const fetchUserRole = async (uid: string): Promise<UserRole> => {
    const roleRef = doc(db, "user_roles", uid);
    const snap = await getDoc(roleRef);
    if (snap.exists() && snap.data()?.role) {
      return snap.data().role as UserRole;
    }
    return "customer";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setSession(firebaseUser ? { user: firebaseUser } : null);
      if (firebaseUser) {
        setRoleLoading(true);
        await ensureProfileAndRole(firebaseUser.uid, firebaseUser.displayName);
        const role = await fetchUserRole(firebaseUser.uid);
        setUserRole(role);
        setRoleLoading(false);
      } else {
        setUserRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await ensureProfileAndRole(newUser.uid, fullName ?? newUser.displayName);
      const role = await fetchUserRole(newUser.uid);
      setUserRole(role);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: signedInUser } = await signInWithEmailAndPassword(auth, email, password);
      await ensureProfileAndRole(signedInUser.uid, signedInUser.displayName);
      const role = await fetchUserRole(signedInUser.uid);
      setUserRole(role);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUserRole(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    roleLoading,
    userRole,
    signUp,
    signIn,
    signOut,
    isAdmin: userRole === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
