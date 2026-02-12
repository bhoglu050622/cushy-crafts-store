import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ordersRes, productsRes, lowStockRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, created_at"),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("product_variants").select("id, product_id, stock_quantity, sku").lte("stock_quantity", 5),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

      return {
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        lowStockItems: lowStockRes.data || [],
        recentOrders: orders.slice(0, 5),
      };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs tracking-widest text-foreground/60">REVENUE</CardTitle>
            <DollarSign className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display">{formatPrice(stats?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs tracking-widest text-foreground/60">ORDERS</CardTitle>
            <ShoppingCart className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display">{stats?.totalOrders || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs tracking-widest text-foreground/60">PRODUCTS</CardTitle>
            <Package className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display">{stats?.totalProducts || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs tracking-widest text-foreground/60">LOW STOCK</CardTitle>
            <AlertTriangle className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display">{stats?.lowStockItems.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-foreground/70">{item.sku}</span>
                  <span className="font-medium text-yellow-600">{item.stock_quantity} left</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
