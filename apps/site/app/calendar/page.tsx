import Link from 'next/link';
import { PageHero, SiteShell } from '../../components/site';
import { formatDateRange } from '../../lib/dpt-data';
import { getDptRepository } from '../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const events = (await getDptRepository().getEvents())
    .filter((event) => event.startDate)
    .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const key = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(event.startDate || 0));
    groups.set(key, [...(groups.get(key) || []), event]);
  }
  return (
    <SiteShell>
      <PageHero title="Calendar">Dakota Poker Tour event calendar.</PageHero>
      <section className="section calendar-list">
        {[...groups.entries()].map(([month, monthEvents]) => (
          <section className="calendar-month" key={month}><h2>{month}</h2>{monthEvents.map((event) => <div className="calendar-event" key={event.id}><span>{formatDateRange(event.startDate, event.endDate)}</span><Link href={`/event/${event.alias}`}><strong>{event.name}</strong></Link><small>{event.venue?.name || 'Venue TBA'}</small></div>)}</section>
        ))}
      </section>
    </SiteShell>
  );
}
