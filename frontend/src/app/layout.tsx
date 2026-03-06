import type { Metadata } from 'next';
import Script from 'next/script';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'SMS Server Management',
  description: 'Manage your SMS devices and messages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="/env-config.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
