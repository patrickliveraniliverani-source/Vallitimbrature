'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';
import SetupRequired from '@/components/ui/SetupRequired';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>Caricamento...</div>;
  }

  const tabs = [
    { id: 'marcatempo', label: 'Marcatempo', href: '/marcatempo' },
    { id: 'interventi', label: 'Interventi IT', href: '/interventi' },
    { id: 'report', label: 'Report', href: '/report' },
    { id: 'impostazioni', label: 'Impostazioni', href: '/impostazioni' }
  ];

  return (
    <div style={{ fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 4, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>Rendiconto IT</span>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Esci</button>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {tabs.map(t => {
            const isActive = pathname.startsWith(t.href);
            return (
              <Link key={t.id} href={t.href} className={`tab-btn${isActive ? " active" : ""}`}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
