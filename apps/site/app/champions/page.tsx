import { ChampionRow, PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function ChampionsPage() {
  const repo = getDptRepository();
  const champions = await repo.getChampions();
  return (
    <SiteShell>
      <PageHero title="Champions">Recent tournament winners and payout results from the production SQL.</PageHero>
      <section className="section">
        <div className="section-head"><h2>Recent Champions</h2><span className="view-all">{champions.length} results</span></div>
        <div className="news-list">{champions.map((champion) => <ChampionRow key={`${champion.tournament}-${champion.player}-${champion.date}`} champion={champion} />)}</div>
      </section>
    </SiteShell>
  );
}
