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
  // Inject runtime config from environment
  const runtimeConfig = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  };

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
