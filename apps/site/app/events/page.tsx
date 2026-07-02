import { EventCard, PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function EventsPage() {
  const repo = getDptRepository();
  const events = await repo.getEvents();
  return (
    <SiteShell>
      <PageHero title="Events">Dakota Poker Tour events from the production SQL data.</PageHero>
      <section className="section">
        <div className="section-head"><h2>All Events</h2><span className="view-all">{events.length} events</span></div>
        <div className="event-grid">{events.map((event) => <EventCard key={event.id} item={event} />)}</div>
      </section>
    </SiteShell>
  );
}
