// shopify.service.ts
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export async function getProducts() {
  // Guard: detecta inmediatamente si las variables no llegaron
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    throw new Error(
      `Missing env vars — DOMAIN: "${SHOPIFY_DOMAIN}", TOKEN: "${SHOPIFY_TOKEN ? '[SET]' : '[MISSING]'}"`
    );
  }

  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2026-01/graphql.json`;
  console.log('[Shopify] Fetching from:', url); // Verás esto en los logs de Render

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  // LOG DETALLADO: status + body completo antes de lanzar error
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

  // Shopify puede devolver 200 con errores GraphQL dentro del body
  if (data.errors) {
    console.error('[Shopify] GraphQL errors:', JSON.stringify(data.errors));
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.products.nodes;
}
