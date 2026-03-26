import { useEffect } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import StoreLayout from "@/components/layout/StoreLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User, Package, MapPin, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const accountLinks = [
  { label: "Profile", href: "/account", icon: User },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
];

const Account = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const isRootAccount = location.pathname === "/account";

  return (
    <StoreLayout>
      <div className="pb-20 min-h-screen">
        <div className="container">
          <h1 className="font-display text-3xl mb-8">My Account</h1>

          <div className="grid lg:grid-cols-4 gap-10">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <nav className="space-y-1">
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors",
                      location.pathname === link.href
                        ? "bg-muted text-foreground"
                        : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-md text-foreground/60 hover:text-foreground hover:bg-muted/50 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {isRootAccount ? (
                <div>
                  <h2 className="font-display text-xl mb-4">Welcome, {user.email}</h2>
                  <p className="text-foreground/60 mb-8">
                    Manage your profile, view orders, and manage shipping addresses.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="border border-border/30 rounded-md p-6 hover:bg-muted/50 transition-colors text-center"
                      >
                        <link.icon className="h-8 w-8 mx-auto mb-3 text-foreground/60" />
                        <span className="text-sm font-medium">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Account;
