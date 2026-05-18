export function fmtTime(ts: number | null | undefined) {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

export function fmtDate(ts: number | string | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.getDate().toString().padStart(2, "0") + "/" + (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function parseTimeInput(val: string, baseDate?: number | null) {
  const [h, m] = val.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(baseDate || Date.now());
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function minsToHHMM(mins: number | null | undefined) {
  if (mins == null || isNaN(mins)) return "0h 00m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function netMins(g: any, liveTs?: number) {
  if (!g || !g.entrata) return 0;
  
  const e = new Date(g.entrata).getTime();
  const u = g.uscita ? new Date(g.uscita).getTime() : (liveTs || e);
  const tot = (u - e) / 60000;
  
  const pause = (g.pause || []).reduce((a: number, p: any) => {
    if (p.inizio) {
      const pI = new Date(p.inizio).getTime();
      const pF = p.fine ? new Date(p.fine).getTime() : (liveTs || pI);
      return a + ((pF - pI) / 60000);
    }
    return a;
  }, 0);
  
  return Math.max(0, tot - pause);
}
