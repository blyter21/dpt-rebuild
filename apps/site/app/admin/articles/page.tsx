import Link from 'next/link';
import { AdminSectionHeader, AdminShell } from '../../../components/admin';
import { displayText, formatDateRange } from '../../../lib/dpt-data';
import { getDptAdminSnapshot } from '../../../lib/dpt-admin-repository';

export default async function AdminArticlesPage() {
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Articles" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Articles & Live Updates" count={snapshot.articles.length}>Real article records extracted from the production database.</AdminSectionHeader>
      <div className="dpt-admin-table-wrap">
        <table className="dpt-admin-table">
          <thead><tr><th>ID</th><th>Title</th><th>Published</th><th>Tournament</th><th>Featured</th><th>Public page</th></tr></thead>
          <tbody>{snapshot.articles.map((article) => (
            <tr key={article.id}>
              <td>{article.id}</td>
              <td><strong>{displayText(article.title)}</strong><small>{article.alias}</small></td>
              <td>{formatDateRange(article.publishedAt, article.publishedAt)}</td>
              <td>{article.tournament?.name || 'General news'}</td>
              <td>{article.featured ? 'Yes' : 'No'}</td>
              <td><Link href="/news">View news</Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
