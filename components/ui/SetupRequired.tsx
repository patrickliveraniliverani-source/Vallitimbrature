import React from 'react';

export default function SetupRequired() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      fontFamily: 'var(--font-sans), sans-serif',
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '550px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(184, 69, 31, 0.1)',
        border: '1px solid var(--border)',
        padding: '30px',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .code-box {
            background-color: var(--chip);
            border-radius: 8px;
            padding: 14px;
            font-family: var(--font-mono), monospace;
            font-size: 13px;
            color: var(--text);
            border: 1px solid var(--border);
            margin: 15px 0;
            overflow-x: auto;
            white-space: pre;
          }
          .step-card {
            background-color: var(--card);
            border-left: 3px solid var(--accent);
            padding: 10px 15px;
            margin-bottom: 12px;
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
            border: 1px solid var(--border);
            border-left-width: 3px;
          }
        `}</style>
        
        <h2 style={{
          fontFamily: 'var(--font-serif), serif',
          fontSize: '26px',
          fontWeight: 600,
          color: 'var(--accent)',
          marginBottom: '10px',
          lineHeight: '1.2'
        }}>
          Rendiconto IT Tracker
        </h2>
        
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
          Benvenuto! Per far funzionare l'applicazione con sincronizzazione in tempo reale e autenticazione tramite Magic Link, è necessario configurare le chiavi di connessione a Supabase.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
          Configurazione Rapida in 3 Semplici Step:
        </h3>

        <div className="step-card">
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>1. Apri il file .env.local</strong>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Troverai il file già creato nella radice della tua cartella del progetto.</span>
        </div>

        <div className="step-card">
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>2. Inserisci le chiavi del tuo Database</strong>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Sostituisci i valori segnaposto con le chiavi del tuo progetto Supabase:</span>
          <div className="code-box">
{`NEXT_PUBLIC_SUPABASE_URL=https://tuo-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-chiave-anonima
SUPABASE_SERVICE_ROLE_KEY=tua-chiave-service-role
ALLOWED_EMAIL=tua-email@dominio.it`}
          </div>
        </div>

        <div className="step-card">
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>3. Esegui le Migrations</strong>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Crea lo schema del DB eseguendo il file SQL presente in `supabase/migrations/` all'interno dell'SQL Editor di Supabase.</span>
        </div>

        <p style={{ 
          fontSize: '13px', 
          color: 'var(--accent)', 
          fontWeight: 500, 
          marginTop: '20px', 
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          ✨ Una volta salvato il file .env.local, l'applicazione si ricaricherà automaticamente!
        </p>
      </div>
    </div>
  );
}
