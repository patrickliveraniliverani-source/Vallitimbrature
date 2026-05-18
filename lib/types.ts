export interface Config {
  id?: string;
  user_id?: string;
  nome: string;
  sedi: any[];
  societa: any[];
  categorie: any[];
  canali: any[];
}

export interface Presenza {
  id?: string;
  user_id?: string;
  data: string;
  entrata: number | null;
  uscita: number | null;
  sede_corrente: string | null;
  sessioni: any[];
  pause: any[];
}

export interface Intervento {
  id?: string;
  user_id?: string;
  ts: number;
  descrizione: string;
  categoria: string;
  societa: string;
  canale: string;
  richiedente: string;
  durata_min: number;
  note: string;
}
