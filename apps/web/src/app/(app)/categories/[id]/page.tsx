import type { Metadata } from "next";
import { CategoryView } from "@/components/category-view";

export const metadata: Metadata = { title: "Category · Gather" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  return <CategoryView selected={(await params).id} />;
}
