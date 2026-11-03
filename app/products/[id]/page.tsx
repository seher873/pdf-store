"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { getWhatsAppUrl, initialProducts, getColorForCategory } from "@/data/products";
import type { Product } from "@/data/products";

function ProductDetailsPageInner() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const product = Number.isNaN(id)
    ? null
    : initialProducts.find((item) => item.id === id) ?? null;

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-slate-800">
        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
              PDF<span className="text-slate-800">Store.</span>
            </Link>
          </div>
        </header>
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold">Product Not Found</h1>
          <p className="mt-4 text-slate-600">
            We could not find a product with this ID. Please check the URL or go back to browse all products.
          </p>
          <div className="mt-8">
            <Link href="/" className="inline-flex rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition hover:bg-indigo-800">
              Back to Products
            </Link>
          </div>
        </section>
        <footer className="border-t border-slate-200 px-6 py-7 text-center text-sm text-slate-500">
          Copyright PDFStore. All rights reserved.
        </footer>
      </main>
    );
  }

  function orderOnWhatsApp() {
    const url = getWhatsAppUrl(product as Product);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            PDF<span className="text-slate-800">Store.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">Home</Link>
            <Link href="/#products" className="hover:text-indigo-600">Products</Link>
            <Link href="/#about" className="hover:text-indigo-600">About</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-800">
            ← Back to Products
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div className={`${product.color || getColorForCategory(product.category)} flex h-80 items-center justify-center rounded-3xl`}>
            <span className="text-8xl" role="img" aria-label={product.category}>
              {product.icon}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {product.category}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {product.description}
            </p>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-3xl font-bold">Rs. {product.price}</span>
              <span className="text-slate-500">PKR</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" onClick={orderOnWhatsApp} className="rounded-xl bg-indigo-700 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-800">
                Order on WhatsApp
              </button>
              <Link href="/" className="rounded-xl border border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50">
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-7 text-center text-sm text-slate-500">
        Copyright PDFStore. All rights reserved.
      </footer>
    </main>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white"><div className="p-6">Loading...</div></main>}>
      <ProductDetailsPageInner />
    </Suspense>
  );
}
