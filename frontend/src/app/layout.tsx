import type { Metadata } from 'next';
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
        <script src="/env-config.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
