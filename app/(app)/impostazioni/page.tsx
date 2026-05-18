'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, apiRequest } from '@/lib/fetcher';

export default function ImpostazioniPage() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const { data: configData, mutate } = useSWR('/api/config', fetcher);
  
  const [local, setLocal] = useState<any>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (configData && !local) {
      setLocal(JSON.parse(JSON.stringify(configData)));
    }
  }, [configData, local]);

  if (!configData || !local) return <div>Caricamento...</div>;

  const aggSede = () => setLocal((c:any) => ({ ...c, sedi: [...c.sedi, { id: "S" + Date.now(), label: "Nuova sede", codice: "NS" }] }));
  const aggSocieta = () => setLocal((c:any) => ({ ...c, societa: [...c.societa, { id: "X" + Date.now(), label: "Nuova società", codice: "NS" }] }));
  const aggCategoria = () => setLocal((c:any) => ({ ...c, categorie: [...c.categorie, { id: "k" + Date.now(), label: "Nuova categoria", colore: "#888" }] }));

  const salva = async () => {
    await mutate(local, { revalidate: false });
    await apiRequest('/api/config', 'PUT', local);
    await mutate();
    showToast("Impostazioni salvate ✓");
  };

  const cancellaTutto = async () => {
    // We would need an API to wipe all data. Since it's not requested explicitly by API,
    // and this is just the prototype feature, we'd need to create a delete route or skip it.
    // For now, let's keep the UI but we'll show a message that it's disabled or we can implement it.
    showToast("Funzione cancella tutto non implementata lato server al momento");
    setConfirm(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginBottom: 16 }}>Impostazioni</h2>
      
      <div className="card" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>Nome (per export)</label>
        <input value={local.nome} onChange={e => setLocal((l:any) => ({ ...l, nome: e.target.value }))} style={{ marginTop: 4, width: 200 }} />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Sedi</span>
          <button className="btn-ghost" onClick={aggSede} style={{ padding: "4px 10px", fontSize: 12 }}>+ Aggiungi</button>
        </div>
        {local.sedi.map((s:any, i:number) => (
          <div key={s.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <input value={s.label} onChange={e => setLocal((l:any) => ({ ...l, sedi: l.sedi.map((x:any, j:number) => j === i ? { ...x, label: e.target.value } : x) }))} placeholder="Nome sede" style={{ flex: 2 }} />
            <input value={s.codice} onChange={e => setLocal((l:any) => ({ ...l, sedi: l.sedi.map((x:any, j:number) => j === i ? { ...x, codice: e.target.value } : x) }))} placeholder="Cod." style={{ flex: 1, maxWidth: 60 }} />
            <button onClick={() => setLocal((l:any) => ({ ...l, sedi: l.sedi.filter((_:any, j:number) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Società / Centri di costo</span>
          <button className="btn-ghost" onClick={aggSocieta} style={{ padding: "4px 10px", fontSize: 12 }}>+ Aggiungi</button>
        </div>
        {local.societa.map((s:any, i:number) => (
          <div key={s.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <input value={s.label} onChange={e => setLocal((l:any) => ({ ...l, societa: l.societa.map((x:any, j:number) => j === i ? { ...x, label: e.target.value } : x) }))} style={{ flex: 2 }} />
            <input value={s.codice} onChange={e => setLocal((l:any) => ({ ...l, societa: l.societa.map((x:any, j:number) => j === i ? { ...x, codice: e.target.value } : x) }))} style={{ flex: 1, maxWidth: 60 }} />
            <button onClick={() => setLocal((l:any) => ({ ...l, societa: l.societa.filter((_:any, j:number) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Categorie intervento</span>
          <button className="btn-ghost" onClick={aggCategoria} style={{ padding: "4px 10px", fontSize: 12 }}>+ Aggiungi</button>
        </div>
        {local.categorie.map((c:any, i:number) => (
          <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <input type="color" value={c.colore} onChange={e => setLocal((l:any) => ({ ...l, categorie: l.categorie.map((x:any, j:number) => j === i ? { ...x, colore: e.target.value } : x) }))} style={{ width: 36, height: 32, padding: 2, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }} />
            <input value={c.label} onChange={e => setLocal((l:any) => ({ ...l, categorie: l.categorie.map((x:any, j:number) => j === i ? { ...x, label: e.target.value } : x) }))} style={{ flex: 1 }} />
            <button onClick={() => setLocal((l:any) => ({ ...l, categorie: l.categorie.filter((_:any, j:number) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Canali di richiesta</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {local.canali.map((c:any, i:number) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 16, background: "var(--chip)", border: "1px solid var(--border)", fontSize: 13 }}>
              {c}<button onClick={() => setLocal((l:any) => ({ ...l, canali: l.canali.filter((_:any, j:number) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 0 }}>✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="new-canale" placeholder="Nuovo canale..." style={{ flex: 1 }} onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) { setLocal((l:any) => ({ ...l, canali: [...l.canali, e.currentTarget.value.trim()] })); e.currentTarget.value = ""; } }} />
          <button className="btn-secondary" onClick={() => { const el = document.getElementById("new-canale") as HTMLInputElement; if (el.value.trim()) { setLocal((l:any) => ({ ...l, canali: [...l.canali, el.value.trim()] })); el.value = ""; } }}>Aggiungi</button>
        </div>
      </div>

      <button className="btn-primary" onClick={salva} style={{ width: "100%", marginBottom: 12 }}>Salva impostazioni</button>

      {!confirm ? (
        <button className="btn-secondary" onClick={() => setConfirm(true)} style={{ width: "100%", color: "#c0392b", borderColor: "#c0392b" }}>Cancella tutti i dati...</button>
      ) : (
        <div style={{ background: "#fff0ee", border: "1px solid #c0392b", borderRadius: 8, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#c0392b", marginBottom: 10 }}>Sei sicuro? Questa operazione è irreversibile.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={cancellaTutto} style={{ flex: 1, background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13 }}>Sì, cancella tutto</button>
            <button className="btn-secondary" onClick={() => setConfirm(false)} style={{ flex: 1 }}>Annulla</button>
          </div>
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
