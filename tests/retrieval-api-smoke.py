"""Local mock identity only. Disposable fixtures; never targets production."""
import runpy,json,sqlite3,pathlib,uuid
ctx=runpy.run_path('tests/api-smoke.py');call=ctx['call']
assert call('/api/retrieval',authed=False)[0]==401
assert call('/api/knowledge/resources',authed=False)[0]==401
code,res=call('/api/knowledge/resources');assert code==200 and len(res['seeds'])==16 and len(res['cases'])==40
assert all(not s['generation_allowed'] and s['status']=='draft' for s in res['seeds'])
code,saved=call('/api/retrieval');assert code==200
cfg=dict(saved['config']);cfg['topK']=2
code,v=call('/api/retrieval','PUT',{'expectedRevision':saved['revision'],'config':cfg});assert code==200,(code,v)
assert call('/api/retrieval','PUT',{'expectedRevision':saved['revision'],'config':cfg})[0]==409
assert call('/api/retrieval','PUT',{'expectedRevision':v['revision'],'config':dict(cfg,topK=99)})[0]==400
assert call('/api/retrieval','POST',{'query':'保存'},origin='https://evil.invalid')[0]==403
ids=[]
def doc(**p):
 code,r=call('/api/knowledge','POST',dict(title='检索验证_'+uuid.uuid4().hex,source='本地虚构测试',content='开封保存请核对标签。本条为测试，不代表真实产品。',category='product_fact',**p));assert code==200,(code,r);ids.append(r['id']);return r['id']
try:
 id=doc();query='开封保存'
 assert all(r['id']!=id for r in call('/api/retrieval','POST',{'query':query})[1]['results'])
 assert call('/api/knowledge','PATCH',{'id':id,'status':'approved','reviewer':'本地测试'})[0]==200
 code,r=call('/api/retrieval','POST',{'query':query});assert code==200 and any(x['id']==id for x in r['results']),(code,r)
 assert r['config']['topK']==2 and r['configRevision']==v['revision']
 assert all(r['id']!=id for r in call('/api/retrieval','POST',{'query':query,'config':dict(cfg,minScore=1)})[1]['results'])
 assert call('/api/retrieval')[1]['config']['minScore']==cfg['minScore']
 code,a=call('/api/analyze','POST',{'history':[{'role':'user','content':query}]});assert code==200 and any(x['id']==id for x in a['retrieval']['results']),(code,a)
 expired=doc(expiresAt='2000-01-01');assert call('/api/knowledge','PATCH',{'id':expired,'status':'approved','reviewer':'本地测试'})[0]==200
 assert all(r['id']!=expired for r in call('/api/retrieval','POST',{'query':query})[1]['results'])
 assert call('/api/knowledge','PATCH',{'id':id,'status':'expired'})[0]==200
 assert all(r['id']!=id for r in call('/api/retrieval','POST',{'query':query})[1]['results'])
 for f in pathlib.Path('.wrangler/state/v3/d1').glob('**/*.sqlite'):
  db=sqlite3.connect(f)
  if db.execute("SELECT name FROM sqlite_master WHERE name='retrieval_settings'").fetchone():break
 foreign='FOREIGN_'+uuid.uuid4().hex
 db.execute("INSERT INTO knowledge_records(id,user_id,title,content,source,version,status,updated_at) VALUES(?,?,?,?,?,1,'approved',?)",(foreign,'foreign-user','开封保存','开封保存开封保存','fixture','2026-10-23'));db.commit();ids.append(foreign)
 assert all(r['id']!=foreign for r in call('/api/retrieval','POST',{'query':query})[1]['results'])
finally:
 for f in pathlib.Path('.wrangler/state/v3/d1').glob('**/*.sqlite'):
  db=sqlite3.connect(f)
  if db.execute("SELECT name FROM sqlite_master WHERE name='knowledge_records'").fetchone():
   db.executemany('DELETE FROM knowledge_records WHERE id=?',[(id,) for id in ids]);db.commit()
  db.close()
 current=call('/api/retrieval')[1]
 assert call('/api/retrieval','PUT',{'expectedRevision':current['revision'],'config':saved['config']})[0]==200
print('PASS: retrieval auth/origin, resource isolation, config CAS/limits/preview, draft/expiry filtering, analyze integration, foreign corpus isolation')
