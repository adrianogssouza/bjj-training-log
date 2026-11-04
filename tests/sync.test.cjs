/* eslint-disable @typescript-eslint/no-require-imports */
const test=require('node:test');
const assert=require('node:assert/strict');
const {emptyTrainingState:initialState}=require('../src/lib/training-state.ts');
const {SyncController,SyncConflict}=require('../src/lib/cloud-sync.ts');
const clone=v=>JSON.parse(JSON.stringify(v));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const wait=()=>new Promise(r=>setImmediate(r));
function mockStore(state=initialState()) {
 let row=state?{data:clone(state),revision:0}:null;
 return {
  get row(){return clone(row);},
  set row(r){row=clone(r);},
  async read(){return clone(row);},
  async write(data,revision){
   if((row?.revision??null)!==revision)throw new SyncConflict();
   row={data:clone(data),revision:revision===null?0:revision+1};return clone(row);
  }
 };
}
test('criação remota e salvamentos serializados preservam a última edição',async()=>{
 const store=mockStore(null),data=initialState(),copies=[];
 const gate=deferred();let first=true;
 const wrapped={read:()=>store.read(),async write(d,r){if(first){first=false;await gate.promise;}return store.write(d,r);}};
 const c=new SyncController(wrapped,data,null,x=>copies.push(clone(x)),()=>{},false);
 const saving=c.flush();
 c.change({...data,stock:{frango:2}});
 gate.resolve();await saving;
 assert.equal(c.status,'synced');assert.equal(store.row.data.stock.frango,2);
 assert.equal(store.row.revision,1);assert.equal(copies.at(-1).pending,false);
});
test('edição simultânea gera conflito sem sobrescrever o outro dispositivo',async()=>{
 const store=mockStore(),data=store.row.data;
 const a=new SyncController(store,data,0,()=>{},()=>{});
 const b=new SyncController(store,data,0,()=>{},()=>{});
 a.change({...data,stock:{frango:1}});await wait();
 b.change({...data,stock:{frango:2}});await wait();
 assert.equal(b.status,'conflict');assert.equal(b.data.stock.frango,2);
 assert.equal(store.row.data.stock.frango,1);
 await b.flush();assert.equal(store.row.data.stock.frango,1);
});
test('falha de rede conserva alterações para nova tentativa',async()=>{
 const store=mockStore();let fail=true;const copies=[];
 const c=new SyncController({read:()=>store.read(),write:(d,r)=>fail?Promise.reject(Error('offline')):store.write(d,r)},store.row.data,0,x=>copies.push(clone(x)),()=>{});
 c.change({...c.data,price:{arroz:5}});await wait();
 assert.equal(c.status,'error');assert.equal(copies.at(-1).pending,true);
 fail=false;await c.flush();assert.equal(c.status,'synced');assert.equal(store.row.data.price.arroz,5);
});
test('consulta em voo não substitui alterações locais novas',async()=>{
 const store=mockStore(),gate=deferred();const remote=store.row;
 const c=new SyncController({read:()=>gate.promise,write:(d,r)=>store.write(d,r)},remote.data,0,()=>{},()=>{});
 const pending=c.refresh();
 c.change({...c.data,stock:{arroz:8}});
 gate.resolve({...remote,revision:1});await pending;await wait();
 assert.equal(c.data.stock.arroz,8);assert.equal(store.row.data.stock.arroz,8);
});
test('consulta atualiza dispositivo limpo e encerramento ignora resposta tardia',async()=>{
 const store=mockStore(),data=store.row.data;
 const c=new SyncController(store,data,0,()=>{},()=>{});
 store.row={data:{...data,stock:{arroz:3}},revision:1};await c.refresh();
 assert.equal(c.data.stock.arroz,3);
 const gate=deferred();let calls=0;
 const closed=new SyncController({read:()=>gate.promise,write:(d,r)=>store.write(d,r)},data,0,()=>calls++,()=>calls++);
 const fetching=closed.refresh();closed.dispose();gate.resolve(store.row);await fetching;
 assert.equal(calls,0);
});
test('erro de persistência local nunca é exibido como sincronizado',async()=>{
 const store=mockStore();
 const c=new SyncController(store,store.row.data,0,()=>{throw Error('quota');},()=>{});
 c.change({...c.data,stock:{arroz:4}});await wait();
 assert.equal(c.status,'error');assert.equal(store.row.data.stock.arroz,4);
});
