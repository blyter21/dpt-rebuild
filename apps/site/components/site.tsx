import Link from 'next/link';
import type { LeaderboardPlayer, PublicArticle, PublicChampion, PublicEvent, PublicVenue } from '../lib/dpt-data';
import { displayText, formatDateRange, mediaUrl, money, publicMediaUrl } from '../lib/dpt-data';

type IconName = 'youtube' | 'facebook' | 'x' | 'instagram' | 'location' | 'calendar' | 'share' | 'play';

type VideoItem = {
  id: string | number;
  title?: string | null;
  excerpt?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
};

export function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  if (name === 'youtube') return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor"/><path d="M10 9.25v5.5L15 12l-5-2.75Z" fill="#fff"/></svg>;
  if (name === 'facebook') return <svg {...common}><path d="M15.4 8.1H13.7c-.7 0-1 .3-1 1v1.4h2.6l-.4 2.8h-2.2V21H9.8v-7.7H7.6v-2.8h2.2V8.8c0-2.4 1.4-3.8 3.7-3.8.9 0 1.6.1 1.9.1v3Z" fill="currentColor"/></svg>;
  if (name === 'x') return <svg {...common}><path d="M5 5h3.3l4.1 5.4L17.1 5H20l-6.1 7 6.5 8h-3.3l-4.5-5.8L7.5 20H4.6l6.5-7.4L5 5Zm2.2 1.7 10.7 11.7h.8L8 6.7h-.8Z" fill="currentColor"/></svg>;
  if (name === 'instagram') return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="16.5" cy="7.5" r="1" fill="currentColor"/></svg>;
  if (name === 'location') return <svg {...common}><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (name === 'share') return <svg {...common}><path d="M18 8a3 3 0 1 0-2.8-4.1L8.7 7.2a3 3 0 1 0 0 1.6l6.5 3.3a3 3 0 1 0 .8-1.4L9.5 7.4A3 3 0 0 0 9.5 7l6.5-3.3A3 3 0 0 0 18 8Z" fill="currentColor"/></svg>;
  return <svg {...common}><path d="M9 6.5v11l9-5.5-9-5.5Z" fill="currentColor"/></svg>;
}

