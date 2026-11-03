export type Product = {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  icon: string;
  color?: string;
  pdf_path?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const categoryColors: Record<string, string> = {
  Worksheets: "bg-blue-50",
  "Study Notes": "bg-purple-50",
  "E-books": "bg-green-50",
};

export function getColorForCategory(category: string): string {
  return categoryColors[category] || "bg-orange-50";
}
