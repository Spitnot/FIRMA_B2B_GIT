import { NextResponse } from 'next/server';
import { getProducts } from '@/services/shopify.service';

interface ShopifyVariant {
  id: string;
  sku: string;
  weight: number | null;
  metafield?: { value: string } | null;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: {
    nodes: ShopifyVariant[];
  };
}

export async function GET() {
  try {
    const products: ShopifyProduct[] = await getProducts();

    const flatProducts = products.map((p: ShopifyProduct) =>
      p.variants.nodes.map((v: ShopifyVariant) => ({
        product_id: p.id,
        title: p.title,
        sku: v.sku,
        weight: v.weight,
        wholesale_price: v.metafield?.value ? parseFloat(v.metafield.value) : 0,
      }))
    ).flat();

    return NextResponse.json(flatProducts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /products]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
