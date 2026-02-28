import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, formatDate } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
};

const AccountOrders = () => {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.uid],
    queryFn: async () => {
      const ordersQuery = query(
        collection(db, "orders"),
        where("user_id", "==", user!.uid),
        orderBy("created_at", "desc")
      );
      const ordersSnap = await getDocs(ordersQuery);
      const ordersList = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withItems = await Promise.all(
        ordersList.map(async (order) => {
          const itemsSnap = await getDocs(
            query(
              collection(db, "order_items"),
              where("order_id", "==", order.id)
            )
          );
          const order_items = itemsSnap.docs.map((di) => ({ id: di.id, ...di.data() }));
          return { ...order, order_items };
        })
      );
      return withItems;
    },
    enabled: !!user?.uid,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 text-foreground/20 mx-auto mb-4" />
        <h2 className="font-display text-xl mb-2">No orders yet</h2>
        <p className="text-foreground/50 mb-6">Start shopping to see your orders here.</p>
        <Link to="/" className="text-sm underline text-foreground/70 hover:text-foreground">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-6">My Orders</h2>
      <div className="space-y-4">
        {orders.map((order: Record<string, unknown>) => (
          <div key={String(order.id)} className="border border-border/30 rounded-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium">#{order.order_number}</p>
                <p className="text-xs text-foreground/50">{formatDate(String(order.created_at || ""))}</p>
              </div>
              <div className="text-right">
                <Badge className={statusColors[String(order.status || "pending")]} variant="secondary">
                  {String(order.status || "pending").toUpperCase()}
                </Badge>
                <p className="text-sm font-medium mt-1">{formatPrice(Number(order.total_amount))}</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto mb-3">
              {(order.order_items as Array<Record<string, unknown>>)?.map((item) => (
                <div key={String(item.id)} className="text-xs text-foreground/60 whitespace-nowrap">
                  {item.product_name} × {item.quantity}
                </div>
              ))}
            </div>

            {order.tracking_number && (
              <div className="bg-muted/50 rounded p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground/50">Tracking Number</p>
                  <p className="text-sm font-mono font-medium">{String(order.tracking_number)}</p>
                </div>
                {order.tracking_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={String(order.tracking_url)} target="_blank" rel="noopener noreferrer" className="gap-2">
                      Track <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {order.discount_code && (
              <p className="text-xs text-green-600 mt-2">
                Discount applied: {String(order.discount_code)} (-{formatPrice(Number(order.discount_amount || 0))})
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountOrders;
