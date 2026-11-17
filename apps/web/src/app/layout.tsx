import type { Metadata } from 'next';
import '../styles/kit.css';
import './globals.css';

export const metadata: Metadata = { title: 'Overview · Lokr', description: 'A personal workspace for managing your job search.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
