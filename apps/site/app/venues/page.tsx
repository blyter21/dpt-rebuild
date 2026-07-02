import { PageHero, SiteShell, VenueCard } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function VenuesPage() {
  const repo = getDptRepository();
  const venues = await repo.getVenues();
  return (
    <SiteShell>
      <PageHero title="Venues">Tournament host venues from the production database.</PageHero>
      <section className="venue-strip"><div className="section"><div className="venue-grid">{venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}</div></div></section>
    </SiteShell>
  );
}
