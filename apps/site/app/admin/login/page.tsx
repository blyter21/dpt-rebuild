import Link from 'next/link';
import { isDptAdminAuthConfigured, isDptAdminReadOnlyReviewEnabled } from '../../../lib/dpt-admin-auth';

const errors: Record<string, string> = {
  invalid: 'The email or password was not accepted.',
  unauthorized: 'This account does not have DPT administration access.',
  configuration: 'Admin authentication is not configured yet.',
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage({ searchParams }: { searchParams?: { error?: string; next?: string } }) {
  const configured = isDptAdminAuthConfigured();
  const readOnlyReview = isDptAdminReadOnlyReviewEnabled();
  const error = searchParams?.error ? errors[searchParams.error] || 'Unable to sign in.' : '';
  const next = searchParams?.next?.startsWith('/admin') ? searchParams.next : '/admin';

  return (
    <main className="dpt-admin-login-page">
      <section className="dpt-admin-login-card">
        <span className="dpt-admin-eyebrow">Dakota Poker Tour</span>
        <h1>Admin Login</h1>
        <p>{readOnlyReview ? 'Open the read-only DPT administration preview without a password.' : 'Sign in with an authorized DPT administrator account.'}</p>

        {readOnlyReview ? (
          <div className="dpt-admin-login-locked" role="status">
            <strong>Read-only review mode</strong>
            <span>Supabase admin authentication is bypassed for this JSON preview. These screens expose no passwords, OTPs, tokens, private user rows, or production writes.</span>
            <Link href={next} className="dpt-admin-preview-link">Open admin preview</Link>
          </div>
        ) : null}

        {!configured && !readOnlyReview ? (
          <div className="dpt-admin-login-locked" role="status">
            <strong>Admin access is locked</strong>
            <span>Supabase staging authentication is not connected. No admin content is accessible.</span>
          </div>
        ) : null}
        {error ? <div className="dpt-admin-login-error" role="alert">{error}</div> : null}

        <form action="/api/admin/auth/login" method="post" className="dpt-admin-login-form">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="admin-email">Email address</label>
          <input id="admin-email" name="email" type="email" autoComplete="username" required disabled={!configured || readOnlyReview} />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required disabled={!configured || readOnlyReview} />
          <label className="dpt-admin-remember"><input name="remember" type="checkbox" value="1" disabled={!configured || readOnlyReview} /> Keep me signed in</label>
          <button type="submit" disabled={!configured || readOnlyReview}>Sign in to administration</button>
        </form>

        <div className="dpt-admin-login-notes">
          <strong>Restricted access</strong>
          <span>Authentication alone is not sufficient. The account must also have the production-equivalent <code>view_admin</code> permission.</span>
        </div>
        <Link href="/">Return to Dakota Poker Tour</Link>
      </section>
    </main>
  );
}
