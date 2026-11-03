import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function generateOrderRef() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ORD-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { productId, quantity, customerName, whatsappNumber } = body;

    if (!productId || !quantity || !customerName || !whatsappNumber) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, title, price")
      .eq("id", productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const unitPrice = Number(product.price);
    const totalAmount = unitPrice * qty;
    const orderRef = generateOrderRef();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          order_ref: orderRef,
          customer_name: String(customerName).trim(),
          whatsapp_number: String(whatsappNumber).trim(),
          product_id: product.id,
          quantity: qty,
          unit_price: unitPrice,
          total_amount: totalAmount,
          status: "Pending",
        },
      ])
      .select()
      .single();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 400 });
    }

    return NextResponse.json({ order, productTitle: product.title });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message || "Failed to create order" }, { status: 500 });
  }
}
