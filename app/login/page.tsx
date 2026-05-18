'use client';

import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BigBtn } from '@/components/ui/BigBtn';
import SetupRequired from '@/components/ui/SetupRequired';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/marcatempo`,
      },
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        setMessage('Hai richiesto troppi accessi. Attendi un po\' di tempo (o usa la dashboard di Supabase per inviare manualmente un link).');
      } else {
        setMessage(error.message);
      }
    } else {
      setMessage('Controlla la tua email — ti abbiamo inviato il link di accesso');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', marginTop: '10vh' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 20, color: 'var(--accent)' }}>
        Rendiconto IT - Accesso
      </h1>
      <div className="card">
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Inserisci la tua email"
              required 
            />
          </div>
          <BigBtn label={loading ? 'Invio in corso...' : 'Accedi con Magic Link'} />
        </form>
        {message && (
          <div style={{ marginTop: 16, fontSize: 14, color: message.includes('errore') || message.includes('troppi accessi') ? '#c0392b' : 'green' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
