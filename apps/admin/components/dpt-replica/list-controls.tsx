import type { ListSort, RowAction, RowActionPreview } from './types';

export function RowActionMenu({ module, itemName, onAction }: { module: string; itemName: string; onAction: (action: RowAction, itemName: string, module: string) => void }) {
  const actions: RowAction[] = ['View', 'Edit', 'Duplicate / Save as Copy', 'Manage', 'Delete disabled'];
  return (
    <div className="row-action-menu" aria-label={`${module} row actions for ${itemName}`}>
      {actions.map((action) => (
        <button key={action} className={action === 'Delete disabled' ? 'disabled-action' : ''} type="button" disabled={action === 'Delete disabled'} onClick={() => onAction(action, itemName, module)}>{action}</button>
      ))}
    </div>
  );
}

export function PaginationControls({ module, page, pageSize, total, onPageChange }: { module: string; page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  return (
    <div className="pagination-controls" aria-label={`${module} mock pagination`}>
      <span>{module}: showing {start}-{end} of {total} mock rows · page {safePage} of {totalPages}</span>
      <div>
        <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>Previous</button>
        <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>Next</button>
      </div>
    </div>
  );
}

export function RowActionPreviewPanel({ preview, onClear }: { preview: RowActionPreview | null; onClear: () => void }) {
  return (
    <section className="row-action-preview-panel" aria-label="mock row action preview">
      <div>
        <span className="panel-eyebrow">Row action preview</span>
        <h2>{preview ? `${preview.action} · ${preview.itemName}` : 'No row action selected yet'}</h2>
        <p>{preview ? 'This shows what the clicked admin-table row action would route to in the current Laravel app and the rebuilt stack.' : 'Click View, Edit, Duplicate / Save as Copy, or Manage in any list table to populate this mock-only preview.'}</p>
      </div>
      {preview ? (
        <div className="row-action-preview-grid">
          <div><strong>Module</strong><span>{preview.module}</span></div>
          <div><strong>Legacy route pattern</strong><span>{preview.legacyRoute}</span></div>
          <div><strong>Modern rebuild target</strong><span>{preview.rebuiltTarget}</span></div>
          <div><strong>Safety</strong><span>No save, delete, or production mutation executed.</span></div>
          <button className="action-button quiet" type="button" onClick={onClear}>Clear preview</button>
        </div>
      ) : null}
    </section>
  );
}

export function ListControls({ module, query, status, sort, count, total, onQueryChange, onStatusChange, onSortChange, onReset }: {
  module: string;
  query: string;
  status: string;
  sort: ListSort;
  count: number;
  total: number;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: ListSort) => void;
  onReset: () => void;
}) {
  return (
    <div className="list-controls" aria-label={`${module} mock list controls`}>
      <div>
        <label className="field-label" htmlFor={`${module}-search`}>Search {module}</label>
        <input id={`${module}-search`} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search name, venue, status, city..." />
      </div>
      <div>
        <label className="field-label" htmlFor={`${module}-status`}>Status filter</label>
        <select id={`${module}-status`} value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="Published">Published</option>
          <option value="Active">Active</option>
          <option value="Needs merge review">Needs merge review</option>
          <option value="New">New</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor={`${module}-sort`}>Sort</label>
        <select id={`${module}-sort`} value={sort} onChange={(event) => onSortChange(event.target.value as ListSort)}>
          <option value="newest">Newest / admin default</option>
          <option value="name">Name A-Z</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="list-control-summary">
        <span>{count} of {total} mock rows</span>
        <button className="action-button quiet" type="button" onClick={onReset}>Reset list controls</button>
      </div>
    </div>
  );
}
