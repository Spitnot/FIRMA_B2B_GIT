// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getProducts } from '@/services/shopify.service';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /products]', message);
    // En producción puedes quitar el detalle del error si es sensible
    return NextResponse.json({ error: message }, { status: 500 });
  }
}