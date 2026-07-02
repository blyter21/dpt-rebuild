import { ArticleItem, ChampionRow, EventCard, Leaderboard, SiteShell, VenueCard, VideoCard } from '../components/site';
import { displayText, publicMediaUrl } from '../lib/dpt-data';
import { getDptRepository } from '../lib/dpt-repository';

export default async function HomePage() {
  const repo = getDptRepository();
  const featuredEvents = (await repo.getEvents()).slice(0, 4);
  const news = (await repo.getArticles()).slice(0, 6);
  const videos = (await repo.getVideoArticles()).slice(0, 2);
  const venues = (await repo.getVenues()).slice(0, 10);
  const topTournament = (await repo.getTournaments())[0];
  const heroImage = publicMediaUrl('/media/dpt/slider/slider1.jpg');

  return (
    <SiteShell>
      <section className="hero-banner">
        {heroImage ? <img src={heroImage} alt={displayText(topTournament?.name) || 'Dakota Poker Tour'} /> : null}
        <div className="hero-caption">
          <div className="eyebrow">Dakota Poker Tour</div>
          <h1>{displayText(topTournament?.name) || 'Dakota Poker Tour'}</h1>
          <p>{displayText(topTournament?.shortDescription) || 'Live tournament results, leaderboards, venues, players, and news from Dakota Poker Tour.'}</p>
          <div className="hero-actions"><a className="btn" href="/events">View Events</a><a className="btn secondary" href="/leaderboard">Player of the Year</a></div>
        </div>
      </section>

      <Leaderboard players={await repo.getLeaderboard()} />

      <section className="page-layout">
        <div className="main-column">
          <section id="events" className="content-section">
            <div className="section-head"><h2>Past Events</h2><a className="view-all" href="/events">View All ›</a></div>
            <div className="event-grid">{featuredEvents.map((event) => <EventCard key={event.id} item={event} />)}</div>
          </section>

          <section id="videos" className="content-section">
            <div className="section-head"><h2>Videos</h2><a className="view-all" href="/videos">View All ›</a></div>
            <div className="video-grid">{videos.map((article) => <VideoCard key={article.id} item={article} />)}</div>
          </section>
        </div>

        <aside className="sidebar-column">
          <section id="news" className="sidebar-panel">
            <div className="sidebar-head"><h2>News</h2><a href="/news">View All ›</a></div>
            <div className="news-list">{news.map((article) => <ArticleItem key={article.id} item={article} />)}</div>
          </section>
          <section className="sidebar-panel latest-panel">
            <div className="sidebar-head"><h2>Latest Posts</h2></div>
            <div className="news-list" id="champions">{(await repo.getChampions()).slice(0, 5).map((champion) => <ChampionRow key={`${champion.tournament}-${champion.player}`} champion={champion} />)}</div>
          </section>
        </aside>
      </section>

      <section id="venues" className="venue-strip">
        <div className="section">
          <div className="section-head"><h2>Venues</h2><a className="view-all" href="/venues">View All ›</a></div>
          <div className="venue-grid">{venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}</div>
        </div>
      </section>
    </SiteShell>
  );
}