function socialIconLinks() {
  return (
    <div className="social-icons" aria-label="Dakota Poker Tour social links">
      <a href="https://www.youtube.com/@dakotapokertour" aria-label="YouTube"><Icon name="youtube" /></a>
      <a href="https://www.facebook.com/DakotaPokerTour" aria-label="Facebook"><Icon name="facebook" /></a>
      <a href="https://x.com/DakotaPokerTour" aria-label="X"><Icon name="x" /></a>
      <a href="https://www.instagram.com/dakotapokertour" aria-label="Instagram"><Icon name="instagram" /></a>
    </div>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/">
          <span className="brand-logo-block"><img className="brand-logo" src={mediaUrl("https://dakotapokertour.com/images/logo.png")} alt="Dakota Poker Tour" /></span>
        </Link>
        <nav className="main-nav" aria-label="Dakota Poker Tour navigation">
          <Link href="/events">Events</Link>
          <Link href="/news">News</Link>
          <Link href="/videos">Videos</Link>
          <Link href="/venues">Venues</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/players">Players</Link>
          <Link href="/champions">Champions</Link>
        </nav>
        <div className="header-actions">
          <Link className="join-btn" href="/login">Join/Login</Link>
          <Link className="updates-btn" href="/liveTournaments">Live Updates</Link>
          {socialIconLinks()}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h2>Dakota Poker Tour</h2>
          <p>The Dakota Poker Tour is brought to you by FPN Gaming, Inc.<br />Licensed Charitable Gaming Distributor<br /><a href="https://fpngaming.com">FPNGaming.com</a></p>
          <div className="footer-socials">{socialIconLinks()}<a href="https://dakotapokertour.com">Old Website</a></div>
        </div>
        <div><h3>About DPT</h3><Link href="/news">News</Link><Link href="/videos">Videos</Link><Link href="/venues">Venues</Link><Link href="/players">Players</Link></div>
        <div><h3>Events</h3><Link href="/upcomingEvents">Upcoming Events</Link><Link href="/pastEvents">Past Events</Link><Link href="/calendar">Calendar</Link></div>
        <div><h3>Quick Links</h3><Link href="/leaderboard">Leaderboard</Link><Link href="/tournament-of-champions">Champions</Link><Link href="/liveTournaments">Live Updates</Link></div>
      </div>
      <div className="footer-bottom"><span>Policy · Terms · Cookies · Help</span><span>Copyright © 2026 DPT Enterprises, Inc.</span></div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <main><Header />{children}<Footer /></main>;
}

export function PageHero({ eyebrow = 'Dakota Poker Tour', title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return <section className="sub-hero"><div className="section"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{children ? <p>{children}</p> : null}</div></section>;
}

export function Leaderboard({ players }: { players: LeaderboardPlayer[] }) {
  return (
    <div id="leaderboard" className="poy-strip">
      <Link href="/leaderboard" className="poy-title">Player of the Year</Link>
      <div className="poy-scroll">
        {players.slice(0, 5).map((player) => {
          const avatar = mediaUrl(player.avatarUrl);
          return (
            <div className="poy-tile" key={player.playerId}>
              <div className="rank-label"><span>Rank</span><strong>{player.rank}</strong></div>
              {avatar ? <img className="leader-avatar" src={avatar} alt={player.name} /> : null}
              <div><strong>{player.name}</strong><span>{player.points.toLocaleString()} Points</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventCard({ item }: { item: PublicEvent }) {
  const image = mediaUrl(item.imageUrl);
  return (
    <article className="event-card">
      {image ? <img className="event-photo" src={image} alt={displayText(item.name) || 'Dakota Poker Tour event'} /> : <div className="event-image">{displayText(item.name)}</div>}
      <div className="event-body">
        <h3>{displayText(item.name)}</h3>
        <div className="meta"><span className="meta-icon"><Icon name="location" /></span>{item.venue?.name || 'Venue TBA'}</div>
        <div className="meta"><span className="meta-icon"><Icon name="calendar" /></span>{formatDateRange(item.startDate, item.endDate)}</div>
        <p className="excerpt">{displayText(item.description) || 'Tournament details coming soon.'}</p>
        <div className="card-actions"><Link href={`/events/${item.alias}`}>{item.name?.includes('BOUNTY') ? 'Tournament Info' : 'Event Info'}</Link>{item.alias ? <Link href={`/events/${item.alias}#results`}>Results</Link> : null}<span className="share-btn" aria-label="Share"><Icon name="facebook" /></span></div>
      </div>
    </article>
  );
}

export function VideoCard({ item }: { item: VideoItem }) {
  const title = displayText(item.title) || 'Dakota Poker Tour video';
  const thumbnail = publicMediaUrl(item.thumbnailUrl || '');
  return (
    <article className="event-card video-card">
      <a className="video-thumb" href={item.videoUrl || item.embedUrl || '#'} aria-label={`Watch ${title}`}>
        {thumbnail ? <img src={thumbnail} alt={title} /> : <div className="event-image">Video</div>}
        <span className="play-badge"><Icon name="play" /></span>
      </a>
      <div className="event-body">
        <h3>{title}</h3>
        <p className="excerpt">{displayText(item.excerpt) || 'Dakota Poker Tour video content.'}</p>
        <div className="card-actions"><a href={item.videoUrl || '#'}>Watch on YouTube</a></div>
      </div>
    </article>
  );
}

export function ArticleItem({ item }: { item: PublicArticle }) {
  const image = mediaUrl(item.imageUrl);
  return (
    <article className="news-item">
      {image ? <img className="news-thumb image" src={image} alt={displayText(item.title) || 'Dakota Poker Tour news'} /> : <div className="news-thumb">DPT</div>}
      <div>
        {item.alias ? <Link href={`/articles/${item.alias}`}><strong>{displayText(item.title)}</strong></Link> : <strong>{displayText(item.title)}</strong>}
        <span>{item.publishedAt ? formatDateRange(item.publishedAt) : 'News'}</span>
      </div>
    </article>
  );
}

export function VenueCard({ venue }: { venue: PublicVenue }) {
  const image = mediaUrl(venue.imageUrl);
  return <div className="venue-card">{image ? <img className="venue-logo" src={image} alt={displayText(venue.name) || 'DPT venue'} /> : null}{venue.alias ? <Link href={`/venues/${venue.alias}`}><strong>{displayText(venue.name)}</strong></Link> : <strong>{displayText(venue.name)}</strong>}<span>{venue.city}, {venue.state}</span></div>;
}

export function ChampionRow({ champion }: { champion: PublicChampion }) {
  return <div className="news-item"><div className="news-thumb">#1</div><div><strong>{displayText(champion.player)}</strong><span>{displayText(champion.tournament)} · {money(champion.winnings)}</span></div></div>;
}
