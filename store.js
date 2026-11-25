/* Lớp lưu trữ trên Supabase.
   Mỗi bảng (positions, candidates, settings) có dạng: id text, data jsonb, updated_at, updated_by.
   Cung cấp API kiểu collection/doc để phần giao diện không phụ thuộc vào Supabase. */
function createStore(sb){
  const TABLES={positions:'positions',candidates:'candidates',settings:'settings'};
  const err=e=>{const c=e&&(e.code==='42501'||/row-level security|permission/i.test(e.message||''))?'invalid_argument':'unavailable';return {code:c,message:e&&e.message||String(e)}};
  const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
  const watchers={};          // table -> Set of callbacks
  const channels={};
  function watch(table,cb){
    (watchers[table]=watchers[table]||new Set()).add(cb);
    if(!channels[table]){
      let t=null;
      channels[table]=sb.channel('rt-'+table)
        .on('postgres_changes',{event:'*',schema:'public',table},()=>{clearTimeout(t);t=setTimeout(()=>watchers[table].forEach(f=>f()),150)})
        .subscribe();
    }
    return ()=>watchers[table].delete(cb);
  }
  async function fetchAll(table){
    const rows=[];let from=0;
    for(;;){const {data,error}=await sb.from(table).select('id,data').range(from,from+999);if(error)throw error;rows.push(...data);if(data.length<1000)break;from+=1000}
    return rows;
  }
  function docRef(table,id){
    return {
      id,
      async get(){const {data,error}=await sb.from(table).select('id,data').eq('id',id).maybeSingle();if(error)throw err(error);return {id,exists:!!data,data:()=>data?data.data:undefined,metadata:{fromCache:false}}},
      async set(d){const {error}=await sb.from(table).upsert({id,data:d});if(error)throw err(error)},
      async update(d){const {data,error}=await sb.from(table).select('data').eq('id',id).maybeSingle();if(error)throw err(error);if(!data)throw {code:'invalid_argument',message:'Không tìm thấy dữ liệu'};
        const {error:e2}=await sb.from(table).update({data:{...data.data,...d}}).eq('id',id);if(e2)throw err(e2)},
      async delete(){const {error}=await sb.from(table).delete().eq('id',id);if(error)throw err(error)},
      onSnapshot(next,onErr){const run=async()=>{try{next(await this.get())}catch(e){onErr&&onErr(e)}};run();return watch(table,run)}
    };
  }
  return {
    collection(name){const table=TABLES[name];return {
      doc:id=>docRef(table,id||uid()),
      onSnapshot(next,onErr){const run=async()=>{try{const rows=await fetchAll(table);const docs=rows.map(r=>({id:r.id,exists:true,data:()=>r.data}));next({docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false}})}catch(e){onErr&&onErr(err(e))}};run();return watch(table,run)}
    }},
    doc(path){const [c,id]=path.split('/');return docRef(TABLES[c],id)}
  };
}
