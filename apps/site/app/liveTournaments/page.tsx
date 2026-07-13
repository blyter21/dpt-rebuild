import { permanentRedirect } from 'next/navigation';
import { getDptRepository } from '../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function LiveTournamentsPage() {
  const tournaments = await getDptRepository().getTournaments();
  const now = Date.now();
  const latest = [...tournaments]
    .filter((tournament) => tournament.alias && new Date(tournament.startDate || 0).getTime() <= now)
    .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())[0]
    || tournaments.find((tournament) => tournament.alias);
  permanentRedirect(latest?.alias ? `/tournament/${latest.alias}` : '/events');
}
