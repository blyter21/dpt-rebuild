import { PageHero, SiteShell, VideoCard } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function VideosPage() {
  const repo = getDptRepository();
  const videos = await repo.getVideoArticles();
  return (
    <SiteShell>
      <PageHero title="Videos">Dakota Poker Tour live-streams and video features from the public site.</PageHero>
      <section className="section">
        <div className="video-grid">
          {videos.map((article) => <VideoCard key={article.id} item={article} />)}
        </div>
      </section>
    </SiteShell>
  );
}
