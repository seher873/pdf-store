"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import type { Product } from "@/types/product";
import { getColorForCategory } from "@/types/product";

type OrderConfirmation = {
  order: {
    order_ref: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    customer_name: string;
    whatsapp_number: string;
    status: string;
  };
  productTitle: string;
};

function OrderPageInner() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const sellerWhatsApp = process.env.NEXT_PUBLIC_SELLER_WHATSAPP || "";

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase || Number.isNaN(productId)) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("products").select("*").eq("id", productId).single();
      if (data) {
        setProduct({ ...(data as Product), price: Number((data as Product).price), color: (data as Product).color || getColorForCategory((data as Product).category) });
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerName.trim() || !whatsappNumber.trim()) {
      setError("Name and WhatsApp number are required.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          customerName: customerName.trim(),
          whatsappNumber: whatsappNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order");
        setSubmitting(false);
        return;
      }
      setConfirmation(data as OrderConfirmation);
    } catch (err) {
      setError((err as Error)?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-800">
        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">PDF<span className="text-slate-800">Store.</span></Link>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-12"><p>Loading...</p></section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-slate-800">
        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">PDF<span className="text-slate-800">Store.</span></Link>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-12 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/" className="mt-4 inline-flex rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white">Back to Products</Link>
        </section>
      </main>
    );
  }

  if (confirmation) {
    const waMsg = `Order ${confirmation.order.order_ref} - ${confirmation.productTitle}. Qty: ${confirmation.order.quantity}. Total: Rs. ${confirmation.order.total_amount}. Name: ${confirmation.order.customer_name}. WhatsApp: ${confirmation.order.whatsapp_number}`;
    const waUrl = sellerWhatsApp ? `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(waMsg)}` : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
    return (
      <main className="min-h-screen bg-white text-slate-800">
        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">PDF<span className="text-slate-800">Store.</span></Link>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="text-2xl font-bold">Order Request Submitted</h1>
          <p className="mt-2 text-slate-600">This is a request only - not proof of payment.</p>
          <div className="mt-6 rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600">Order Reference</p>
            <p className="mt-1 text-xl font-bold">{confirmation.order.order_ref}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <p><span className="font-semibold">Product:</span> {confirmation.productTitle}</p>
              <p><span className="font-semibold">Quantity:</span> {confirmation.order.quantity}</p>
              <p><span className="font-semibold">Unit Price:</span> Rs. {confirmation.order.unit_price}</p>
              <p><span className="font-semibold">Total Amount:</span> Rs. {confirmation.order.total_amount}</p>
              <p><span className="font-semibold">Name:</span> {confirmation.order.customer_name}</p>
              <p><span className="font-semibold">WhatsApp:</span> {confirmation.order.whatsapp_number}</p>
              <p><span className="font-semibold">Status:</span> {confirmation.order.status}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white">Contact via WhatsApp</a>
            <Link href="/" className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700">Back to Home</Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">Never expose private PDFs. Downloads require verified purchase authorization on server.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">PDF<span className="text-slate-800">Store.</span></Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">Home</Link>
            <Link href="/#products" className="hover:text-indigo-600">Products</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-indigo-700">← Back to Products</Link>
        <h1 className="mt-4 text-2xl font-bold">Place Order Request</h1>
        <p className="mt-2 text-slate-600">Submit your details. Order is a request only, not proof of payment.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className={`${product.color || getColorForCategory(product.category)} flex h-48 items-center justify-center rounded-2xl`}>
            <span className="text-6xl">{product.icon}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{product.category}</p>
            <h2 className="mt-2 text-xl font-bold">{product.title}</h2>
            <p className="mt-2 text-slate-600">{product.description}</p>
            <p className="mt-4 text-lg font-bold">Rs. {product.price}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-2xl border border-slate-200 p-6">
          <div>
            <label className="text-sm font-semibold">Customer Name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-semibold">WhatsApp Number</label>
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-semibold">Quantity</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-60">{submitting ? "Submitting..." : "Submit Order Request"}</button>
        </form>
      </section>
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white"><div className="p-6">Loading...</div></main>}>
      <OrderPageInner />
    </Suspense>
  );
}
