import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "", slug: "", description: "", short_description: "",
    base_price: "", compare_at_price: "", design_name: "",
    is_featured: false, is_active: true,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories!products_category_id_fkey(name), product_variants(id, sku, stock_quantity, price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete variants and images first
      await supabase.from("product_images").delete().eq("product_id", id);
      await supabase.from("product_variants").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            slug: data.slug,
            description: data.description,
            short_description: data.short_description,
            base_price: Number(data.base_price),
            compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
            design_name: data.design_name || null,
            is_featured: data.is_featured,
            is_active: data.is_active,
          })
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          name: data.name,
          slug: data.slug,
          description: data.description,
          short_description: data.short_description,
          base_price: Number(data.base_price),
          compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
          design_name: data.design_name || null,
          is_featured: data.is_featured,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editingProduct ? "Product updated" : "Product created" });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.design_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "", slug: "", description: "", short_description: "",
      base_price: "", compare_at_price: "", design_name: "",
      is_featured: false, is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      base_price: String(product.base_price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      design_name: product.design_name || "",
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const totalStock = (variants: any[]) =>
    variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">Products</h1>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="border border-border/30 rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-foreground/50">{product.design_name}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{product.categories?.name || "—"}</TableCell>
                <TableCell className="text-sm">{formatPrice(Number(product.base_price))}</TableCell>
                <TableCell className="text-sm">{totalStock(product.product_variants)}</TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => openEditDialog(product)} className="p-2 hover:bg-muted rounded">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(product.id)} className="p-2 hover:bg-muted rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Price (₹)</Label>
                <Input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input type="number" value={formData.compare_at_price} onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Design Name</Label>
              <Input value={formData.design_name} onChange={(e) => setFormData({ ...formData, design_name: e.target.value })} />
            </div>
            <div>
              <Label>Short Description</Label>
              <Input value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
