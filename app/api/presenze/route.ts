import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase.from('presenze').select('*').eq('user_id', user.id);

  if (from && to) {
    query = query.gte('data', from).lte('data', to);
  } else {
    // default today
    const today = new Date().toISOString().slice(0, 10);
    query = query.eq('data', today);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (!body.data) {
    return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
  }

  // Convert incoming timestamps to ISO strings or keep as ms if column is numeric.
  // Wait, the DB column is timestamptz. We should convert ms timestamp to ISO.
  const payload = { ...body, user_id: user.id };
  if (payload.entrata) payload.entrata = new Date(payload.entrata).toISOString();
  if (payload.uscita) payload.uscita = new Date(payload.uscita).toISOString();

  const { data, error } = await supabase
    .from('presenze')
    .upsert(payload, { onConflict: 'user_id, data' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
