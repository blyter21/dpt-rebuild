import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '../../../components/site';
import { formatDateRange, mediaUrl } from '../../../lib/dpt-data';
import { getDptRepository } from '../../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function VenueDetailPage({ params }: { params: { alias: string } }) {
  const repo = getDptRepository();
  const venue = await repo.getVenueByAlias(params.alias);
  if (!venue) notFound();
  const events = (await repo.getEvents()).filter((event) => event.venue?.alias === venue.alias);
  const image = mediaUrl(venue.bannerUrl || venue.imageUrl);
  return (
    <SiteShell>
      <PageHero title={venue.name || 'DPT Venue'}>{[venue.city, venue.state].filter(Boolean).join(', ')}</PageHero>
      <section className="section detail-grid">
        <article className="detail-card">
          {image ? <img className="detail-image" src={image} alt={venue.name || 'DPT venue'} /> : null}
          <div className="eyebrow">Venue</div>
          <h2>{venue.name}</h2>
          <p className="excerpt">{[venue.address, venue.city, venue.state, venue.zip].filter(Boolean).join(', ')}</p>
          {venue.phone ? <p><strong>Phone:</strong> {venue.phone}</p> : null}
          {venue.website ? <a className="btn" href={venue.website}>Venue Website</a> : null}
        </article>
        <aside className="detail-card">
          <div className="eyebrow">Events</div>
          <h2>Hosted DPT Events</h2>
          {events.length ? events.map((event) => <div className="news-item" key={event.id}><div className="news-thumb">DPT</div><div><Link href={`/event/${event.alias}`}><strong>{event.name}</strong></Link><span>{formatDateRange(event.startDate, event.endDate)}</span></div></div>) : <p className="excerpt">No public events currently linked.</p>}
        </aside>
      </section>
    </SiteShell>
  );
}
