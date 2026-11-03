"use client";

import { useState } from "react";
import Link from "next/link";

export default function DownloadPage() {
  const [orderRef, setOrderRef] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"ref" | "code">("ref");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderRef.trim(), action: "request_code" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setMessage(data.message || "Code requested");
      setStep("code");
    } catch (err) {
      setError((err as Error)?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndDownload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderRef.trim(), action: "verify_and_download", code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      setError((err as Error)?.message || "Failed");
    } finally {
      setLoading(false);
    }
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
      <section className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-bold">Secure PDF Download</h1>
        <p className="mt-2 text-slate-600">Downloads available only if order is marked Payment Received or Completed by admin. Never guess links.</p>
        {downloadUrl ? (
          <div className="mt-6 rounded-2xl border border-slate-200 p-6">
            <p className="font-semibold">Download ready</p>
            <p className="mt-2 text-sm text-slate-600">This link is short-lived. Do not share it.</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white">Download PDF</a>
          </div>
        ) : step === "ref" ? (
          <form onSubmit={requestCode} className="mt-6 grid gap-4 rounded-2xl border border-slate-200 p-6">
            <div>
              <label className="text-sm font-semibold">Order Reference</label>
              <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button type="submit" disabled={loading} className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Requesting..." : "Request Verification Code"}</button>
            <p className="text-xs text-slate-500">Order reference alone is not enough. A verification code is required.</p>
          </form>
        ) : (
          <form onSubmit={verifyAndDownload} className="mt-6 grid gap-4 rounded-2xl border border-slate-200 p-6">
            <div>
              <label className="text-sm font-semibold">Order Reference</label>
              <input value={orderRef} disabled className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="text-sm font-semibold">Verification Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Verifying..." : "Verify & Get Download"}</button>
            <button type="button" onClick={() => { setStep("ref"); setCode(""); setError(""); setMessage(""); }} className="text-sm text-indigo-700">Back</button>
          </form>
        )}
        <div className="mt-4">
          <Link href="/" className="text-sm text-indigo-700">← Back to Home</Link>
        </div>
      </section>
    </main>
  );
}
