export type Product = {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  icon: string;
  color?: string;
  pdfName?: string;
  pdfDataUrl?: string | null;
};

export const initialProducts: Product[] = [
  { id: 1, title: "Maths Worksheets", category: "Worksheets", description: "Practice sheets for confident learning.", price: 300, icon: "📐", color: "bg-blue-50" },
  { id: 2, title: "English Grammar Notes", category: "Study Notes", description: "Easy notes to improve English skills.", price: 250, icon: "📚", color: "bg-purple-50" },
  { id: 3, title: "Science Study Guide", category: "E-books", description: "Simple study material for students.", price: 400, icon: "🔬", color: "bg-green-50" },
  { id: 4, title: "Handwriting Practice", category: "Worksheets", description: "Printable activities for young learners.", price: 200, icon: "✍️", color: "bg-orange-50" },
];

export function getColorForCategory(category: string): string {
  if (category === "Worksheets") return "bg-blue-50";
  if (category === "Study Notes") return "bg-purple-50";
  if (category === "E-books") return "bg-green-50";
  return "bg-orange-50";
}

const STORAGE_KEY = "digital-pdf-store-products";

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return initialProducts.map((p) => ({ ...p }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = initialProducts.map((p) => ({ ...p }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    return JSON.parse(raw);
  } catch {
    return initialProducts.map((p) => ({ ...p }));
  }
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

export function getWhatsAppUrl(product: Product, quantity?: number): string {
  const whatsappNumber = process.env.NEXT_PUBLIC_SELLER_WHATSAPP || "";
  const qty = quantity || 1;
  const message = `Assalam-o-Alaikum! I want to order ${product.title} (Qty: ${qty}). Price: Rs. ${product.price * qty}. Please share the payment details.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
