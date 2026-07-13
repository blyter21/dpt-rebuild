import { EventCard, PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function UpcomingEventsPage() {
  const events = (await getDptRepository().getEvents())
    .filter((event) => new Date(event.endDate || event.startDate || 0).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
  return <SiteShell><PageHero title="Upcoming Events">Upcoming Dakota Poker Tour stops and tournament series.</PageHero><section className="section"><div className="section-head"><h2>Upcoming Events</h2><span className="view-all">{events.length} events</span></div><div className="event-grid">{events.map((event) => <EventCard key={event.id} item={event} />)}</div></section></SiteShell>;
}
