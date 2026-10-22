"""Local-only API smoke checks; uses the documented loopback mock sign-in."""
import urllib.request,urllib.error,http.cookiejar,json,sqlite3,pathlib,uuid
base='http://127.0.0.1:4173'
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path,method='GET',data=None,origin=base,authed=True):
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','Origin':origin},method=method)
 try:
  with (client.open(req) if authed else urllib.request.urlopen(req)) as r:code,raw=r.status,r.read()
 except urllib.error.HTTPError as e:code,raw=e.code,e.read()
 try:return code,json.loads(raw)
 except:return code,{}
assert call('/api/workspace',authed=False)[0]==401
client.open(base+'/signin-with-chatgpt?return_to=/').read()
code,w=call('/api/workspace');assert code==200 and w['state'],(code,w)
original=json.loads(json.dumps(w['state']));modified=json.loads(json.dumps(original));modified['notes']['1']='local API persistence check'
code,d=call('/api/workspace','PUT',{'expectedRevision':w['revision'],'state':modified});assert code==200,(code,d)
assert call('/api/workspace')[1]['state']['notes']['1']=='local API persistence check'
assert call('/api/workspace','PUT',{'expectedRevision':w['revision'],'state':modified})[0]==409
assert call('/api/workspace','PUT',{'expectedRevision':d['revision'],'state':modified},origin='https://evil.invalid')[0]==403
assert call('/api/workspace','PUT',{'expectedRevision':d['revision'],'state':original})[0]==200
foreign='qa_foreign_'+uuid.uuid4().hex
conn=None
for f in pathlib.Path('.wrangler/state/v3/d1').glob('**/*.sqlite'):
 candidate=sqlite3.connect(f)
 if candidate.execute("SELECT name FROM sqlite_master WHERE name='knowledge_records'").fetchone():conn=candidate;break
assert conn
# Foreign-account rows are fixture data; caller must neither list nor update them.
conn.execute("INSERT INTO knowledge_records (id,user_id,title,content,source,version,status,updated_at) VALUES (?,?,?,?,?,1,'approved',?)",(foreign,'other-user','foreign fixture','must not be visible','test','2026-10-23T00:00:00Z'));conn.commit()
assert all(r['id']!=foreign for r in call('/api/knowledge')[1]['records'])
assert call('/api/knowledge','PATCH',{'id':foreign,'status':'expired'})[0]==404
code,d=call('/api/knowledge','POST',{'title':'API测试资料','content':'仅为测试样例，不可用于实际商品建议。','source':'测试标签v1'});assert code==200,(code,d)
id=d['id']
assert call('/api/knowledge','PATCH',{'id':id,'status':'approved','reviewer':''})[0]==400
assert call('/api/knowledge','PATCH',{'id':id,'status':'approved','reviewer':'测试审核'})[0]==200
code,d=call('/api/knowledge','POST',{'title':'API测试资料','content':'第二版样例','source':'测试标签v2','previousId':id});assert code==200
records=call('/api/knowledge')[1]['records'];assert any(r['id']==d['id'] and r['version']==2 and r['status']=='draft' for r in records)
assert call('/api/knowledge','PATCH',{'id':id,'status':'expired'})[0]==200
# Test-only fixtures are removable; no real business data is deleted.
conn.execute('DELETE FROM knowledge_records WHERE id IN (?,?,?)',(foreign,id,d['id']));conn.commit();conn.close()
print('PASS: authentication, cloud persistence, conflict409, origin403, foreign account isolation, reviewer required, new-version draft, expiry')
