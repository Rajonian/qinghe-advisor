import {database} from './ai-server';
import {DEFAULT_RETRIEVAL} from './retrieval.mjs';
export async function retrievalSettings(user:string){const r=await database().prepare('SELECT payload,revision,updated_at FROM retrieval_settings WHERE user_id=?').bind(user).first<{payload:string,revision:number,updated_at:string}>();return {config:r?JSON.parse(r.payload):DEFAULT_RETRIEVAL,revision:r?.revision||0,updatedAt:r?.updated_at||null}}
export async function knowledgeRecords(user:string){const r=await database().prepare('SELECT id,title,content,source,version,status,reviewer,updated_at,category,expires_at FROM knowledge_records WHERE user_id=? ORDER BY updated_at DESC LIMIT 80').bind(user).all();return r.results}
