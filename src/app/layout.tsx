import type { Metadata } from 'next';
import './globals.css';
import './research.css';
export const metadata: Metadata = { title: 'antnet — small ants. collective intelligence.', description: 'Ants explore the crypto web. Claude connects the dots. Follow every source in the AntNet research colony.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
