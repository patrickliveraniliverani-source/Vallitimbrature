import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Rendiconto IT Tracker',
  description: 'App web personale per Patrick Liverani',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
