import { PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function PlayersPage() {
  const repo = getDptRepository();
  const leaderboard = await repo.getLeaderboard();
  return (
    <SiteShell>
      <PageHero title="Players">Public player leaderboard tiles from production scoring data.</PageHero>
      <section className="section">
        <div className="players-grid">
          {leaderboard.map((player) => (
            <div className="player-tile" key={player.playerId}>
              <strong>{player.name}</strong>
              <span>Rank #{player.rank}</span>
              <span>{player.points.toLocaleString()} points</span>
              <span>{[player.city, player.state].filter(Boolean).join(', ') || 'Dakota Poker Tour player'}</span>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
