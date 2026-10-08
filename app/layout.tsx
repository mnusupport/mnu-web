import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MnU — Restaurant Technology Platform',
  description: 'MnU helps restaurants delight guests, serve faster and grow with confidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
