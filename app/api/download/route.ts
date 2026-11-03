import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function generateCode() {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server not fully configured" }, { status: 500 });
    }

    const body = await req.json();
    const { orderRef, action, code } = body;

    if (!orderRef) {
      return NextResponse.json({ error: "Order reference required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (action === "request_code") {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_ref, status, product_id")
        .eq("order_ref", orderRef)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status !== "Payment Received" && order.status !== "Completed") {
        return NextResponse.json({ error: "Download not available. Order must be marked Payment Received or Completed by admin." }, { status: 403 });
      }

      const codeVal = generateCode();
      const expiryMinutes = Number(process.env.DOWNLOAD_CODE_EXPIRY_MINUTES || 10);
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

      const { error: updErr } = await supabase
        .from("orders")
        .update({ download_code: codeVal, download_code_expires_at: expiresAt, download_code_used_at: null })
        .eq("id", order.id);

      if (updErr) {
        return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
      }

      // In production send via email/SMS. For prototype return code only if explicitly needed - but avoid logging
      return NextResponse.json({ message: "Verification code generated. Contact admin or check configured channel." });
    }

    if (action === "verify_and_download") {
      if (!code) {
        return NextResponse.json({ error: "Verification code required" }, { status: 400 });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_ref, status, product_id, download_code, download_code_expires_at, download_code_used_at")
        .eq("order_ref", orderRef)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status !== "Payment Received" && order.status !== "Completed") {
        return NextResponse.json({ error: "Download not available" }, { status: 403 });
      }

      if (!order.download_code || order.download_code !== String(code).trim()) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }

      if (order.download_code_used_at) {
        return NextResponse.json({ error: "Code already used" }, { status: 401 });
      }

      if (!order.download_code_expires_at || new Date(order.download_code_expires_at) < new Date()) {
        return NextResponse.json({ error: "Code expired" }, { status: 401 });
      }

      const { data: product } = await supabase.from("products").select("id, pdf_path").eq("id", order.product_id).single();
      if (!product?.pdf_path) {
        return NextResponse.json({ error: "No PDF attached to this product" }, { status: 404 });
      }

      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const expirySeconds = Number(process.env.SIGNED_URL_EXPIRY_SECONDS || 300);
      const { data: signed, error: signErr } = await adminClient.storage
        .from("product-pdfs")
        .createSignedUrl(product.pdf_path, expirySeconds);

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
      }

      await supabase.from("orders").update({ download_code_used_at: new Date().toISOString() }).eq("id", order.id);

      return NextResponse.json({ downloadUrl: signed.signedUrl });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message || "Failed" }, { status: 500 });
  }
}
