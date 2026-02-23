const PACKLINK_API_KEY = process.env.PACKLINK_API_KEY!;
const PACKLINK_BASE_URL = 'https://api.packlink.com'; // URL ejemplo, ajustar a documentación real

export interface QuoteResponse {
  price: number;
  service_name: string;
}

export interface ShipmentResponse {
  shipment_id: string;
  tracking_url: string;
  label_pdf_url: string;
}

export async function getShippingQuote(weightKg: number, toAddress: any): Promise<QuoteResponse> {
  // Lógica simplificada de llamada a API
  const response = await fetch(`${PACKLINK_BASE_URL}/shipments/quote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PACKLINK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { country: 'ES' }, // Configuración de origen fija
      to: toAddress,
      packages: [{ weight: weightKg }],
    }),
  });

  if (!response.ok) throw new Error('Error getting shipping quote');
  
  // Adaptar al response real de Packlink
  return await response.json(); 
}

export async function createShipment(orderId: string, weightKg: number, toAddress: any): Promise<ShipmentResponse> {
  const response = await fetch(`${PACKLINK_BASE_URL}/shipments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PACKLINK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: orderId,
      from: { country: 'ES' },
      to: toAddress,
      packages: [{ weight: weightKg }],
      // Otros campos requeridos por Packlink
    }),
  });

  if (!response.ok) throw new Error('Error creating shipment');

  return await response.json();
}