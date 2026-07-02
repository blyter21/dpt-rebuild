import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleItem, PageHero, SiteShell } from '../../../components/site';
import { formatDateRange, mediaUrl, money } from '../../../lib/dpt-data';
import { getDptRepository } from '../../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function TournamentDetailPage({ params }: { params: { alias: string } }) {
  const repo = getDptRepository();
  const tournament = await repo.getTournamentByAlias(params.alias);
  if (!tournament) notFound();
  const articles = await repo.getArticlesForTournament(tournament.alias || '');
  const tournamentImage = mediaUrl(tournament.imageUrl);
  const champion = (await repo.getChampions()).find((row) => row.tournamentAlias === tournament.alias);
  return (
    <SiteShell>
      <PageHero title={tournament.name || 'Tournament'}>{tournament.event?.name || 'Dakota Poker Tour'} · {formatDateRange(tournament.startDate, tournament.endDate)}</PageHero>
      <section className="section detail-grid">
        <article className="detail-card">
          {tournamentImage ? <img className="detail-image" src={tournamentImage} alt={tournament.name || 'DPT tournament'} /> : null}
          <div className="eyebrow">Tournament Info</div>
          <h2>{tournament.name}</h2>
          <p className="excerpt">{tournament.shortDescription}</p>
          <div className="stat-grid">
            <div className="stat"><span>Venue</span><strong>{tournament.venue?.name || 'TBA'}</strong></div>
            <div className="stat"><span>Buy-in</span><strong>{money(tournament.minimumBuyIn)}</strong></div>
            <div className="stat"><span>Players</span><strong>{tournament.totalPlayers || 'TBA'}</strong></div>
            <div className="stat"><span>Prize pool</span><strong>{money(tournament.totalPrizePool)}</strong></div>
            <div className="stat"><span>Registration</span><strong>{formatDateRange(tournament.registrationStartDate)}</strong></div>
            <div className="stat"><span>Location</span><strong>{[tournament.venue?.city, tournament.venue?.state].filter(Boolean).join(', ') || 'TBA'}</strong></div>
          </div>
          {tournament.event?.alias ? <Link className="btn" href={`/events/${tournament.event.alias}`}>Back to Event</Link> : null}
        </article>
        <aside className="detail-card">
          <div className="eyebrow">Results</div>
          <h2>{champion ? 'Champion' : 'Results Pending'}</h2>
          {champion ? <div className="news-item"><div className="news-thumb">#1</div><div><strong>{champion.player}</strong><span>{money(champion.winnings)} · {champion.score || 0} points</span></div></div> : <p className="excerpt">No champion row is linked in the extracted result data yet.</p>}
          <h3>Related Updates</h3>
          {articles.length ? articles.map((article) => <ArticleItem key={article.id} item={article} />) : <p className="excerpt">No related live updates found in the extracted SQL data.</p>}
        </aside>
      </section>
    </SiteShell>
  );
}
