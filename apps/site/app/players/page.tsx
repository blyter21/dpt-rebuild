import { PageHero, SiteShell } from '../../components/site';
import { PlayersDirectory } from '../../components/players-directory';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function PlayersPage() {
  const repo = getDptRepository();
  const players = await repo.getPlayers();
  return (
    <SiteShell>
      <PageHero title="Players">Search and compare Dakota Poker Tour player results from production tournament history.</PageHero>
      <section className="section table-page">
        <PlayersDirectory players={players} />
      </section>
    </SiteShell>
  );
}
