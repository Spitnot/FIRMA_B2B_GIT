import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  return NextResponse.json(order);
}