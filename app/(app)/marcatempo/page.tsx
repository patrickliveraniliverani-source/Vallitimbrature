'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { Chip } from '@/components/ui/Chip';
import { BigBtn } from '@/components/ui/BigBtn';
import { fmtDate, fmtTime, minsToHHMM, netMins, parseTimeInput, todayStr } from '@/lib/utils';

export default function MarcatempoPage() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const { data: configData, error: configError } = useSWR('/api/config', fetcher);
  
  // Per SWR, passiamo array di argomenti o una singola stringa.
  // Vogliamo le presenze di oggi.
  const today = todayStr();
  const { data: presenzeData, error: presenzeError, mutate } = useSWR(`/api/presenze?from=${today}&to=${today}`, fetcher);

  const [editTime, setEditTime] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [showCambioSede, setShowCambioSede] = useState(false);
  
  // Default config
  const config = configData || { sedi: [] };
  const presenze = Array.isArray(presenzeData) ? presenzeData : [];
  const g = presenze.find((p: any) => p.data === today) || {};
  
  const [nuovaSede, setNuovaSede] = useState(config.sedi[0]?.id || "");

  const stato = !g.entrata ? "fuori" : g.uscita ? "uscito" : g.pause?.some((p:any) => p.inizio && !p.fine) ? "pausa" : "in_servizio";

  const now = () => Date.now();

  const upd = async (patch: any) => {
    const ng = { ...g, ...patch, data: today };
    // Optimistic update
    const updatedPresenze = presenze.filter((p:any) => p.data !== today).concat([ng]);
    await mutate(updatedPresenze, { revalidate: false });
    await apiRequest('/api/presenze', 'POST', ng);
    await mutate();
  };

  const timbra = async (tipo: string) => {
    const ts = now();
    if (tipo === "entrata") { await upd({ entrata: ts, sede_corrente: config.sedi[0]?.id, sessioni: [{ sede: config.sedi[0]?.id, inizio: ts }] }); }
    if (tipo === "inizio_pausa") { const pause = [...(g.pause || [])]; pause.push({ inizio: ts }); await upd({ pause }); }
    if (tipo === "fine_pausa") { const pause = (g.pause || []).map((p:any) => !p.fine && p.inizio ? { ...p, fine: ts } : p); await upd({ pause }); }
    if (tipo === "uscita") { await upd({ uscita: ts }); }
    if (tipo === "cambio_sede") { setShowCambioSede(true); return; }
    showToast("Timbrato ✓");
  };

  const confermaCambioSede = async () => {
    const ts = now();
    const sessioni = [...(g.sessioni || [])];
    if (sessioni.length > 0) sessioni[sessioni.length - 1].fine = ts;
    sessioni.push({ sede: nuovaSede, inizio: ts });
    await upd({ sede_corrente: nuovaSede, sessioni });
    setShowCambioSede(false);
    showToast("Sede aggiornata ✓");
  };

  const sediDelGiorno = () => {
    const ids = [...new Set((g.sessioni || []).map((s:any) => s.sede))];
    return ids.map((id:any) => config.sedi.find((s:any) => s.id === id)?.label || id).join(", ");
  };

  const pauseTot = () => (g.pause || []).reduce((a:number, p:any) => a + (p.fine && p.inizio ? (p.fine - p.inizio) / 60000 : 0), 0);
  const netH = netMins(g);

  const startEdit = (campo: string, val: any) => {
    // Parse Date. Se val è ISO o ms funziona uguale (se usiamo new Date()).
    // Attenzione: Supabase restituisce ISO (o date object). Se ISO: 
    const ts = val ? new Date(val).getTime() : null;
    setEditTime(campo); 
    setEditVal(fmtTime(ts)); 
  };
  
  const saveEdit = async () => {
    const baseDate = g.entrata ? new Date(g.entrata).getTime() : Date.now();
    const ts = parseTimeInput(editVal, baseDate);
    if (!ts) { setEditTime(null); return; }
    if (editTime === "entrata") await upd({ entrata: ts });
    else if (editTime === "uscita") await upd({ uscita: ts });
    setEditTime(null);
    showToast("Orario aggiornato");
  };

  if (configError) return <div style={{ padding: 20, color: 'red' }}>Errore configurazione: {String(configError.message)}</div>;
  if (presenzeError) return <div style={{ padding: 20, color: 'red' }}>Errore presenze: {String(presenzeError.message)}</div>;
  if (!configData || !presenzeData) return <div style={{ padding: 20, color: 'var(--muted)' }}>Caricamento in corso...</div>;

  // convert ISO back to ms for UI
  const entrataMs = g.entrata ? new Date(g.entrata).getTime() : null;
  const uscitaMs = g.uscita ? new Date(g.uscita).getTime() : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--text)", margin: 0 }}>
          {fmtDate(Date.now())} — {stato === "fuori" ? "Non in servizio" : stato === "in_servizio" ? "In servizio" : stato === "pausa" ? "In pausa" : "Uscito"}
        </h2>
        <button className="btn-secondary" onClick={() => mutate()} style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          Aggiorna
        </button>
      </div>

      {entrataMs && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
          <span style={{ fontSize: 13, color: "var(--muted)", minWidth: 80 }}>Entrata</span>
          {editTime === "entrata" ? (
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              <input type="time" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1 }} autoFocus />
              <button className="btn-primary" onClick={saveEdit} style={{ padding: "4px 12px", fontSize: 13 }}>✓</button>
              <button className="btn-secondary" onClick={() => setEditTime(null)} style={{ padding: "4px 10px", fontSize: 13 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{fmtTime(entrataMs)}</span>
              <button className="btn-ghost" onClick={() => startEdit("entrata", entrataMs)} style={{ padding: "3px 10px", fontSize: 12 }}>Modifica</button>
            </div>
          )}
        </div>
      )}

      {stato === "fuori" && <BigBtn label="Entrata in servizio" onClick={() => timbra("entrata")} />}
      {stato === "in_servizio" && <>
        <BigBtn label="Inizio pausa pranzo" onClick={() => timbra("inizio_pausa")} />
        <BigBtn label="Cambio sede →" onClick={() => timbra("cambio_sede")} sub={`Sede attuale: ${config.sedi.find((s:any) => s.id === g.sede_corrente)?.label || "—"}`} />
        <BigBtn label="Uscita" onClick={() => timbra("uscita")} />
      </>}
      {stato === "pausa" && <BigBtn label="Fine pausa pranzo" onClick={() => timbra("fine_pausa")} />}
      {stato === "uscito" && (
        <>
          <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>
            Giornata conclusa — {minsToHHMM(netH)} nette
          </div>
          <button onClick={() => upd({ uscita: null })} className="btn-ghost" style={{ width: "100%", padding: "12px", fontSize: 14, marginBottom: 16 }}>
            🔙 Riprendi turno (annulla uscita)
          </button>
        </>
      )}

      {showCambioSede && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Seleziona nuova sede</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {config.sedi.map((s:any) => (
              <Chip key={s.id} label={s.label} active={nuovaSede === s.id} onClick={() => setNuovaSede(s.id)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={confermaCambioSede} style={{ flex: 1, padding: "10px" }}>Conferma</button>
            <button className="btn-secondary" onClick={() => setShowCambioSede(false)}>Annulla</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[["Entrata", "entrata", entrataMs], ["Uscita", "uscita", uscitaMs]].map(([l, k, v]) => (
            <div key={k as string}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{l as string}</div>
              {editTime === k ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="time" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn-primary" onClick={saveEdit} style={{ padding: "4px 10px", fontSize: 12 }}>✓</button>
                </div>
              ) : (
                <div className="mono" style={{ fontSize: 22, cursor: "pointer" }} onClick={() => startEdit(k as string, v)}>
                  {fmtTime(v as any)} <span style={{ fontSize: 12, color: "var(--muted)" }}>✎</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
          <div><div style={{ color: "var(--muted)", fontSize: 12 }}>Pause</div><span className="mono">{minsToHHMM(pauseTot())}</span></div>
          <div><div style={{ color: "var(--muted)", fontSize: 12 }}>Ore nette</div><span className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>{minsToHHMM(netH)}</span></div>
          <div><div style={{ color: "var(--muted)", fontSize: 12 }}>Sedi</div><span style={{ fontSize: 12 }}>{sediDelGiorno() || "—"}</span></div>
        </div>
      </div>

      {(g.sessioni || []).length > 1 && (
        <div className="card" style={{ marginTop: 10, fontSize: 13 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>Sessioni della giornata</div>
          {(g.sessioni || []).map((s:any, i:number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < (g.sessioni || []).length - 1 ? "1px solid var(--border)" : "none" }}>
              <span>{config.sedi.find((x:any) => x.id === s.sede)?.label || s.sede}</span>
              <span className="mono">{fmtTime(s.inizio)} → {s.fine ? fmtTime(s.fine) : "in corso"}</span>
            </div>
          ))}
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
