import type { DetailMode } from './types';

export function MockField({ label, value = '', type = 'text', onChange, error }: { label: string; value?: string; type?: string; onChange?: (value: string) => void; error?: string }) {
  const editable = Boolean(onChange);
  return (
    <label className={`mock-field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {type === 'textarea'
        ? <textarea value={value} readOnly={!editable} onChange={(event) => onChange?.(event.target.value)} />
        : <input value={value} readOnly={!editable} onChange={(event) => onChange?.(event.target.value)} />}
      {error ? <em>{error}</em> : null}
    </label>
  );
}

export function MockOnlyNotice({ source }: { source: string }) {
  return <div className="mock-only-notice">Mock-only detail screen · no save/write actions · fields captured from {source}</div>;
}

export function DetailModeControls({ mode, dirty, showValidation, onModeChange, onValidate, onCancel, onReset, onClearRequired }: {
  mode: DetailMode;
  dirty: boolean;
  showValidation: boolean;
  onModeChange: (mode: DetailMode) => void;
  onValidate: () => void;
  onCancel: () => void;
  onReset: () => void;
  onClearRequired: () => void;
}) {
  return (
    <div className="detail-mode-controls">
      <div className="detail-mode-toggle" aria-label="create or edit mode">
        <button className={mode === 'create' ? 'active' : ''} type="button" onClick={() => onModeChange('create')}>Create Mode</button>
        <button className={mode === 'edit' ? 'active' : ''} type="button" onClick={() => onModeChange('edit')}>Edit Mode</button>
      </div>
      <span className={`dirty-indicator ${dirty ? 'dirty' : ''}`}>{dirty ? 'Unsaved mock changes' : 'No unsaved mock changes'}</span>
      {showValidation ? <span className="validation-indicator">Mock validation enabled</span> : null}
      <div className="button-row">
        <button className="action-button quiet" type="button" onClick={onValidate}>Validate mock form</button>
        <button className="action-button quiet" type="button" onClick={onClearRequired}>Clear required fields</button>
        <button className="action-button quiet" type="button" onClick={onCancel}>Cancel edits</button>
        <button className="action-button quiet" type="button" onClick={onReset}>Reset detail demo</button>
      </div>
    </div>
  );
}
