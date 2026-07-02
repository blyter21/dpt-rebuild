import { PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function LeaderboardPage() {
  const repo = getDptRepository();
  const leaderboard = await repo.getLeaderboard();
  return (
    <SiteShell>
      <PageHero title="Player of the Year Leaderboard">Real player standings computed from production tournament player scores.</PageHero>
      <section className="section table-page">
        <table className="data-table"><thead><tr><th>Rank</th><th>Player</th><th>Location</th><th>Points</th><th>Wins</th><th>Cashes</th></tr></thead><tbody>{leaderboard.map((player) => <tr key={player.playerId}><td>{player.rank}</td><td><strong>{player.name}</strong></td><td>{[player.city, player.state].filter(Boolean).join(', ') || '—'}</td><td>{player.points.toLocaleString()}</td><td>{player.wins}</td><td>{player.cashes}</td></tr>)}</tbody></table>
      </section>
    </SiteShell>
  );
}
