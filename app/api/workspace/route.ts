import {authorize,bodyJson,database,json,fail,ApiError} from '../../../lib/ai-server';
import {validateWorkspace} from '../../../lib/workspace.mjs';
export async function GET(req:Request){try{const u=await authorize(req);const row=await database().prepare('SELECT payload,revision,updated_at FROM workspaces WHERE user_id=?').bind(u).first<{payload:string;revision:number;updated_at:string}>();return json(row?{scope:u,state:JSON.parse(row.payload),revision:row.revision,updatedAt:row.updated_at}:{scope:u,state:null,revision:0})}catch(e){return fail(e)}}
export async function PUT(req:Request){try{const u=await authorize(req,true);const body=await bodyJson(req,400000);if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)throw new ApiError(400,'缺少有效的数据版本');let state;try{state=validateWorkspace(body.state)}catch(e){throw new ApiError(400,(e as Error).message)}const now=new Date().toISOString();let result;
 if(body.expectedRevision===0){result=await database().prepare('INSERT INTO workspaces (user_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(u,JSON.stringify(state),now).first<{revision:number}>()}
 else result=await database().prepare('UPDATE workspaces SET payload=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(state),now,u,body.expectedRevision).first<{revision:number}>();
 if(!result)return json({error:'其他窗口已更新记录。请保留本地修改并重新载入云端版本。',conflict:true},409);return json({ok:true,revision:result.revision,updatedAt:now});
 }catch(e){return fail(e)}}
