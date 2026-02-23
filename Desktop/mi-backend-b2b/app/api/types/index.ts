export interface Order {
  id: string;
  customer_id: string;
  status: 'draft' | 'confirmado' | 'produccion' | 'listo_envio' | 'enviado' | 'cancelado';
  total_productos: number;
  peso_total: number;
  coste_envio_estimado: number | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  peso_unitario: number;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  variants: {
    nodes: Array<{
      sku: string | null;
      weight: number;
      price: string; // Precio retail (no usaremos este, sino el metafield)
      metafield?: { value: string } | null;
    }>;
  };
}