"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

const statuses = ["Pending", "Confirmed", "Payment Received", "Completed", "Cancelled"];

type OrderRow = {
  id: number;
  order_ref: string;
  customer_name: string;
  whatsapp_number: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  created_at: string;
  products?: { title: string } | null;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push("/admin/login");
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push("/admin/login");
          return;
        }
      } catch {
        router.push("/admin/login");
        return;
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase not configured.");
        setLoading(false);
        return;
      }
      try {
      const { data, error: err } = await supabase
        .from("orders")
        .select("*, products(title)")
        .order("created_at", { ascending: false });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const mapped = (data || []).map((o) => ({
        ...(o as OrderRow),
        unit_price: Number((o as OrderRow).unit_price),
        total_amount: Number((o as OrderRow).total_amount),
      }));
      setOrders(mapped);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load orders");
    } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading]);

  async function updateStatus(id: number, status: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/admin/login");
      return;
    }
    try {
      const { error: err } = await supabase.from("orders").update({ status }).eq("id", id);
      if (err) {
        setError(err.message);
        return;
      }
      setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setError((e as Error)?.message || "Failed to update status");
    }
  }

  async function logout() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const filtered = orders.filter((o) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return o.order_ref.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s);
  });

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            PDF<span className="text-slate-800">Store.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">Home</Link>
            <Link href="/admin" className="hover:text-indigo-600">Products</Link>
            <Link href="/admin/orders" className="text-indigo-700">Orders</Link>
            <button type="button" onClick={logout} className="hover:text-indigo-600">Logout</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Order Management</h1>
            <p className="mt-2 text-slate-600">Orders are requests only - not proof of payment. No PDF downloads auto-issued.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">Back to Products</Link>
        </div>
        <div className="mt-6 max-w-md">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ref or customer name" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold">Order Ref</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">WhatsApp</th>
                <th className="px-6 py-3 font-semibold">Product</th>
                <th className="px-6 py-3 font-semibold">Qty</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-6" colSpan={9}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-6" colSpan={9}>No orders found.</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold">{o.order_ref}</td>
                    <td className="px-6 py-4">{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                    <td className="px-6 py-4">{o.customer_name}</td>
                    <td className="px-6 py-4">{o.whatsapp_number}</td>
                    <td className="px-6 py-4">{o.products?.title || o.product_id}</td>
                    <td className="px-6 py-4">{o.quantity}</td>
                    <td className="px-6 py-4">Rs. {o.total_amount}</td>
                    <td className="px-6 py-4">{o.status}</td>
                    <td className="px-6 py-4">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
