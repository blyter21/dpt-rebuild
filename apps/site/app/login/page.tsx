import { PageHero, SiteShell } from '../../components/site';

export default function LoginPage() {
  return <SiteShell><PageHero title="Join/Login">Account authentication will be rebuilt after public-page parity and new-stack auth decisions.</PageHero><section className="section"><div className="detail-card"><h2>Coming next</h2><p className="excerpt">The production site has Join/Login navigation. This replacement route is intentionally non-functional until auth/admin migration is designed against the production user data and chosen new stack.</p></div></section></SiteShell>;
}
