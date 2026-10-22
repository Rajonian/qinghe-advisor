export const CASE_STATUSES=['未回复','处理中','待专业协助','已结束'];
export const TIMING_KINDS=['preference','suggested','confirmed'];
export function validateWorkspace(value){
 if(!value||typeof value!=='object'||!Array.isArray(value.customers)||!value.customers.length||value.customers.length>50||!Array.isArray(value.tasks)||value.tasks.length>500)throw new Error('工作台数据格式不正确');
 const clean=JSON.parse(JSON.stringify(value));
 const allowed=['customers','tasks','messages','notes','events','drafts','analyses','actionLog','evaluations'];
 for(const key of Object.keys(clean))if(!allowed.includes(key))delete clean[key];
 const ids=new Set();for(const c of clean.customers){if(!Number.isSafeInteger(c.id)||ids.has(c.id)||typeof c.name!=='string'||c.name.length>40||!Array.isArray(c.tags)||c.tags.length>20||c.tags.some(t=>typeof t!=='string'||t.length>120))throw new Error('客户字段无效');ids.add(c.id);if(c.caseStatus&&!CASE_STATUSES.includes(c.caseStatus))throw new Error('未知接待状态')}
 for(const t of clean.tasks){if(!ids.has(t.cid)||typeof t.title!=='string'||t.title.length>200||typeof t.done!=='boolean')throw new Error('任务字段无效');if(t.timingKind&&!TIMING_KINDS.includes(t.timingKind))throw new Error('任务时间状态无效')}
 for(const name of ['messages','notes','drafts','analyses']){clean[name]??={};if(typeof clean[name]!=='object'||Array.isArray(clean[name]))throw new Error('工作台字段无效');for(const key of Object.keys(clean[name]))if(!ids.has(Number(key)))throw new Error('记录关联客户无效')}
 for(const messages of Object.values(clean.messages)){if(!Array.isArray(messages)||messages.length>160||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>3000))throw new Error('会话记录无效或过多，请归档后继续')}
 clean.events=Array.isArray(clean.events)?clean.events.slice(0,100):[];clean.actionLog=Array.isArray(clean.actionLog)?clean.actionLog.slice(0,40):[];clean.evaluations=Array.isArray(clean.evaluations)?clean.evaluations.slice(0,12):[];
 if(new TextEncoder().encode(JSON.stringify(clean)).length>350000)throw new Error('演示记录已超过容量限制，请先导出归档');
 return clean;
}
export function timingPreference(text,date){
 const exact=text.match(/(\d{4}-\d{2}-\d{2})[日号 T，,]*(\d{1,2}):(\d{2})/);
 if(exact&&Number.isFinite(Date.parse(`${exact[1]}T${exact[2].padStart(2,'0')}:${exact[3]}`)))return {kind:'suggested',time:`${exact[1]}T${exact[2].padStart(2,'0')}:${exact[3]}`,preference:exact[0],evidence:text};
 if(/下个?月|下月/.test(text)){const d=new Date(date+'T12:00:00Z');d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);return {kind:'preference',time:'',preference:d.toISOString().slice(0,7)+'（具体日期待确认）',evidence:text}}
 return {kind:'preference',time:'',preference:/周末/.test(text)?'周末（日期与时段待确认）':'联系时间待确认',evidence:text};
}
export function observations(input){
 const text=input.history.at(-1).content;
 const rows=[{kind:'customer',text:'客户原话：'+text,evidence:text,source:'最新客户消息'}];
 if(/没怎么吃/.test(text))rows.push({kind:'customer',text:'客户自述：近期使用较少',evidence:text,source:'最新客户消息'});
 if(input.customer.order?.date){const days=Math.floor((Date.parse(input.referenceDate)-Date.parse(input.customer.order.date))/86400000);if(Number.isFinite(days)&&days>=0)rows.push({kind:'calculated',text:`距离上次购买${days}天`,evidence:input.customer.order.date,source:'订单日期计算，不代表实际消耗'})}
 rows.push({kind:'inference',text:/下个?月|下月|没怎么吃|还有/.test(text)?'可能暂时没有补货需求，需顾问核对':'需要进一步确认当前服务需求',evidence:text,source:'AI/规则推测，不作为客户事实'});
 return rows;
}
