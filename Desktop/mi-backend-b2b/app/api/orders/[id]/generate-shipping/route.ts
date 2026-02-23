import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createShipment } from '@/services/packlink.service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // 1. Verificar estado y datos
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (direccion_envio)
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  // Restricción estricta de estado
  if (order.status !== 'listo_envio') {
    return NextResponse.json({ error: 'El pedido debe estar en estado "listo_envio"' }, { status: 400 });
  }

  try {
    // 2. Crear envío real en Packlink
    const shipment = await createShipment(order.id, order.peso_total, order.customers.direccion_envio);

    // 3. Actualizar pedido con Tracking y cambiar a 'enviado'
    const { data: finalOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'enviado',
        packlink_shipment_id: shipment.shipment_id,
        tracking_url: shipment.tracking_url,
        coste_envio_final: order.coste_envio_estimado, // Asumimos que el costo se mantiene
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(finalOrder);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error generando envío con Packlink' }, { status: 500 });
  }
}