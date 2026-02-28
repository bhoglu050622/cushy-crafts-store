import { useQuery } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { formatDate } from "@/lib/formatters";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const AdminCustomers = () => {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const profilesSnap = await getDocs(
        query(collection(db, "profiles"), orderBy("created_at", "desc"))
      );
      const profiles = profilesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const userIds = profiles.map((p: Record<string, unknown>) => p.user_id).filter(Boolean);
      const orderCounts = new Map<string, number>();
      if (userIds.length > 0) {
        const ordersSnap = await getDocs(
          query(collection(db, "orders"), where("user_id", "in", userIds.slice(0, 30)))
        );
        ordersSnap.docs.forEach((d) => {
          const uid = d.data().user_id;
          if (uid) orderCounts.set(uid, (orderCounts.get(uid) || 0) + 1);
        });
      }
      return profiles.map((p: Record<string, unknown>) => ({
        ...p,
        orderCount: orderCounts.get(p.user_id as string) || 0,
      }));
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">Customers ({customers.length})</h1>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50">No customers yet</p>
        </div>
      ) : (
        <div className="border border-border/30 rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c: Record<string, unknown>) => (
                <TableRow key={String(c.id)}>
                  <TableCell className="font-medium">{String(c.full_name || "—")}</TableCell>
                  <TableCell className="text-sm">{String(c.phone || "—")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.orderCount} orders</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(String(c.created_at || ""))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
