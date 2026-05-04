import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ótmow People — Gestão de Performance',
  description: 'Plataforma interna de feedback, competências e desenvolvimento da Ótmow Engenharia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
