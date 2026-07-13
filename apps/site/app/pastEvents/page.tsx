import { EventCard, PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function PastEventsPage() {
  const events = (await getDptRepository().getEvents())
    .filter((event) => new Date(event.endDate || event.startDate || 0).getTime() < Date.now())
    .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
  return <SiteShell><PageHero title="Past Events">Historical Dakota Poker Tour events and results.</PageHero><section className="section"><div className="section-head"><h2>Past Events</h2><span className="view-all">{events.length} events</span></div><div className="event-grid">{events.map((event) => <EventCard key={event.id} item={event} />)}</div></section></SiteShell>;
}
