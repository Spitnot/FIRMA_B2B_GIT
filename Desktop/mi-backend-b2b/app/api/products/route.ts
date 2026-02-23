import { NextResponse } from 'next/server';
import { getProducts } from '@/services/shopify.service';

export async function GET() {
  try {
    const products = await getProducts();
    // Formatear respuesta simple para el frontend
    const flatProducts = products.map(p => 
      p.variants.nodes.map(v => ({
        product_id: p.id,
        title: p.title,
        sku: v.sku,
        weight: v.weight,
        wholesale_price: v.metafield?.value ? parseFloat(v.metafield.value) : 0,
      }))
    ).flat();

    return NextResponse.json(flatProducts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 });
  }
}