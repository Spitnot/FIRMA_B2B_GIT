import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getProductBySku } from '@/services/shopify.service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { sku, cantidad } = await request.json();

  if (!sku || !cantidad || cantidad <= 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // 1. Verificar estado del pedido (Solo draft)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, customer_id!inner(auth_user_id)')
    .eq('id', params.id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  
  // Verificación de ownership implícita en la query si RLS funciona, pero doble check:
  const { data: { user } } = await supabase.auth.getUser();
  if (order.customer_id.auth_user_id !== user?.id) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden añadir items a pedidos en borrador' }, { status: 400 });
  }

  // 2. Obtener datos de Shopify (Congelamiento)
  const variant = await getProductBySku(sku);
  if (!variant || !variant.metafield) {
    return NextResponse.json({ error: 'Producto no encontrado o sin precio mayorista' }, { status: 404 });
  }

  const precioUnitario = parseFloat(variant.metafield.value);
  const pesoUnitario = variant.weight;

  // 3. Insertar Item
  const { error: insertError } = await supabase.from('order_items').insert({
    order_id: params.id,
    sku: sku,
    nombre_producto: `Producto ${sku}`, // Se podría mejorar titulando desde Shopify
    cantidad: cantidad,
    precio_unitario: precioUnitario,
    peso_unitario: pesoUnitario,
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // 4. Recalcular totales del pedido (SQL triggers sería lo ideal, pero lo haremos manual para simplicidad)
  // Nota: En producción estricta usar Trigger de BD, aquí actualizamos tras insertar.
  const { data: totals } = await supabase
    .from('order_items')
    .select('cantidad, precio_unitario, peso_unitario')
    .eq('order_id', params.id);

  const totalProductos = totals!.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const pesoTotal = totals!.reduce((sum, item) => sum + (item.cantidad * item.peso_unitario), 0);

  await supabase
    .from('orders')
    .update({ 
      total_productos: totalProductos,
      peso_total: pesoTotal 
    })
    .eq('id', params.id);

  return NextResponse.json({ success: true });
}