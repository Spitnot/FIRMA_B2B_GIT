const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

interface ShopifyVariant {
  id: string;
  sku: string | null;
  weight: number;
  metafield: { value: string } | null;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: { nodes: ShopifyVariant[] };
}

export async function getProducts(): Promise<ShopifyProduct[]> {
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
              weight
              metafield(namespace: "wholesale", key: "price") {
                value
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) throw new Error('Error fetching from Shopify');

  const data = await response.json();
  return data.data.products.nodes;
}

export async function getProductBySku(sku: string): Promise<ShopifyVariant | null> {
  const products = await getProducts();
  for (const product of products) {
    const variant = product.variants.nodes.find(v => v.sku === sku);
    if (variant) return variant;
  }
  return null;
}