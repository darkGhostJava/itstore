import { mockArticles, mockItems } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Article } from "@/lib/definitions";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

const itemColumns: ColumnDef<Item>[] = [
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = mockArticles.find(a => a.id === parseInt(params.id));

  if (!article) {
    notFound();
  }

  const items = mockItems.filter(i => i.articleId === article.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={article.model} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
              <CardDescription>{article.designation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-semibold">Model: </span> {article.model}
              </div>
              <div>
                <span className="font-semibold">Type: </span> 
                <Badge variant={article.type === "HARDWARE" ? "default" : "secondary"}>
                  {article.type}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Total Items: </span> {items.length}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Items
                    </Button>
                </div>
              <CardDescription>Serial numbers and statuses for {article.model}.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable data={items} columns={itemColumns} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
