import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '../../../components/site';
import { getDptRepository } from '../../../lib/dpt-repository';
import { mediaUrl } from '../../../lib/dpt-data';

export default async function PlayerDetailPage({ params }: { params: { alias: string } }) {
  const repo = getDptRepository();
  const player = await repo.getPlayerByAlias(params.alias);
  if (!player) notFound();

  const avatar = mediaUrl(player.avatarUrl);
  return (
    <SiteShell>
      <PageHero title={player.name}>{[player.city, player.state].filter(Boolean).join(', ') || 'Dakota Poker Tour player'}</PageHero>
      <section className="section player-profile">
        <div className="player-profile-card">
          {avatar ? <img src={avatar} alt={player.name} /> : <div className="player-profile-placeholder">{player.name.slice(0, 1)}</div>}
          <div>
            <span className="eyebrow">Player profile</span>
            <h2>{player.name}</h2>
            <p>{player.tournaments.toLocaleString()} recorded tournament entries</p>
          </div>
        </div>
        <div className="player-profile-stats">
          <div><span>POY Points</span><strong>{player.points.toLocaleString()}</strong></div>
          <div><span>Winnings</span><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(player.winnings)}</strong></div>
          <div><span>Cashes</span><strong>{player.cashes}</strong></div>
          <div><span>Final Tables</span><strong>{player.finalTables}</strong></div>
          <div><span>Titles</span><strong>{player.titles}</strong></div>
        </div>
      </section>
    </SiteShell>
  );
}
