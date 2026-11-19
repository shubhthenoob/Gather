import type { Metadata } from "next";
import { CategoryView } from "@/components/category-view";

export const metadata: Metadata = { title: "Categories · Gather" };

export default function CategoriesPage() {
  return <CategoryView selected="all" />;
}
