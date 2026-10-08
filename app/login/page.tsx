import { redirect } from 'next/navigation';

// Sign-in now lives on the home page (/). Keep this URL working for old
// bookmarks and links by sending everyone there.
export default function LoginPage() {
  redirect('/');
}
