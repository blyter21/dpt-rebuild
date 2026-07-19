'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type RecordRow = Record<string, unknown>;
type Kind = 'events' | 'seasons' | 'leagues' | 'venues';
type OptionRow = { id: number; name: string; city?: string | null; state?: string | null };
type Options = { leagues?: OptionRow[]; seasons?: OptionRow[]; venues?: OptionRow[] };
type Field = { key: string; label: string; type: 'text' | 'url' | 'datetime-local' | 'textarea' | 'relation' | 'boolean'; options?: keyof Options; required?: boolean };
type Spec = { title: string; columns: Array<[string, string]>; fields: Field[] };

const config: Record<Kind, Spec> = {
  events: {
    title: 'Events List',
    columns: [['id','#'],['name','Name'],['season_id','Season'],['start_at','Start Date'],['end_at','End Date'],['status','Status']],
    fields: [
      {key:'season_id',label:'Season',type:'relation',options:'seasons',required:true},
      {key:'venue_id',label:'Venue',type:'relation',options:'venues'},
      {key:'name',label:'Name',type:'text',required:true},
      {key:'description',label:'Description',type:'textarea'},
      {key:'logo_url',label:'Logo URL',type:'url'},
      {key:'banner_url',label:'Banner Image URL',type:'url'},
      {key:'start_at',label:'Start Date',type:'datetime-local'},
      {key:'end_at',label:'End Date',type:'datetime-local'},
      {key:'facebook_event_url',label:'Facebook Event URL',type:'url'},
      {key:'rules_description',label:'Rules Description',type:'textarea'},
    ],
  },
  seasons: {
    title: 'Seasons List',
    columns: [['id','#'],['name','Name'],['league_id','League'],['start_at','Start Date'],['end_at','End Date'],['status','Status']],
    fields: [
      {key:'league_id',label:'League',type:'relation',options:'leagues',required:true},
      {key:'name',label:'Name',type:'text',required:true},
      {key:'description',label:'Description',type:'textarea'},
      {key:'is_default',label:'Default Season',type:'boolean'},
      {key:'logo_url',label:'Logo URL',type:'url'},
      {key:'banner_url',label:'Banner Image URL',type:'url'},
      {key:'start_at',label:'Start Date',type:'datetime-local'},
      {key:'end_at',label:'End Date',type:'datetime-local'},
    ],
  },
  leagues: {
    title: 'Leagues List',
    columns: [['id','#'],['name','Name'],['status','Status']],
    fields: [{key:'name',label:'Name',type:'text',required:true},{key:'description',label:'Description',type:'textarea'}],
  },
  venues: {
    title: 'Venues List',
    columns: [['id','#'],['name','Name'],['address','Address'],['city','City'],['state','State'],['zip','Zip'],['status','Status']],
    fields: [
      {key:'name',label:'Name',type:'text',required:true},{key:'address',label:'Address',type:'textarea'},
      {key:'city',label:'City',type:'text'},{key:'state',label:'State',type:'text'},{key:'zip',label:'Zip',type:'text'},
      {key:'phone',label:'Phone',type:'text'},{key:'logo_url',label:'Logo URL',type:'url'},{key:'banner_url',label:'Banner Image URL',type:'url'},
      {key:'facebook_url',label:'Facebook URL',type:'url'},{key:'twitter_url',label:'Twitter URL',type:'url'},
      {key:'instagram_url',label:'Instagram URL',type:'url'},{key:'youtube_url',label:'YouTube URL',type:'url'},
      {key:'website',label:'Website',type:'url'},{key:'map_location_address',label:'Map Location / Address',type:'textarea'},
    ],
  },
};

function inputValue(value: unknown, type: Field['type']) {
  if (type === 'boolean') return value ? 'true' : 'false';
  if (!value) return '';
  return type === 'datetime-local' ? String(value).slice(0,16) : String(value);
}

