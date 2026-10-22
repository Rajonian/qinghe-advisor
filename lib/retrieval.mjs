// Versioned, deterministic lexical retrieval. Scores are coverage, not confidence.
export const DEFAULT_RETRIEVAL={chunkSize:500,overlap:60,topK:4,minScore:0.08,titleWeight:3,contextBudget:12000};
export function validateRetrieval(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('检索参数格式不正确');
 const ranges={chunkSize:[200,1200],overlap:[0,150],topK:[1,8],minScore:[0.01,1],titleWeight:[1,5],contextBudget:[6000,24000]};
 const out={};for(const [key,[min,max]] of Object.entries(ranges)){const v=value[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(key!=='minScore'&&!Number.isInteger(v)))throw new Error('参数超出范围：'+key);out[key]=v}
 if(out.overlap>=out.chunkSize/2)throw new Error('重叠长度需小于片段长度的一半');return out;
}
export function tokens(text){const s=String(text||'').toLowerCase();const out=s.match(/[a-z0-9]+(?:[-_.][a-z0-9]+)*/g)||[];for(const run of s.match(/[\u3400-\u9fff]+/g)||[]){if(run.length===1)out.push(run);else for(let i=0;i<run.length-1;i++)out.push(run.slice(i,i+2))}return [...new Set(out)]}
export function chunks(text,config=DEFAULT_RETRIEVAL){const out=[];for(let start=0;start<text.length;){let end=Math.min(start+config.chunkSize,text.length);if(end<text.length){const part=text.slice(start,end),boundary=Math.max(part.lastIndexOf('。'),part.lastIndexOf('\n'));if(boundary>config.chunkSize*0.6)end=start+boundary+1}out.push({start,end,text:text.slice(start,end)});if(end>=text.length)break;start=Math.max(start+1,end-config.overlap)}return out}
export function activeRecords(records,at=Date.now()){
 const latest=new Map();for(const r of records){if(r.status!=='approved'||(r.expires_at&&Date.parse(r.expires_at)<=at))continue;const prior=latest.get(r.title);if(!prior||Number(r.version)>Number(prior.version)||Number(r.version)===Number(prior.version)&&r.updated_at>prior.updated_at)latest.set(r.title,r)}return [...latest.values()];
}
export function retrieve(query,records,config=DEFAULT_RETRIEVAL){
 const cfg=validateRetrieval(config),terms=tokens(query),eligible=activeRecords(records),ranked=[];let chunkCount=0;
 for(const r of eligible){const titleTerms=new Set(tokens(r.title)),parts=chunks(r.content,cfg);chunkCount+=parts.length;let best=null;parts.forEach((p,i)=>{const body=new Set(tokens(p.text)),matched=terms.filter(t=>body.has(t)||titleTerms.has(t)),weight=terms.reduce((n,t)=>n+(body.has(t)?1:0)+(titleTerms.has(t)?cfg.titleWeight:0),0),score=terms.length?Math.min(1,weight/(terms.length*(cfg.titleWeight+1))):0;const hit={id:r.id,title:r.title,version:r.version,source:r.source,chunkId:r.id+':'+i,score:Number(score.toFixed(4)),matched,...p};if(!best||score>best.score)best=hit});if(best&&best.score>=cfg.minScore)ranked.push({...best,content:r.content})}
 ranked.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));let used=0;const results=[];for(const r of ranked){if(results.length>=cfg.topK)break;if(used+r.content.length>cfg.contextBudget)continue;used+=r.content.length;results.push(r)}
 return {query,config:cfg,terms,stats:{total:records.length,eligible:eligible.length,chunks:chunkCount,matched:ranked.length,selected:results.length,contextChars:used},results,available:results.map(r=>({id:r.id,title:r.title+' v'+r.version,text:r.content,source:r.source})),fallback:results.length?'evidence':'clarify',method:'中文双字词 / 英数词覆盖排序 · 完整资料组装'};
}
