'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { BrandWordmark } from '../_components/BrandWordmark';
import { resolveLanding } from '@/lib/roleRouting';
import { Icon, type IconName } from './Icon';
import s from './landing.module.css';

const PHONES = [
  { label: '+91 9725029409', href: 'tel:+919725029409' },
  { label: '+91 6353 708 256', href: 'tel:+916353708256' },
];
const EMAIL = 'mnu.support@gmail.com';

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'clock', title: 'Save time every service', text: 'Cut the back-and-forth that slows tables down, so your team can serve more guests with less stress.' },
  { icon: 'smile', title: 'Delight your guests', text: 'Give diners a modern, effortless experience they will want to come back to and recommend.' },
  { icon: 'msg', title: 'Hear honest feedback', text: 'Understand what guests love and what could be better, straight from the people at your tables.' },
  { icon: 'target', title: 'Fewer mistakes', text: 'Reduce mix-ups and miscommunication, which means less waste and fewer unhappy moments.' },
  { icon: 'chart', title: 'See your business clearly', text: 'Get a clearer picture of what is working so you can plan your menu and your days with confidence.' },
  { icon: 'layers', title: 'Grow with ease', text: 'Whether you run one restaurant or many, Mr.wiserr helps you stay organised as you grow.' },
];

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Same session restore as /login: a valid token is verified with /auth/me
  // and the person is sent to their dashboard. Navigation only; every API
  // call is authorised server-side.
  useEffect(() => {
    const token = localStorage.getItem('mnu_token');
    if (!token) {
      setCheckingSession(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        const landing = resolveLanding(res.platformRole, res.memberships);
        if (landing.kind === 'redirect') {
          router.replace(landing.href);
        } else {
          localStorage.removeItem('mnu_token');
          setCheckingSession(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('mnu_token');
        setCheckingSession(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { token, platformRole, memberships } = await authApi.login({ email, password });
      const landing = resolveLanding(platformRole, memberships);
      if (landing.kind === 'no-restaurant') {
        setError('Your account isn\u2019t linked to a restaurant yet.');
        return;
      }
      localStorage.setItem('mnu_token', token);
      router.push(landing.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || checkingSession;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={`${s.wrap} ${s.nav}`}>
          <a href="#top" className={s.logo} aria-label="Mr.wiserr home">
            <Image src="/mrwiserr-logo.png" alt="Mr.wiserr" width={1269} height={300} priority />
          </a>
          <nav className={s.links}>
            <a href="#about">About</a>
            <a href="#benefits">Benefits</a>
            <a href="#contact">Contact</a>
            <a href="#signin" className={`${s.btn} ${s.sm}`}>Sign in</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className={s.hero}>
          <div className={`${s.wrap} ${s.grid}`}>
            <div>
              <span className={s.pill}><Icon name="shield" className={s.i} />Trusted restaurant technology</span>
              <h1>Give every guest a <em>better dining</em> experience.</h1>
              <p className={s.lead}>Mr.wiserr is a restaurant technology company helping restaurants serve guests faster, hear what they really think, and grow with confidence.</p>
              <div className={s.cta}>
                <a href="#signin" className={s.btn}>Sign in <Icon name="arrow" className={s.i} /></a>
              </div>
              <div className={s.trust}>
                {['Made for restaurants', 'Friendly support', 'Easy to get started'].map((t) => (
                  <span key={t}><Icon name="check" className={s.i} />{t}</span>
                ))}
              </div>
            </div>
            <aside className={s.panel}>
              <h3>What Mr.wiserr brings to your restaurant</h3>
              {([
                ['zap', 'Faster service', 'Less waiting, happier tables'],
                ['msg', 'Honest guest voices', 'Know what diners truly feel'],
                ['trend', 'Confident growth', 'Decisions backed by real insight'],
              ] as [IconName, string, string][]).map(([ic, t, d]) => (
                <div className={s.stat} key={t}>
                  <span className={s.ic}><Icon name={ic} className={s.i} /></span>
                  <div><strong>{t}</strong>{d}</div>
                </div>
              ))}
            </aside>
          </div>
        </section>

        <section id="about" className={s.section}>
          <div className={`${s.wrap} ${s.two}`}>
            <div>
              <span className={s.pill}>Who we are</span>
              <h2>We help restaurants focus on great food and warm hospitality.</h2>
              <p>Mr.wiserr is built for restaurant owners and their teams. We take care of the busywork around the dining experience, so you have more time for your guests and your craft.</p>
              <ul className={s.list}>
                {['Designed for restaurants of every size', 'Easy for your team, comfortable for your guests', 'Built to grow alongside your business'].map((t) => (
                  <li key={t}><Icon name="check" className={s.i} />{t}</li>
                ))}
              </ul>
            </div>
            <div className={s.nums}>
              {([
                ['zap', 'Faster', 'Smoother service from welcome to final bill'],
                ['msg', 'Clearer', 'A real view of how guests feel about you'],
                ['shield', 'Calmer', 'Less pressure in your busiest hours'],
                ['chart', 'Smarter', 'Better decisions for your menu and business'],
              ] as [IconName, string, string][]).map(([ic, t, d]) => (
                <div className={s.num} key={t}>
                  <span className={s.ic}><Icon name={ic} className={s.i} /></span>
                  <b>{t}</b>
                  <span className={s.d}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className={`${s.section} ${s.alt}`}>
          <div className={s.wrap}>
            <div className={s.head}>
              <span className={s.pill}>How Mr.wiserr helps</span>
              <h2>Real benefits for your restaurant</h2>
              <p>Everything we do is aimed at one thing: a better experience for your guests and an easier day for you.</p>
            </div>
            <div className={s.cards}>
              {BENEFITS.map((b) => (
                <article className={s.card} key={b.title}>
                  <span className={s.ic}><Icon name={b.icon} className={s.i} /></span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="signin" className={`${s.section} ${s.signin}`}>
          <div className={`${s.wrap} ${s.grid}`}>
            <div>
              <span className={s.pill}><Icon name="user" className={s.i} />Sign in</span>
              <h2>Welcome back to Mr.wiserr</h2>
              <p className={s.t}>Sign in to your account. New to Mr.wiserr? Contact our team and we will create your account for you.</p>
              <ul className={s.list}>
                {['Quick and simple sign-in', "Accounts are created with our team's help", 'No technical knowledge needed'].map((t) => (
                  <li key={t}><Icon name="check" className={s.i} />{t}</li>
                ))}
              </ul>
            </div>
            <form className={s.form} onSubmit={handleSubmit}>
              <h3>Sign in</h3>
              <p className={s.sub}>Welcome back. Enter your details to continue.</p>
              {error && <p className={s.err} role="alert">{error}</p>}
              <div className={s.field}>
                <label htmlFor="landing-email">Email</label>
                <input id="landing-email" type="email" required autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.com" />
              </div>
              <div className={s.field}>
                <label htmlFor="landing-password">Password</label>
                <input id="landing-password" type="password" required autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
              </div>
              <button type="submit" disabled={busy} className={s.btn}>
                {checkingSession ? 'Checking your session...' : isSubmitting ? 'Signing in...' : <>Sign in <Icon name="arrow" className={s.i} /></>}
              </button>
              <p className={s.fine}>Don&apos;t have an account? <a href="#contact">Contact us</a> to create one.</p>
            </form>
          </div>
        </section>

        <section id="contact" className={`${s.section} ${s.alt} ${s.contact}`}>
          <div className={s.wrap}>
            <div className={s.head}>
              <span className={s.pill}>Contact us</span>
              <h2>Create your account with our team</h2>
              <p>To create your Mr.wiserr account, call or email us. We are happy to help.</p>
            </div>
            <div className={s.cards}>
              <article className={s.card}>
                <span className={s.ic}><Icon name="phone" className={s.i} /></span>
                <h3>Call us</h3>
                {PHONES.map((p) => <a key={p.href} href={p.href}>{p.label}</a>)}
              </article>
              <article className={s.card}>
                <span className={s.ic}><Icon name="mail" className={s.i} /></span>
                <h3>Email us</h3>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </article>
              <article className={s.card}>
                <span className={s.ic}><Icon name="users" className={s.i} /></span>
                <h3>Friendly support</h3>
                <p>Our team guides you through getting started, step by step.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.nav}`}>
          <a href="#top" className={s.logo} aria-label="Mr.wiserr home">
            <BrandWordmark className="text-2xl" />
          </a>
          <span>© {new Date().getFullYear()} Mr.wiserr. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