export function ConfigurationManager({ kind }: { kind: Kind }) {
  const spec = config[kind];
  const [rows,setRows] = useState<RecordRow[]>([]);
  const [options,setOptions] = useState<Options>({});
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState('id');
  const [descending,setDescending] = useState(true);
  const [page,setPage] = useState(0);
  const [draft,setDraft] = useState<RecordRow|null>(null);
  const [viewing,setViewing] = useState<RecordRow|null>(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);

  const load = async () => {
    const response = await fetch(`/api/admin/configuration/${kind}`,{cache:'no-store'});
    const payload = await response.json() as { records?: RecordRow[]; options?: Options; error?: string };
    if (!response.ok) { setMessage(payload.error || 'Could not load records'); return; }
    setRows(payload.records || []); setOptions(payload.options || {});
  };
  useEffect(() => { void load(); }, [kind]);

  const optionLabel = (fieldKey:string,value:unknown) => {
    const field = spec.fields.find((candidate) => candidate.key === fieldKey);
    const source = field?.options ? options[field.options] || [] : [];
    const match = source.find((item) => String(item.id) === String(value));
    return match ? `${match.name}${match.city ? ` — ${match.city}${match.state ? `, ${match.state}` : ''}` : ''}` : (value ? String(value) : '—');
  };
  const formatCell = (key:string,value:unknown) => {
    if (key === 'status') return value ? 'Published' : 'Draft';
    if (key.endsWith('_id')) return optionLabel(key,value);
    if ((key === 'start_at' || key === 'end_at') && value) return String(value).slice(0,10);
    return value === null || value === undefined || value === '' ? '—' : String(value);
  };
  const filtered = useMemo(() => {
    const result = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
    return result.sort((a,b) => {
      const comparison = String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''),undefined,{numeric:true});
      return descending ? -comparison : comparison;
    });
  },[rows,query,sort,descending]);
  const perPage=10;
  const visible=filtered.slice(page*perPage,page*perPage+perPage);

  const submit = async (action:'save'|'status'|'delete',row:RecordRow,status?:boolean) => {
    setBusy(true); setMessage('');
    const values=Object.fromEntries(spec.fields.map((field)=>[field.key,inputValue(row[field.key],field.type)]));
    const body = action === 'save' ? {action,id:row.id,values} : action === 'status' ? {action,id:row.id,status} : {action,id:row.id};
    const response=await fetch(`/api/admin/configuration/${kind}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const payload=await response.json() as {error?:string}; setBusy(false);
    if(!response.ok){setMessage(payload.error || 'Change rejected');return;}
    setDraft(null);setViewing(null);setMessage(action==='delete'?'Record safely soft-deleted.':'Configuration saved.');await load();
  };
  const changeSort=(key:string)=>{if(sort===key)setDescending(!descending);else{setSort(key);setDescending(false);}};
  const entityLabel=kind.slice(0,-1);

  return <div className="configuration-manager">
    <div className="configuration-toolbar">
      <h3>{spec.title}</h3>
      <button type="button" className="primary" onClick={()=>setDraft({})}>＋ Create {entityLabel}</button>
      <label>Show <select aria-label="Entries per page" value="10" disabled><option>10</option></select> entries</label>
      <label>Search: <input value={query} onChange={(event)=>{setQuery(event.target.value);setPage(0);}} /></label>
    </div>
    {message ? <p className="configuration-message" role="status">{message}</p> : null}
    {draft ? <form className="configuration-form" onSubmit={(event:FormEvent)=>{event.preventDefault();void submit('save',draft);}}>
      <header><div><span>{draft.id?'Edit':'Create'}</span><h3>{entityLabel}</h3></div><button type="button" onClick={()=>setDraft(null)}>Close</button></header>
      <p>Fields mirror the authenticated production form. Media is stored as migrated asset URLs.</p>
      <div className="configuration-form-grid">{spec.fields.map((field)=><label key={field.key}>{field.label}
        {field.type==='textarea'?<textarea required={field.required} value={inputValue(draft[field.key],field.type)} onChange={(event)=>setDraft({...draft,[field.key]:event.target.value})}/>
        :field.type==='relation'?<select required={field.required} value={inputValue(draft[field.key],field.type)} onChange={(event)=>setDraft({...draft,[field.key]:event.target.value})}><option value="">Select {field.label}</option>{(field.options?options[field.options]||[]:[]).map((option)=><option key={option.id} value={option.id}>{option.name}{option.city?` — ${option.city}${option.state?`, ${option.state}`:''}`:''}</option>)}</select>
        :field.type==='boolean'?<select value={inputValue(draft[field.key],field.type)} onChange={(event)=>setDraft({...draft,[field.key]:event.target.value})}><option value="false">No</option><option value="true">Yes</option></select>
        :<input required={field.required} type={field.type} value={inputValue(draft[field.key],field.type)} onChange={(event)=>setDraft({...draft,[field.key]:event.target.value})}/>}</label>)}</div>
      <div className="configuration-actions"><button disabled={busy} className="primary" type="submit">{busy?'Saving…':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
    </form>:null}
    {viewing?<section className="configuration-form"><header><div><span>View</span><h3>{entityLabel} details</h3></div><button type="button" onClick={()=>setViewing(null)}>Close</button></header>{spec.fields.map((field)=><p key={field.key}><strong>{field.label}:</strong> {field.type==='relation'?optionLabel(field.key,viewing[field.key]):formatCell(field.key,viewing[field.key])}</p>)}</section>:null}
    <div className="dpt-admin-table-wrap"><table className="dpt-admin-table"><thead><tr>{spec.columns.map(([key,label])=><th key={key}><button type="button" onClick={()=>changeSort(key)}>{label}{sort===key?(descending?' ▼':' ▲'):''}</button></th>)}<th>Actions</th></tr></thead><tbody>{visible.map((row)=><tr key={String(row.id)}>{spec.columns.map(([key])=><td key={key}>{formatCell(key,row[key])}</td>)}<td className="configuration-actions"><button className="edit" onClick={()=>setDraft(row)}>Edit</button><button className="view" onClick={()=>setViewing(row)}>View</button><button onClick={()=>void submit('status',row,!row.status)}>{row.status?'Unpublish':'Publish'}</button><button className="danger" onClick={()=>{if(window.confirm('Soft-delete this record? Active child records block deletion.'))void submit('delete',row);}}>Delete</button></td></tr>)}</tbody></table></div>
    <div className="players-pagination"><span>Showing {filtered.length?page*perPage+1:0} to {Math.min((page+1)*perPage,filtered.length)} of {filtered.length} entries</span><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><strong>{page+1}</strong><button disabled={(page+1)*perPage>=filtered.length} onClick={()=>setPage(page+1)}>Next</button></div>
  </div>;
}
