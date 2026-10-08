import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Landing from './_landing/Landing';

const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const head = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-head', display: 'swap' });

// Public home page and first point of interaction: company introduction,
// a working sign-in form (same /auth/login flow and role-based redirect as
// /login), and contact details for creating an account. Diners never see
// this page; they arrive through a table QR code (/scan/...).
export default function HomePage() {
  return (
    <div className={`${body.variable} ${head.variable}`}>
      <Landing />
    </div>
  );
}
