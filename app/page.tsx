"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import type { Product } from "@/types/product";
import { getColorForCategory } from "@/types/product";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadProducts() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
        setLoading(false);
        return;
      }
      try {
      const { data, error: dbError } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }
      const mapped = (data || []).map((p) => ({
        ...(p as Product),
        price: Number((p as Product).price),
        color: (p as Product).color || getColorForCategory((p as Product).category),
      }));
      setProducts(mapped);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load products");
    } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });



  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            PDF<span className="text-slate-800">Store.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <a href="#home" className="hover:text-indigo-600">Home</a>
            <a href="#products" className="hover:text-indigo-600">Products</a>
            <a href="#about" className="hover:text-indigo-600">About</a>
            <Link href="/admin" className="hover:text-indigo-600">Admin</Link>
          </nav>
        </div>
      </header>

      <section id="home" className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">Learn smarter, every day</span>
            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Quality learning<span className="block text-indigo-700">at your fingertips.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Discover useful PDF notes, e-books and printable worksheets to make learning easier and more enjoyable.
            </p>
            <a href="#products" className="mt-8 inline-flex rounded-xl bg-indigo-700 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-800">Explore Products →</a>
            <p className="mt-4 text-sm text-slate-500">Digital resources • Convenient ordering • PDF format</p>
          </div>
          <div className="rounded-3xl bg-indigo-100 p-8 md:p-12">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <div className="text-6xl">📚</div>
              <h2 className="mt-5 text-2xl font-bold">Your learning library</h2>
              <p className="mt-3 leading-7 text-slate-600">Notes, guides and worksheets designed to support your learning journey.</p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-blue-50 px-3 py-2">PDF Notes</span>
                <span className="rounded-lg bg-purple-50 px-3 py-2">E-books</span>
                <span className="rounded-lg bg-green-50 px-3 py-2">Worksheets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="font-semibold text-indigo-700">OUR COLLECTION</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Explore our products</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">Find helpful digital resources for study and practice.</p>
        </div>
        <div className="mx-auto mb-6 max-w-md">
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes, books, worksheets..." className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" aria-label="Search products" />
        </div>
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {["All", "Worksheets", "Study Notes", "E-books"].map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "rounded-full px-5 py-2.5 text-sm font-semibold transition bg-indigo-700 text-white" : "rounded-full px-5 py-2.5 text-sm font-semibold transition border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50"}>{category}</button>
          ))}
        </div>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="mt-12 text-center text-slate-600">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-12 text-center text-slate-600">No products found.</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product: Product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`${product.color || getColorForCategory(product.category)} flex h-44 items-center justify-center`}>
                  <span className="text-6xl" role="img" aria-label={product.category}>{product.icon}</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{product.category}</p>
                  <h3 className="mt-2 text-lg font-bold">{product.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{product.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg font-bold">Rs. {product.price}</span>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`} className="rounded-lg border border-indigo-700 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">View Details</Link>
                    <Link href={`/order/${product.id}`} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Order Now</Link>
                  </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-slate-500">Sample products and prices — replace these with the client&apos;s real products.</p>
      </section>

      <section id="about" className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">Learning made simpler</h2>
          <p className="mt-4 leading-7 text-slate-600">We aim to make useful learning resources easy to discover and order. Choose your resource and contact us on WhatsApp to place an order.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-7 text-center text-sm text-slate-500">Copyright PDFStore. All rights reserved.</footer>
    </main>
  );
}
