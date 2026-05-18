'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { Chip } from '@/components/ui/Chip';
import { fmtDate, fmtTime } from '@/lib/utils';

export default function InterventiPage() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const { data: configData } = useSWR('/api/config', fetcher);
  const { data: interventiData, mutate } = useSWR('/api/interventi', fetcher);

  const config = configData || { categorie: [], societa: [], canali: [] };
  const interventi = Array.isArray(interventiData) ? interventiData : [];

  const empty = { descrizione: "", categoria: "", societa: "", canale: "", richiedente: "", durata_min: 15, note: "", ts: Date.now() };
  const [form, setForm] = useState(empty);
  const [timerOn, setTimerOn] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const [lista, setLista] = useState(false);

  useEffect(() => { if (descRef.current && !lista) descRef.current.focus(); }, [lista]);

  useEffect(() => {
    if (timerOn) { timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000); }
    else if (timerRef.current) { clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  const richiedentiSuggeriti = [...new Set(interventi.map((i:any) => i.richiedente).filter(Boolean))];

  const salva = async (nuovoForm = true) => {
    if (!form.descrizione.trim()) { showToast("Inserisci una descrizione"); return; }
    const dur = timerOn || timerSec > 0 ? Math.round(timerSec / 60) || 1 : (form.durata_min || 0);
    const item = { ...form, durata_min: dur };
    
    // Optimistic update (id will be replaced by server)
    const tempId = Date.now().toString();
    const optimisticItem = { ...item, id: tempId, ts: new Date(item.ts).toISOString() };
    await mutate([optimisticItem, ...interventi], { revalidate: false });

    await apiRequest('/api/interventi', 'POST', item);
    await mutate();

    showToast("Intervento salvato ✓");
    setTimerOn(false); setTimerSec(0);
    if (nuovoForm) { setForm({ ...empty, ts: Date.now() }); setTimeout(() => { if (descRef.current) descRef.current.focus(); }, 50); }
    else { setForm(empty); setLista(true); }
  };

  const elimina = async (id: string) => {
    await mutate(interventi.filter((i:any) => i.id !== id), { revalidate: false });
    await apiRequest(`/api/interventi?id=${id}`, 'DELETE');
    await mutate();
    showToast("Eliminato");
  };

  if (!configData || !interventiData) return <div>Caricamento...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, margin: 0 }}>Nuovo intervento IT</h2>
        <button className="btn-ghost" onClick={() => setLista(!lista)}>{lista ? "Nuovo" : "Storico"} ({interventi.length})</button>
      </div>

      {!lista ? (
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Descrizione *</label>
            <input ref={descRef} value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} placeholder="Es. Reset password Mario Rossi" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Categoria</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {config.categorie.map((c:any) => (
                <Chip key={c.id} label={c.label} active={form.categoria === c.id} color={c.colore}
                  onClick={() => setForm({ ...form, categoria: form.categoria === c.id ? "" : c.id })} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Centro di costo / Società</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {config.societa.map((s:any) => (
                <Chip key={s.id} label={`${s.label} (${s.codice})`} active={form.societa === s.id}
                  onClick={() => setForm({ ...form, societa: form.societa === s.id ? "" : s.id })} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Canale di richiesta</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {config.canali.map((c:string) => (
                <Chip key={c} label={c} active={form.canale === c} onClick={() => setForm({ ...form, canale: form.canale === c ? "" : c })} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Richiedente</label>
            <input list="rich-list" value={form.richiedente} onChange={e => setForm({ ...form, richiedente: e.target.value })} placeholder="Nome richiedente" />
            <datalist id="rich-list">{richiedentiSuggeriti.map((r:any) => <option key={r} value={r} />)}</datalist>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Durata (minuti)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, marginBottom: 6 }}>
              {[5, 10, 15, 30, 45, 60, 90, 120].map(d => (
                <Chip key={d} label={d + "m"} active={form.durata_min === d} onClick={() => setForm({ ...form, durata_min: d })} />
              ))}
            </div>
            <input type="number" value={form.durata_min} onChange={e => setForm({ ...form, durata_min: parseInt(e.target.value) || 0 })} style={{ width: 90 }} min={1} />
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <button className={timerOn ? "btn-primary" : "btn-secondary"} onClick={() => setTimerOn(!timerOn)} style={{ padding: "6px 14px", fontSize: 12 }}>
                {timerOn ? "⏹ Stop timer" : "▶ Avvia timer"}
              </button>
              {(timerOn || timerSec > 0) && (
                <span className="mono" style={{ fontSize: 16, color: "var(--accent)" }}>
                  {Math.floor(timerSec / 60).toString().padStart(2, "0")}:{(timerSec % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Note (opzionali)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Note aggiuntive..." />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => salva(true)} style={{ flex: 2, padding: "12px" }}>Salva e nuovo</button>
            <button className="btn-secondary" onClick={() => salva(false)} style={{ flex: 1 }}>Salva</button>
          </div>
        </div>
      ) : (
        <div>
          {interventi.length === 0 && <p style={{ color: "var(--muted)", fontSize: 14 }}>Nessun intervento registrato.</p>}
          {interventi.slice(0, 50).map((item:any) => {
            const cat = config.categorie.find((c:any) => c.id === item.categoria);
            const soc = config.societa.find((s:any) => s.id === item.societa);
            const itemTs = new Date(item.ts).getTime();
            return (
              <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{item.descrizione}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {cat && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: cat.colore + "22", color: cat.colore, border: `1px solid ${cat.colore}44` }}>{cat.label}</span>}
                      {soc && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "var(--chip)" }}>{soc.label}</span>}
                      {item.canale && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "var(--chip)" }}>{item.canale}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 10 }}>
                    <div className="mono" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{item.durata_min}m</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDate(itemTs)} {fmtTime(itemTs)}</div>
                    <button onClick={() => elimina(item.id)} style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>✕</button>
                  </div>
                </div>
                {item.richiedente && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>→ {item.richiedente}</div>}
                {item.note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, fontStyle: "italic" }}>{item.note}</div>}
              </div>
            );
          })}
        </div>
      )}
      
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, zIndex: 999, fontFamily: "var(--font-sans)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
