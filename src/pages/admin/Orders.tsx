import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
};

const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">Orders ({orders.length})</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {orderStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border/30 rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-sm">{order.order_number}</TableCell>
                <TableCell className="text-sm">{formatDate(order.created_at || "")}</TableCell>
                <TableCell className="text-sm">{order.order_items?.length || 0} items</TableCell>
                <TableCell className="text-sm">{formatPrice(Number(order.total_amount))}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">
                    {order.payment_method || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status || "pending"}
                    onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <Badge className={statusColors[order.status || "pending"]} variant="secondary">
                        {(order.status || "pending").toUpperCase()}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
