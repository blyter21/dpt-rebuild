import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '../../../components/site';
import { formatDateRange, mediaUrl } from '../../../lib/dpt-data';
import { getDptRepository } from '../../../lib/dpt-repository';

export const dynamic = 'force-dynamic';

export default async function ArticleDetailPage({ params }: { params: { alias: string } }) {
  const article = await getDptRepository().getArticleByAlias(params.alias);
  if (!article) notFound();
  const image = mediaUrl(article.bannerUrl || article.imageUrl);
  return (
    <SiteShell>
      <PageHero title={article.title || 'Dakota Poker Tour News'}>{article.publishedAt ? formatDateRange(article.publishedAt) : 'Dakota Poker Tour'}</PageHero>
      <section className="section detail-grid">
        <article className="detail-card article-detail">
          {image ? <img className="detail-image" src={image} alt={article.title || 'DPT article'} /> : null}
          <div className="eyebrow">News & Live Update</div>
          <h2>{article.title}</h2>
          <p className="article-content">{article.content || article.excerpt}</p>
          {article.videoUrl ? <a className="btn" href={article.videoUrl}>Watch Video</a> : null}
        </article>
        <aside className="detail-card">
          <div className="eyebrow">Related Tournament</div>
          {article.tournament?.alias ? <Link href={`/tournament/${article.tournament.alias}`}><h2>{article.tournament.name}</h2></Link> : <p className="excerpt">General Dakota Poker Tour update.</p>}
          <Link className="btn" href="/news">All News</Link>
        </aside>
      </section>
    </SiteShell>
  );
}
