'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Chip } from '@/components/ui/Chip';
import { fmtDate, fmtTime, minsToHHMM, netMins } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function ReportPage() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const [periodo, setPeriodo] = useState("oggi");

  const { data: configData } = useSWR('/api/config', fetcher);
  // Fetch all for report
  const { data: presenzeData } = useSWR('/api/presenze?from=2000-01-01&to=2100-01-01', fetcher);
  const { data: interventiData } = useSWR('/api/interventi', fetcher);

  if (!configData || !presenzeData || !interventiData) return <div>Caricamento...</div>;

  const config = configData;
  const presenze = Array.isArray(presenzeData) ? presenzeData : [];
  const interventi = Array.isArray(interventiData) ? interventiData : [];

  const filterDate = (ts: number) => {
    const d = new Date(ts);
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    if (periodo === "oggi") { const s = new Date(); s.setHours(0, 0, 0, 0); return d >= s; }
    if (periodo === "settimana") { const s = new Date(oggi); s.setDate(s.getDate() - s.getDay() + 1); return d >= s; }
    if (periodo === "mese") { const s = new Date(oggi.getFullYear(), oggi.getMonth(), 1); return d >= s; }
    if (periodo === "mese_prec") {
      const s = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
      const e = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      return d >= s && d < e;
    }
    return true;
  };

  const presenzeFiltrate = presenze
    .filter((g:any) => filterDate(new Date(g.data).getTime()))
    .sort((a:any, b:any) => b.data.localeCompare(a.data));

  const interveniFiltrati = interventi.filter((i:any) => filterDate(new Date(i.ts).getTime()));

  const totPresenzaMins = presenzeFiltrate.reduce((a:number, g:any) => a + netMins(g), 0);
  const totITMins = interveniFiltrati.reduce((a:number, i:any) => a + (i.durata_min || 0), 0);
  const percIT = totPresenzaMins > 0 ? Math.round((totITMins / totPresenzaMins) * 100) : 0;

  const byCategoria = config.categorie.map((c:any) => ({
    name: c.label, 
    value: interveniFiltrati.filter((i:any) => i.categoria === c.id).reduce((a:number, i:any) => a + (i.durata_min || 0), 0), 
    fill: c.colore
  })).filter((c:any) => c.value > 0);

  const bySocieta = config.societa.map((s:any) => ({
    name: s.label, 
    value: interveniFiltrati.filter((i:any) => i.societa === s.id).reduce((a:number, i:any) => a + (i.durata_min || 0), 0)
  })).filter((s:any) => s.value > 0);

  // Map dates by ISO string
  const presenzeMap: Record<string, any> = {};
  presenze.forEach((p:any) => presenzeMap[p.data] = p);

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i); d.setHours(0, 0, 0, 0);
    const k = d.toISOString().slice(0, 10);
    return { name: `${d.getDate()}/${d.getMonth() + 1}`, ore: parseFloat((netMins(presenzeMap[k]) / 60).toFixed(1)) };
  });

  const doExport = () => {
    const wb = XLSX.utils.book_new();
    const presenzeRows = presenze.sort((a:any, b:any) => a.data.localeCompare(b.data)).map((g:any) => {
      const sedi = [...new Set((g.sessioni || []).map((s:any) => s.sede))].map(id => config.sedi.find((s:any) => s.id === id)?.label || id).join(", ");
      const entrataTs = g.entrata ? new Date(g.entrata).getTime() : null;
      const uscitaTs = g.uscita ? new Date(g.uscita).getTime() : null;
      return { Data: g.data, Entrata: fmtTime(entrataTs), Uscita: fmtTime(uscitaTs), PauseMin: Math.round((g.pause || []).reduce((a:number, p:any) => a + (p.fine && p.inizio ? (p.fine - p.inizio) / 60000 : 0), 0)), Sedi: sedi, OreNette: parseFloat((netMins(g) / 60).toFixed(2)) };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(presenzeRows), "Presenze");
    
    const itRows = interventi.map((i:any) => {
      const ts = new Date(i.ts).getTime();
      return { Data: fmtDate(ts), Ora: fmtTime(ts), DurataMin: i.durata_min, DurataH: parseFloat((i.durata_min / 60).toFixed(2)), Descrizione: i.descrizione, Categoria: config.categorie.find((c:any) => c.id === i.categoria)?.label || i.categoria, Societa: config.societa.find((s:any) => s.id === i.societa)?.label || i.societa, Richiedente: i.richiedente, Canale: i.canale, Note: i.note || "" };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itRows), "Interventi IT");
    
    const riepilogo = [
      { Metrica: "Ore presenza totali", Valore: parseFloat((presenze.reduce((a:number, g:any) => a + netMins(g), 0) / 60).toFixed(2)) },
      { Metrica: "Ore IT totali", Valore: parseFloat((interventi.reduce((a:number, i:any) => a + (i.durata_min || 0), 0) / 60).toFixed(2)) },
      ...config.societa.map((s:any) => ({ Metrica: `IT — ${s.label}`, Valore: parseFloat((interventi.filter((i:any) => i.societa === s.id).reduce((a:number, i:any) => a + (i.durata_min || 0), 0) / 60).toFixed(2)) })),
      ...config.categorie.map((c:any) => ({ Metrica: `Categoria — ${c.label}`, Valore: parseFloat((interventi.filter((i:any) => i.categoria === c.id).reduce((a:number, i:any) => a + (i.durata_min || 0), 0) / 60).toFixed(2)) }))
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riepilogo), "Riepilogo mensile");
    
    const mese = new Date().toISOString().slice(0, 7);
    XLSX.writeFile(wb, `Rendiconto_${config.nome}_${mese}.xlsx`);
    showToast("Export completato ✓");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, margin: 0 }}>Report</h2>
        <button className="btn-primary" onClick={doExport} style={{ padding: "9px 16px", fontSize: 13 }}>⬇ Esporta Excel</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {[["oggi", "Oggi"], ["settimana", "Questa settimana"], ["mese", "Questo mese"], ["mese_prec", "Mese precedente"], ["tutto", "Tutto"]].map(([k, l]) => (
          <Chip key={k} label={l} active={periodo === k} onClick={() => setPeriodo(k)} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[["Ore presenza", minsToHHMM(totPresenzaMins)], [" Ore IT", minsToHHMM(totITMins)], ["% IT su presenza", percIT + "%"]].map(([l, v]) => (
          <div key={l} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{l}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>{v}</div>
          </div>
        ))}
      </div>

      {last14.some(d => d.ore > 0) && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Ore lavorate — ultimi 14 giorni</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [v + "h", "Ore"]} />
              <Bar dataKey="ore" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {bySocieta.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>IT per società</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={bySocieta} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${Math.round((percent || 0) * 100)}%`} labelLine={false}>
                  {bySocieta.map((e:any, i:number) => <Cell key={i} fill={["var(--accent)", "#7f77dd", "#1d9e75", "#185fa5"][i % 4]} />)}
                </Pie>
                <Tooltip formatter={v => [v + "m"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {byCategoria.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>IT per categoria</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byCategoria} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={v => [v + "m"]} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {byCategoria.map((e:any, i:number) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {presenzeFiltrate.length > 0 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Presenze giornaliere</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Data", "Sede/i", "Entrata", "Uscita", "Pause", "Ore nette"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 6px", color: "var(--muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {presenzeFiltrate.map((g:any) => {
                const sedi = [...new Set((g.sessioni || []).map((s:any) => s.sede))].map(id => config.sedi.find((s:any) => s.id === id)?.codice || id).join("+");
                const pause = Math.round((g.pause || []).reduce((a:number, p:any) => a + (p.fine && p.inizio ? (p.fine - p.inizio) / 60000 : 0), 0));
                const entrataTs = g.entrata ? new Date(g.entrata).getTime() : null;
                const uscitaTs = g.uscita ? new Date(g.uscita).getTime() : null;
                return (
                  <tr key={g.data} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 6px" }} className="mono">{fmtDate(new Date(g.data).getTime())}</td>
                    <td style={{ padding: "5px 6px" }}>{sedi || "—"}</td>
                    <td style={{ padding: "5px 6px" }} className="mono">{fmtTime(entrataTs)}</td>
                    <td style={{ padding: "5px 6px" }} className="mono">{fmtTime(uscitaTs)}</td>
                    <td style={{ padding: "5px 6px" }} className="mono">{pause}m</td>
                    <td style={{ padding: "5px 6px", color: "var(--accent)", fontWeight: 600 }} className="mono">{minsToHHMM(netMins(g))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
