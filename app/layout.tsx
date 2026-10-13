import type { Metadata } from 'next';
import { Pacifico } from 'next/font/google';
import './globals.css';

// Script face closest to the Mr.wiserr logo lettering; exposed as --font-brand
// for the <BrandWordmark /> text version of the logo.
const brand = Pacifico({ subsets: ['latin'], weight: '400', variable: '--font-brand', display: 'swap' });

export const metadata: Metadata = {
  title: 'Mr.wiserr — Restaurant Technology Platform',
  description: 'Mr.wiserr helps restaurants delight guests, serve faster and grow with confidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={brand.variable}>
      <body>{children}</body>
    </html>
  );
}
