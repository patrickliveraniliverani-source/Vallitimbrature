import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { data, error } = await supabase
    .from('config')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // Auto-create default config
    const defaultConfig = {
      user_id: user.id,
      nome: "Patrick",
      sedi: [{id: "s1", label: "Valli SpA", codice: "VS"}, {id: "s2", label: "Valli & Ricci", codice: "VR"}],
      societa: [{id: "soc1", label: "Valli Holding", codice: "VH"}, {id: "soc2", label: "Valli SpA", codice: "VS"}, {id: "soc3", label: "Valli & Ricci", codice: "VR"}],
      categorie: [{id: "c1", label: "Supporto Utente", colore: "#b8451f"}, {id: "c2", label: "Infrastruttura", colore: "#1d9e75"}, {id: "c3", label: "Software/ERP", colore: "#185fa5"}, {id: "c4", label: "Progetti", colore: "#7f77dd"}],
      canali: ["Ticket", "Telefono", "Email", "Di persona", "WhatsApp"]
    };
    
    const { data: newConfig, error: insertError } = await supabase
      .from('config')
      .insert(defaultConfig)
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    data = newConfig;
  } else if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from('config')
    .upsert({ ...body, user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
