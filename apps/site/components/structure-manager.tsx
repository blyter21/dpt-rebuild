'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
type Row = Record<string, any>;
type Kind = 'blinds'|'payouts';
type TournamentType = { id:number; name:string; code:string };
const blankBlind = () => ({name:'',description:'',status:true,blind_intervals:20,blind_info:[{small_blind:'',big_blind:'',bbante:''}]});
const blankPayout = () => ({name:'',type:'range',tournament_type_id:'',rows:[{player_count_start:1,player_count_end:10,winners_count:1,standing:1,payout_percentage:100,payout_amount:null,points:null,prize_description:''}]});

export function StructureManager({kind}:{kind:Kind}) {
  const [records,setRecords]=useState<Row[]>([]);
  const [tournamentTypes,setTournamentTypes]=useState<TournamentType[]>([]);
  const [draft,setDraft]=useState<Row|null>(null);
  const [view,setView]=useState<Row|null>(null);
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('id');
  const [desc,setDesc]=useState(kind==='blinds');
  const [page,setPage]=useState(0);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const perPage=10;

  const load=async()=>{
    const response=await fetch(`/api/admin/structures/${kind}`,{cache:'no-store'});
    const payload=await response.json();
    if(response.ok){setRecords(payload.records||[]);setTournamentTypes(payload.tournamentTypes||[]);}else setMessage(payload.error||'Could not load records');
  };
  useEffect(()=>{void load();},[kind]);
  const filtered=useMemo(()=>records.filter((record)=>JSON.stringify(record).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>{const comparison=String(a[sort]??'').localeCompare(String(b[sort]??''),undefined,{numeric:true});return desc?-comparison:comparison;}),[records,query,sort,desc]);
  const visible=filtered.slice(page*perPage,page*perPage+perPage);

  const action=async(actionName:'save'|'status'|'delete'|'copy',row:Row,extra?:unknown)=>{
    setBusy(true);setMessage('');
    const values=kind==='blinds'
      ? {name:row.name,description:row.description||'',status:Boolean(row.status),blind_intervals:row.blind_intervals??null,blind_info:row.blind_info}
      : {name:row.name,type:row.type,tournament_type_id:row.tournament_type_id??null,rows:(row.rows||[]).map((item:Row)=>({id:item.id,player_count_start:item.player_count_start,player_count_end:item.player_count_end,winners_count:item.winners_count,standing:item.standing,payout_percentage:item.payout_percentage,payout_amount:item.payout_amount,points:item.points,prize_description:item.prize_description}))};
    const body=actionName==='save'?{action:actionName,id:row.id,values}:actionName==='status'?{action:actionName,id:row.id,status:extra}:{action:actionName,id:row.id};
    const response=await fetch(`/api/admin/structures/${kind}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const payload=await response.json();setBusy(false);
    if(!response.ok){setMessage(payload.error||'Change rejected');return;}
    setDraft(null);setView(null);setMessage(actionName==='delete'?'Record safely soft-deleted.':actionName==='copy'?'Copy created as an unpublished record.':'Saved.');await load();
  };
  const addBlind=(breakRow=false)=>setDraft((current)=>({...current,blind_info:[...(current?.blind_info||[]),breakRow?{addbreak:'Break',blind_interval:''}:{small_blind:'',big_blind:'',bbante:''}]}));
  const updateBlind=(index:number,key:string,value:string)=>setDraft((current)=>({...current,blind_info:current!.blind_info.map((item:any,itemIndex:number)=>itemIndex===index?{...item,[key]:value}:item)}));
  const addRange=()=>setDraft((current)=>({...current,rows:[...(current?.rows||[]),{player_count_start:'',player_count_end:'',winners_count:1,standing:1,payout_percentage:'',payout_amount:null,points:null,prize_description:''}]}));
  const updateRange=(index:number,key:string,value:string)=>setDraft((current)=>({...current,rows:current!.rows.map((item:any,itemIndex:number)=>itemIndex===index?{...item,[key]:value===''?null:Number.isNaN(Number(value))?value:Number(value)}:item)}));
  const title=kind==='blinds'?'Blinds List':'Points System List';
  const selectRecord=(record:Row)=>kind==='blinds'?{...record,blind_info:record.blind_info||[]}:{...record,rows:record.payout_template_rows||record.rows||[]};

  return <div className="configuration-manager">
    <div className="configuration-toolbar"><h3>{title}</h3><button className="primary" onClick={()=>setDraft(kind==='blinds'?blankBlind():blankPayout())}>＋ Create</button><label>Show <select value="10" disabled><option>10</option></select> entries</label><label>Search: <input value={query} onChange={(event)=>{setQuery(event.target.value);setPage(0);}}/></label></div>
    {message?<p className="configuration-message" role="status">{message}</p>:null}
    {draft?<form className="configuration-form" onSubmit={(event:FormEvent)=>{event.preventDefault();void action('save',draft,draft);}}>
      <header><div><span>{draft.id?'Edit':'Create'}</span><h3>{kind==='blinds'?'Blind':'Points System'}</h3></div><button type="button" onClick={()=>setDraft(null)}>Cancel</button></header>
      <div className="configuration-form-grid"><label>Name *<input required value={draft.name} onChange={(event)=>setDraft({...draft,name:event.target.value})}/></label>
      {kind==='blinds'?<><label>Status *<select value={String(draft.status)} onChange={(event)=>setDraft({...draft,status:event.target.value==='true'})}><option value="true">Published</option><option value="false">Unpublished</option></select></label><label>Blind Intervals (minutes)<input type="number" min="1" value={draft.blind_intervals??''} onChange={(event)=>setDraft({...draft,blind_intervals:event.target.value?Number(event.target.value):null})}/></label><label>Description<textarea value={draft.description||''} onChange={(event)=>setDraft({...draft,description:event.target.value})}/></label></>:<><label>Points structure<select value={draft.type} onChange={(event)=>setDraft({...draft,type:event.target.value})}><option value="range">DPT Standard Payout</option><option value="satellite">Satellite or Flight Payout</option><option value="formula">Formula</option></select></label><label>Tournament Type<select value={draft.tournament_type_id??''} onChange={(event)=>setDraft({...draft,tournament_type_id:event.target.value?Number(event.target.value):null})}><option value="">Not assigned</option>{tournamentTypes.map((type)=><option key={type.id} value={type.id}>{type.name}</option>)}</select></label></>}</div>
      {kind==='blinds'?<section><h4>Blind Info</h4><div className="dpt-admin-table-wrap"><table className="dpt-admin-table"><thead><tr><th>Small Blind / Break Info</th><th>Big Blind</th><th>BB Ante</th><th>Break interval</th><th/></tr></thead><tbody>{draft.blind_info.map((item:any,index:number)=><tr key={index}>{'addbreak' in item?<><td colSpan={3}><input aria-label="Break info" value={item.addbreak||''} onChange={(event)=>updateBlind(index,'addbreak',event.target.value)}/></td><td><input aria-label="Break interval" value={item.blind_interval||''} onChange={(event)=>updateBlind(index,'blind_interval',event.target.value)}/></td></>:<><td><input placeholder="Small Blind" value={item.small_blind||''} onChange={(event)=>updateBlind(index,'small_blind',event.target.value)}/></td><td><input placeholder="Big Blind" value={item.big_blind||''} onChange={(event)=>updateBlind(index,'big_blind',event.target.value)}/></td><td><input placeholder="BB Ante" value={item.bbante||''} onChange={(event)=>updateBlind(index,'bbante',event.target.value)}/></td><td/></>}<td><button type="button" className="danger" onClick={()=>setDraft({...draft,blind_info:draft.blind_info.filter((_:any,itemIndex:number)=>itemIndex!==index)})}>Remove</button></td></tr>)}</tbody></table></div><button type="button" onClick={()=>addBlind()}>Add Blind</button> <button type="button" onClick={()=>addBlind(true)}>Add Break</button></section>
      :<section><div className="configuration-actions"><button type="button" onClick={addRange}>Add Structure</button><span>{draft.rows.length} normalized payout rows</span></div><div className="dpt-admin-table-wrap"><table className="dpt-admin-table"><thead><tr>{['Range Start','Range End','No. of Winners','Standing','Percentage','Amount','Points','Prize'].map((label)=><th key={label}>{label}</th>)}<th/></tr></thead><tbody>{draft.rows.map((item:any,index:number)=><tr key={item.id||`new-${index}`}>{['player_count_start','player_count_end','winners_count','standing','payout_percentage','payout_amount','points','prize_description'].map((key)=><td key={key}><input aria-label={key} value={item[key]??''} onChange={(event)=>updateRange(index,key,event.target.value)}/></td>)}<td><button type="button" className="danger" onClick={()=>setDraft({...draft,rows:draft.rows.filter((_:any,itemIndex:number)=>itemIndex!==index)})}>Remove</button></td></tr>)}</tbody></table></div></section>}
      <div className="configuration-actions"><button className="primary" disabled={busy}>{busy?'Saving…':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
    </form>:null}
    {view?<section className="configuration-form"><header><h3>View Structure</h3><button onClick={()=>setView(null)}>Close</button></header><pre>{JSON.stringify(view,null,2)}</pre></section>:null}
    <div className="dpt-admin-table-wrap"><table className="dpt-admin-table"><thead><tr>{(kind==='blinds'?['#','Name','Status']:['#','Name','Type','Assigned Tournament']).map((label)=><th key={label}><button onClick={()=>{const field=label==='#'?'id':label.toLowerCase().replace(' ','_');setDesc(field===sort?!desc:false);setSort(field);}}>{label}</button></th>)}<th>Actions</th></tr></thead><tbody>{visible.map((record)=><tr key={record.id}><td>{record.id}</td><td>{record.name}</td>{kind==='blinds'?<td>{record.status?'Published':'Unpublished'}</td>:<><td>{record.type}</td><td>{record.assigned_tournaments||0}</td></>}<td className="configuration-actions">{(kind==='blinds'||record.type==='range')?<><button className="edit" onClick={()=>setDraft(selectRecord(record))}>Edit</button><button className="view" onClick={()=>setView(record)}>View{kind==='payouts'?' Structure':''}</button></>:null}<button onClick={()=>void action('copy',record)}>Copy</button>{kind==='blinds'?<button onClick={()=>void action('status',record,!record.status)}>{record.status?'Unpublish':'Publish'}</button>:null}<button className="danger" onClick={()=>{if(confirm('Soft-delete this structure? Assigned active tournaments block deletion.'))void action('delete',record);}}>Delete</button></td></tr>)}</tbody></table></div>
    <div className="players-pagination"><span>Showing {filtered.length?page*perPage+1:0} to {Math.min((page+1)*perPage,filtered.length)} of {filtered.length} entries</span><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><strong>{page+1}</strong><button disabled={(page+1)*perPage>=filtered.length} onClick={()=>setPage(page+1)}>Next</button></div>
  </div>;
}
