export const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
export function migrateState(value,initial){
 const s=clone(value?.customers?.length?value:initial);s.messages??={};s.notes??={};s.drafts??={};s.events??=[];s.actionLog??=[];s.evaluations??=[];
 for(const c of s.customers){c.caseStatus??='未回复';c.observations??=[];c.tags=c.tags.map(t=>t==='使用不规律'?'历史标签：使用情况待核实':t);s.messages[c.id]=(s.messages[c.id]||[]).map((m,i)=>typeof m==='string'?{id:'legacy-'+c.id+'-'+i,role:'assistant',content:m,at:''}:m);}
 for(const t of s.tasks){t.timingKind??='suggested';t.preference??=t.time||'待安排';}
 // Old analyses combine actions and lack provenance; preserve conversation, re-analyze.
 s.analyses={};return s;
}
export function readChange(state,change){const v=state[change.area];return Array.isArray(v)?v.find(x=>x.id===change.id)||null:v[change.id]??null}
export function putChange(state,change,value){const v=state[change.area];if(Array.isArray(v)){const i=v.findIndex(x=>x.id===change.id);if(value===null){if(i>=0)v.splice(i,1)}else if(i>=0)v[i]=clone(value);else v.push(clone(value))}else if(value===null)delete v[change.id];else v[change.id]=clone(value)}
export function undoEntry(state,entry){if(entry.undone)throw new Error('此操作已撤销');for(const ch of entry.changes)if(JSON.stringify(readChange(state,ch))!==JSON.stringify(ch.after))throw new Error('相关记录已被后续操作修改，请先处理后续变更');for(const ch of [...entry.changes].reverse())putChange(state,ch,ch.before);entry.undone=true;}
export function taskChanges(state,c,analysis,task){
 const changes=[];
 if(analysis.shouldPausePurchase)for(const t of state.tasks.filter(t=>t.cid===c.id&&!t.done&&(analysis.stage==='停止营销'?['复购跟进','咨询跟进','预约回访','购后回访'].includes(t.type):['复购跟进','咨询跟进'].includes(t.type))))changes.push({area:'tasks',id:t.id,before:clone(t),after:{...clone(t),done:true,result:'根据客户最新联系偏好结束本轮跟进'}});
 if(task){if(task.timingKind==='confirmed'&&!task.confirmedByAdvisor)throw new Error('预约时间需营养师核对确认');if(task.timingKind==='confirmed'&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(task.time||''))throw new Error('已预约任务必须填写明确日期和时段');changes.push({area:'tasks',id:task.id,before:null,after:clone(task)})}
 return changes;
}
