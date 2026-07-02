import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '../../../components/site';
import { formatDateRange, mediaUrl, money } from '../../../lib/dpt-data';
import { getDptRepository } from '../../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: { alias: string } }) {
  const repo = getDptRepository();
  const event = await repo.getEventByAlias(params.alias);
  if (!event) notFound();
  const tournaments = await repo.getTournamentsForEvent(event.alias || '');
  const eventImage = mediaUrl(event.imageUrl);
  return (
    <SiteShell>
      <PageHero title={event.name || 'Event'}>{event.venue?.name || 'Venue TBA'} · {formatDateRange(event.startDate, event.endDate)}</PageHero>
      <section className="section detail-grid">
        <article className="detail-card">
          {eventImage ? <img className="detail-image" src={eventImage} alt={event.name || 'DPT event'} /> : null}
          <div className="eyebrow">Event Info</div>
          <h2>{event.name}</h2>
          <p className="excerpt">{event.description}</p>
          <div className="stat-grid">
            <div className="stat"><span>Venue</span><strong>{event.venue?.name || 'TBA'}</strong></div>
            <div className="stat"><span>Location</span><strong>{event.venue?.city || ''} {event.venue?.state || ''}</strong></div>
            <div className="stat"><span>Tournaments</span><strong>{tournaments.length}</strong></div>
          </div>
        </article>
        <aside className="detail-card" id="results">
          <div className="eyebrow">Tournaments / Results</div>
          <h2>Event Schedule</h2>
          {tournaments.map((tournament) => (
            <div className="news-item" key={tournament.id}>
              <div className="news-thumb">DPT</div>
              <div><Link href={`/tournaments/${tournament.alias}`}><strong>{tournament.name}</strong></Link><span>{formatDateRange(tournament.startDate, tournament.endDate)} · {money(tournament.totalPrizePool)}</span></div>
            </div>
          ))}
        </aside>
      </section>
    </SiteShell>
  );
}
