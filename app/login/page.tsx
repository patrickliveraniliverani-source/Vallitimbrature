'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BigBtn } from '@/components/ui/BigBtn';
import SetupRequired from '@/components/ui/SetupRequired';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // Attempt sign in
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If invalid credentials, attempt auto-signup (for first time use)
    if (error && (error.message.includes('Invalid login') || error.message.includes('Signups not allowed'))) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setMessage(signUpError.message + " (Assicurati di disabilitare 'Confirm email' in Supabase -> Authentication -> Providers)");
        setLoading(false);
        return;
      }
      // Se signUp ha successo, la sessione viene creata in automatico se 'Confirm email' è OFF
      error = null;
    }

    if (error) {
      setMessage(error.message);
    } else {
      router.push('/marcatempo');
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Es. LVRN"
              required 
            />
          </div>
          <BigBtn label={loading ? 'Accesso in corso...' : 'Accedi'} />
        </form>
        {message && (
          <div style={{ marginTop: 16, fontSize: 14, color: message.includes('error') || message.includes('Assicurati') ? '#c0392b' : 'green' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
