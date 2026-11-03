"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import type { Product } from "@/types/product";
import { getColorForCategory } from "@/types/product";

const categories = ["Worksheets", "Study Notes", "E-books"] as const;

type FormState = {
  title: string;
  category: string;
  description: string;
  price: string;
  icon: string;
};

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    category: "Worksheets",
    description: "",
    price: "",
    icon: "📄",
  });
  const [error, setError] = useState<string>("");
  const [dbError, setDbError] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        setDbError("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
        setLoading(false);
        return;
      }
      try {
      const { data, error: err } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (err) {
        setDbError(err.message);
        setLoading(false);
        return;
      }
      const mapped = (data || []).map((p) => ({
        ...(p as Product),
        price: Number((p as Product).price),
        color: (p as Product).color || getColorForCategory((p as Product).category),
      }));
      setItems(mapped);
    } catch (e) {
      setDbError((e as Error)?.message || "Failed to load products");
    } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading]);

  function openAdd() {
    setEditingId(null);
    setForm({ title: "", category: "Worksheets", description: "", price: "", icon: "📄" });
    setError("");
    setPdfFile(null);
    setRemovePdf(false);
    setUploading(false);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      title: product.title,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      icon: product.icon,
    });
    setError("");
    setPdfFile(null);
    setRemovePdf(false);
    setUploading(false);
    setShowForm(true);
  }

  function validate(): boolean {
    if (!form.title.trim()) {
      setError("Title is required.");
      return false;
    }
    if (!form.description.trim()) {
      setError("Description is required.");
      return false;
    }
    if (!form.category.trim()) {
      setError("Category is required.");
      return false;
    }
    const priceNum = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(priceNum)) {
      setError("Price must be a valid number.");
      return false;
    }
    if (priceNum < 0) {
      setError("Price must be a non-negative number.");
      return false;
    }
    setError("");
    return true;
  }

  async function saveProduct() {
    if (!validate()) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/admin/login");
      return;
    }

    if (pdfFile) {
      const isPdf = pdfFile.type === "application/pdf" || pdfFile.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError("Only PDF files are allowed.");
        return;
      }
      if (pdfFile.size > MAX_PDF_SIZE) {
        setError("File size must be 10 MB or less.");
        return;
      }
    }

    setUploading(true);
    setError("");
    const priceNum = Number(form.price);

    if (editingId === null) {
      try {
        let pdfPath: string | null = null;
        if (pdfFile) {
          const ext = ".pdf";
          const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("product-pdfs")
            .upload(fileName, pdfFile, { contentType: "application/pdf", upsert: false });
          if (uploadErr) {
            setError(uploadErr.message);
            setUploading(false);
            return;
          }
          pdfPath = fileName;
        }
        const { data, error: err } = await supabase
          .from("products")
          .insert([
            {
              title: form.title.trim(),
              category: form.category,
              description: form.description.trim(),
              price: priceNum,
              icon: form.icon.trim() || "📄",
              pdf_path: pdfPath,
            },
          ])
          .select()
          .single();
        if (err) {
          if (pdfPath) {
            await supabase.storage.from("product-pdfs").remove([pdfPath]);
          }
          setError(err.message);
          setUploading(false);
          return;
        }
        const newProduct = { ...(data as Product), price: Number((data as Product).price), color: (data as Product).color || getColorForCategory((data as Product).category) };
        setItems([...items, newProduct]);
        setShowForm(false);
        setPdfFile(null);
        setRemovePdf(false);
      } catch (e) {
        setError((e as Error)?.message || "Failed to add product");
      } finally {
        setUploading(false);
      }
    } else {
      try {
        const currentProduct = items.find((i) => i.id === editingId);
        let newPdfPath: string | null | undefined = currentProduct?.pdf_path;

        if (pdfFile) {
          const ext = ".pdf";
          const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("product-pdfs")
            .upload(fileName, pdfFile, { contentType: "application/pdf", upsert: false });
          if (uploadErr) {
            setError(uploadErr.message);
            setUploading(false);
            return;
          }
          newPdfPath = fileName;
        } else if (removePdf) {
          newPdfPath = null;
        }

        const { data, error: err } = await supabase
          .from("products")
          .update({
            title: form.title.trim(),
            category: form.category,
            description: form.description.trim(),
            price: priceNum,
            icon: form.icon.trim() || form.icon,
            pdf_path: newPdfPath,
          })
          .eq("id", editingId)
          .select()
          .single();
        if (err) {
          if (pdfFile && newPdfPath && newPdfPath !== currentProduct?.pdf_path) {
            await supabase.storage.from("product-pdfs").remove([newPdfPath]);
          }
          setError(err.message);
          setUploading(false);
          return;
        }

        if (pdfFile && currentProduct?.pdf_path && currentProduct.pdf_path !== newPdfPath) {
          await supabase.storage.from("product-pdfs").remove([currentProduct.pdf_path]);
        } else if (removePdf && !pdfFile && currentProduct?.pdf_path) {
          await supabase.storage.from("product-pdfs").remove([currentProduct.pdf_path]);
        }

        const updatedProduct = { ...(data as Product), price: Number((data as Product).price), color: (data as Product).color || getColorForCategory((data as Product).category) };
        const updated = items.map((item) => (item.id === editingId ? updatedProduct : item));
        setItems(updated);
        setShowForm(false);
        setPdfFile(null);
        setRemovePdf(false);
      } catch (e) {
        setError((e as Error)?.message || "Failed to update product");
      } finally {
        setUploading(false);
      }
    }
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/admin/login");
      return;
    }
    try {
      const productToDelete = items.find((item) => item.id === id);
      const { error: err } = await supabase.from("products").delete().eq("id", id);
      if (err) {
        setError(err.message);
        return;
      }
      if (productToDelete?.pdf_path) {
        await supabase.storage.from("product-pdfs").remove([productToDelete.pdf_path]);
      }
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
    } catch (e) {
      setError((e as Error)?.message || "Failed to delete product");
    }
  }

  async function logout() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            PDF<span className="text-slate-800">Store.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>
            <Link href="/#products" className="hover:text-indigo-600">
              Products
            </Link>
            <Link href="/admin" className="text-indigo-700">
              Admin
            </Link>
            <Link href="/admin/orders" className="hover:text-indigo-600">
              Orders
            </Link>
            <button type="button" onClick={logout} className="hover:text-indigo-600">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Manage digital products in Supabase. Only authenticated admins can access this page (UI protected). Never expose a service-role key in browser code.
            </p>
            <p className="mt-1 text-xs text-slate-500">Hiding /admin is not sufficient - enforce RLS policies. Do not grant admin rights just for signing up.</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800"
          >
            Add Product
          </button>
        </div>

        {dbError && <p className="mt-4 text-sm text-red-600">{dbError}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600">Total Products</p>
            <p className="mt-2 text-3xl font-bold">{items.length}</p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold">Product</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Price (PKR)</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={4}>
                    Loading products...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={4}>
                    No products available. Click &quot;Add Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{product.icon}</span>
                          <div>
                            <p className="font-semibold">{product.title}</p>
                            <p className="mt-1 max-w-md text-slate-600">{product.description}</p>
                            {product.pdf_path && <p className="mt-1 text-xs text-slate-500">PDF attached (private)</p>}
                          </div>
                        </div>
                      </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">Rs. {product.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-lg border border-indigo-700 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold">{editingId === null ? "Add Product" : "Edit Product"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-600 hover:text-slate-900">
                Close
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <div>
                <label className="text-sm font-semibold">Product Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Price in PKR</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Icon or Emoji</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">PDF File (Private, PDF only, max 10 MB)</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    setError("");
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                      if (!isPdf) {
                        setError("Only PDF files are allowed.");
                        setPdfFile(null);
                        e.target.value = "";
                        return;
                      }
                      if (file.size > MAX_PDF_SIZE) {
                        setError("File size must be 10 MB or less.");
                        setPdfFile(null);
                        e.target.value = "";
                        return;
                      }
                    }
                    setPdfFile(file);
                    setRemovePdf(false);
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5"
                />
                {editingId !== null && (() => {
                  const current = items.find((i) => i.id === editingId);
                  return current?.pdf_path ? (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-600">Current file attached (private)</span>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={removePdf} onChange={(e) => { setRemovePdf(e.target.checked); if (e.target.checked) setPdfFile(null); }} />
                        <span>Remove attachment</span>
                      </label>
                    </div>
                  ) : null;
                })()}
                <p className="mt-1 text-xs text-slate-500">Files remain private. Do not create public download links. Purchase authorization required if adding downloads later.</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setPdfFile(null); setRemovePdf(false); setError(""); }} className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={saveProduct} disabled={uploading} className="rounded-xl bg-indigo-700 px-5 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">
                  {uploading ? "Uploading..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 px-6 py-7 text-center text-sm text-slate-500">
        Copyright PDFStore. All rights reserved.
      </footer>
    </main>
  );
}
