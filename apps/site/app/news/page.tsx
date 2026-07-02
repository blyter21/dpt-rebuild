import { ArticleItem, PageHero, SiteShell } from '../../components/site';
import { getDptRepository } from '../../lib/dpt-repository';

export default async function NewsPage() {
  const repo = getDptRepository();
  const articles = await repo.getArticles();
  return (
    <SiteShell>
      <PageHero title="News & Live Updates">Articles and live updates from the production SQL data.</PageHero>
      <section className="section">
        <div className="section-head"><h2>Latest News</h2><span className="view-all">{articles.length} articles</span></div>
        <div className="news-list">{articles.map((article) => <ArticleItem key={article.id} item={article} />)}</div>
      </section>
    </SiteShell>
  );
}
