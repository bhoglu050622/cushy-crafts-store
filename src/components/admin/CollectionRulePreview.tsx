import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Props {
  rulesJson: string;
}

const CollectionRulePreview = ({ rulesJson }: Props) => {
  const { data: matchingProducts = [], isLoading } = useQuery({
    queryKey: ["collection-rule-preview", rulesJson],
    queryFn: async () => {
      const rules = JSON.parse(rulesJson);
      const tags = rules.tags || [];
      if (tags.length === 0) return [];
      const q = query(
        collection(db, "products"),
        where("is_active", "==", true),
        where("tags", "array-contains-any", tags.slice(0, 10)),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    enabled: (() => {
      try { const r = JSON.parse(rulesJson); return Array.isArray(r.tags) && r.tags.length > 0; }
      catch { return false; }
    })(),
  });

  if (!rulesJson) return null;

  let valid = true;
  try { JSON.parse(rulesJson); } catch { valid = false; }
  if (!valid) return <p className="text-xs text-destructive">Invalid JSON</p>;

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded text-xs">
      <div className="flex items-center gap-2 mb-2 text-foreground/60">
        <Package className="h-3 w-3" />
        {isLoading ? "Loading preview..." : `${matchingProducts.length}${matchingProducts.length === 10 ? "+" : ""} matching products`}
      </div>
      {matchingProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matchingProducts.map((p: Record<string, unknown>) => (
            <Badge key={String(p.id)} variant="outline" className="text-xs">{String(p.name)}</Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionRulePreview;
