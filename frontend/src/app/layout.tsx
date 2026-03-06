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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = { NEXT_PUBLIC_API_URL: '${apiUrl}' };`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
