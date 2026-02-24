// shopify.service.ts
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export async function getProducts() {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    throw new Error(
      `Missing env vars — DOMAIN: "${SHOPIFY_DOMAIN}", TOKEN: "${SHOPIFY_TOKEN ? '[SET]' : '[MISSING]'}"`
    );
  }

  const query = `
  {
    products(first: 50) {
      nodes {
        id
        title
        variants(first: 10) {
          nodes {
            id
            sku
            inventoryItem {
              measurement {
                weight {
                  value
                  unit
                }
              }
            }
            metafield(namespace: "wholesale", key: "price") {
              value
            }
          }
        }
      }
    }
  }
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Shopify] Error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Shopify API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error('[Shopify] GraphQL errors:', JSON.stringify(data.errors));
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.products.nodes;
}

// Tipo explícito para que TypeScript no se queje en route.ts
export interface ShopifyVariantResult {
  product: any;
  variant: any;
  metafield: { value: string } | null;
  weight: number | null;
}

export async function getProductBySku(sku: string): Promise<ShopifyVariantResult | null> {
  const products = await getProducts();

  for (const product of products) {
    const variant = product.variants.nodes.find(
      (v: { sku: string }) => v.sku === sku
    );

    if (variant) {
  return {
    product,
    variant,
    metafield: variant.metafield ?? null,
    weight: variant.inventoryItem?.measurement?.weight?.value ?? null,
  };
}
  return null;
}
