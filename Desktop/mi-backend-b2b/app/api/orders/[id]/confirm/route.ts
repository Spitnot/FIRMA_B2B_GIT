import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getShippingQuote } from '@/services/packlink.service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  // 1. Obtener pedido con dirección del cliente
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (direccion_envio)
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  if (order.status !== 'draft') {
    return NextResponse.json({ error: 'El pedido no está en borrador' }, { status: 400 });
  }

  if (order.peso_total <= 0) {
    return NextResponse.json({ error: 'El pedido no tiene peso' }, { status: 400 });
  }

  try {
    // 2. Cotizar envío
    const quote = await getShippingQuote(order.peso_total, order.customers.direccion_envio);

    // 3. Actualizar pedido a 'confirmado'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmado',
        coste_envio_estimado: quote.price,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al confirmar pedido o cotizar envío' }, { status: 500 });
  }
}