import {authorize,json,fail} from '../../../../lib/ai-server';
import resources from '../../../../lib/knowledge-resources.json';
export async function GET(req:Request){try{await authorize(req);return json(resources)}catch(e){return fail(e)}}
