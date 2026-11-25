/* ===== Logic dùng chung (trang web + script nhập dữ liệu) ===== */
const STAGES=[
 {k:'loc',name:'HR sàng lọc CV',owner:'Nhân sự',days:2,todo:'Đọc CV, gọi sơ vấn, loại hồ sơ không phù hợp'},
 {k:'gui',name:'HR gửi hồ sơ cho Chuyên môn',owner:'Nhân sự',days:1,todo:'Gửi hồ sơ đạt sơ vấn kèm nhận xét cho Quản lý trực tiếp'},
 {k:'duyet',name:'Chuyên môn duyệt CV',owner:'Phòng chuyên môn',days:2,todo:'Chọn ứng viên vào phỏng vấn hoặc nêu rõ lý do loại'},
 {k:'pv',name:'Xếp lịch và phỏng vấn',owner:'Phòng chuyên môn',days:5,todo:'Chốt lịch và phỏng vấn chuyên môn'},
 {k:'kq',name:'Chuyên môn trả kết quả phỏng vấn',owner:'Phòng chuyên môn',days:1,todo:'Chấm phiếu đánh giá và gửi kết quả cho Nhân sự'},
 {k:'dx',name:'HR đề xuất offer',owner:'Nhân sự',days:2,todo:'Kiểm tra tham chiếu và trình mức lương trong dải'},
 {k:'ceo',name:'CEO duyệt offer',owner:'CEO',days:1,todo:'Duyệt offer cấp A7 trở lên hoặc vượt dải lương'},
 {k:'thu',name:'HR gửi thư mời',owner:'Nhân sự',days:1,todo:'Gửi thư mời nhận việc và chốt ngày nhận việc'},
 {k:'ph',name:'Ứng viên phản hồi thư mời',owner:'Ứng viên',days:3,todo:'Ứng viên xác nhận nhận việc hoặc từ chối'},
 {k:'cho',name:'Chờ ngày nhận việc',owner:'Ứng viên',days:30,todo:'Ứng viên bàn giao nơi cũ và nhận việc theo ngày đã chốt'},
 {k:'xong',name:'Đã nhận việc',owner:'Hoàn tất',days:0,todo:'Chuyển sang quy trình Onboarding'},
 {k:'dong',name:'Đã đóng hồ sơ',owner:'Hoàn tất',days:0,todo:'Hồ sơ trượt, ứng viên từ chối hoặc vị trí dừng tuyển'}];
/* Các mốc ngày của một hồ sơ, theo thứ tự cột trong Excel. next = khâu tiếp theo khi mốc này đã có ngày */
const DATES=[
 {k:'nhanCV',label:'Ngày nhận CV',col:3,next:'loc'},
 {k:'hrLoc',label:'HR phỏng vấn (sơ vấn)',col:4,next:'gui'},
 {k:'guiCM',label:'Gửi hồ sơ cho Chuyên môn',col:5,next:'duyet'},
 {k:'cmDuyet',label:'Chuyên môn duyệt CV',col:6,next:'pv'},
 {k:'pvCM',label:'Ngày phỏng vấn chuyên môn',col:7,next:'kq'},
 {k:'kqPV',label:'Ngày có kết quả phỏng vấn',col:8,next:'dx'},
 {k:'pvCEO',label:'Ngày phỏng vấn CEO',col:9,next:'dx'},
 {k:'deXuat',label:'Ngày đề xuất offer',col:10,next:'ceo'},
 {k:'duyetOffer',label:'Ngày duyệt offer',col:11,next:'thu'},
 {k:'guiThu',label:'Ngày gửi thư mời',col:12,next:'ph'},
 {k:'uvPhanHoi',label:'Ngày ứng viên phản hồi',col:13,next:'cho'},
 {k:'nhanViec',label:'Ngày nhận việc',col:15,next:'xong'}];
const SOURCES=['Website tuyển dụng','Nền tảng tuyển dụng','Giới thiệu nội bộ','Headhunt','Mạng xã hội','Ứng viên tự gửi','Nguồn khác'];
const RESULTS=['In progress','Offer accepted','Offer declined','Rejected','Withdrawn','Hiring stopped'];
const CLOSED=['Offer declined','Rejected','Withdrawn','Hiring stopped'];
const RES_MAP={'Đang xử lý':'In progress','Nhận offer':'Offer accepted','Từ chối offer':'Offer declined','Trượt':'Rejected','Dừng tuyển':'Hiring stopped','Ứng viên rút':'Withdrawn'};
const normRes=v=>RES_MAP[v]||v||'';
const REASONS=['Không đạt chuyên môn','Kinh nghiệm chưa phù hợp','Lương không phù hợp','Không liên lạc được','Ứng viên nhận việc nơi khác','Văn hoá, thái độ chưa phù hợp','Vị trí dừng tuyển','Khác'];
const PRIORITIES=['P0 Gấp','P1 Quan trọng','P2 Bình thường'];
const KHOI=['KHỐI THƯƠNG MẠI','KHỐI NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM','KHỐI CUNG ỨNG','NHÀ MÁY','KHỐI VẬN HÀNH','KHỐI TÀI CHÍNH','Tech'];

const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayISO=()=>isoOf(new Date());
const toDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
/* Đọc ngày từ Excel: số serial, Date hoặc chuỗi dd/mm/yyyy (chấp nhận . - lẫn lộn) */
function parseDate(v){
 if(v==null||v==='')return '';
 if(v instanceof Date&&!isNaN(v))return isoOf(v);
 if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*864e5));return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())}
 const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m)return m[1]+'-'+pad(m[2])+'-'+pad(m[3]);
 m=s.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
 if(m){const d=+m[1],mo=+m[2];if(d>=1&&d<=31&&mo>=1&&mo<=12)return m[3]+'-'+pad(mo)+'-'+pad(d)}
 return '';
}
/* NETWORKDAYS(a,b)-1: số ngày làm việc từ a đến b, bỏ thứ Bảy, Chủ nhật */
function workdays(a,b){
 if(!a||!b)return null;let s=toDate(a),e=toDate(b),sign=1;
 if(e<s){[s,e]=[e,s];sign=-1}
 let n=0;for(const d=new Date(s);d<=e;d.setDate(d.getDate()+1)){const w=d.getDay();if(w&&w<6)n++}
 return sign*(n-1);
}
const clean=v=>v==null?'':String(v).replace(/\s+/g,' ').trim();
const slaOf=(sla,k)=>{const s=STAGES.find(x=>x.k===k);return {...s,days:sla&&sla[k]!=null?+sla[k]:s.days}};

/* Tính khâu hiện tại, bên đang giữ, số ngày chờ, tình trạng cho một ứng viên */
function evalCand(c,sla,today){
 today=today||todayISO();const d=c.dates||{};
 let stage='loc',last='';
 for(const f of DATES){if(d[f.k]){stage=f.next;if(d[f.k]>last)last=d[f.k]}}
 if(stage==='xong'&&d.nhanViec>today)stage='cho';
 if(c.ketQua==='Offer accepted'&&['loc','gui','duyet','pv','kq','dx','ceo','thu','ph'].includes(stage)&&!Object.keys(d).length)stage='cho';
 if(CLOSED.includes(c.ketQua))stage='dong';
 const st=slaOf(sla,stage);const done=stage==='xong'||stage==='dong';
 let wait=null,status='';
 if(!done&&last){wait=Math.max(0,workdays(last<=today?last:today,today));status=wait>st.days?'Overdue':wait===st.days?'Due today':'On track'}
 const hired=!!d.nhanViec&&d.nhanViec<=today&&!CLOSED.includes(c.ketQua);
 return {stage,stageName:st.name,owner:done?'Hoàn tất':st.owner,wait,commit:done?null:st.days,status,hired,
  total:d.nhanCV?workdays(d.nhanCV,d.nhanViec&&d.nhanViec<=today?d.nhanViec:today):null,
  cvToOffer:d.nhanCV&&d.guiThu?workdays(d.nhanCV,d.guiThu):null};
}
/* Vị trí: số CV, đã phỏng vấn, đã gửi thư, đã nhận việc, số ngày mở, tình trạng */
function evalPos(p,cands,today){
 today=today||todayISO();const mine=cands.filter(c=>c.viTri===p.ten);
 const ok=mine.filter(c=>c.dates&&c.dates.nhanViec&&!CLOSED.includes(c.ketQua));
 const hired=ok.filter(c=>c.dates.nhanViec<=today).length,upcoming=ok.length-hired;
 const days=p.ngayMo?workdays(p.ngayMo,p.ngayDong&&p.ngayDong<today?p.ngayDong:today):null;
 const need=+p.canTuyen||0;
 let status=!p.ngayMo?'Not opened':need&&hired+upcoming>=need?'Filled':p.ngayDong&&p.ngayDong<=today?'Closed':days>30?'Delayed':'Open';
 return {cv:mine.length,pv:mine.filter(c=>c.dates&&c.dates.pvCM).length,thu:mine.filter(c=>c.dates&&c.dates.guiThu).length,hired,upcoming,days,status,need};
}
/* Đọc workbook (các sheet dạng mảng hàng) thành dữ liệu app */
function importBook(sheets){
 const find=(pred)=>Object.keys(sheets).find(n=>pred(n));
 const vtName=find(n=>/v[iị] tr[ií] đang tuy[eể]n/i.test(n)),cvName=find(n=>/tracking/i.test(n)),slaName=find(n=>/sla/i.test(n));
 const hdr=(rows,word)=>rows.findIndex(r=>r&&clean(r[0])===word);
 const positions=[],candidates=[],warnings=[];let sla=null;
 if(vtName){const rows=sheets[vtName],h=hdr(rows,'Vị trí tuyển dụng');
  for(const r of rows.slice(h+1)){const ten=clean(r[0]);if(!ten)continue;
   positions.push({ten,khoi:clean(r[1]),phong:clean(r[2]),cap:clean(r[3]),canTuyen:+r[4]||0,hm:clean(r[5]),lyDo:clean(r[6]),
    ngayMo:parseDate(r[7]),jd:!!clean(r[8]),ngayCanNhan:parseDate(r[9]),uuTien:clean(r[10]),ngayDong:parseDate(r[11]),ghiChu:clean(r[18])})}}
 if(cvName){const rows=sheets[cvName],h=hdr(rows,'Vị trí tuyển dụng');
  rows.slice(h+1).forEach((r,i)=>{const viTri=clean(r[0]),ten=clean(r[1]);if(!viTri&&!ten)return;const dates={};
   for(const f of DATES){const raw=r[f.col],v=parseDate(raw);if(v)dates[f.k]=v;else if(clean(raw))warnings.push(`Dòng ${h+i+2}: không đọc được "${clean(raw)}" ở cột ${f.label}`)}
   for(const [k,v] of Object.entries(dates))if(v<'2026-01-01')warnings.push(`Dòng ${h+i+2} (${ten||viTri}): ${DATES.find(f=>f.k===k).label} là ${v.split('-').reverse().join('/')}, có thể gõ nhầm năm`);
   candidates.push({viTri,ten,nguon:clean(r[2]),dates,ketQua:normRes(clean(r[14])),ghiChu:clean(r[23])})})}
 if(slaName){const rows=sheets[slaName];sla={};for(const r of rows){const nm=clean(r&&r[0]),s=STAGES.find(x=>x.name===nm||(x.k==='loc'&&/sàng lọc CV|phỏng vấn \(sơ vấn\)/.test(nm)));if(s&&r[2]!==''&&r[2]!=null)sla[s.k]=+r[2]}}
 const names=new Set(positions.map(p=>p.ten));
 const missing=[...new Set(candidates.map(c=>c.viTri).filter(n=>n&&!names.has(n)))];
 for(const ten of missing)positions.push({ten,khoi:'',phong:'',cap:'',canTuyen:0,hm:'',lyDo:'',ngayMo:'',jd:false,ngayCanNhan:'',uuTien:'',ngayDong:'',ghiChu:'Tự tạo khi nhập: có trong Tracking CV nhưng không có trong danh sách vị trí'});
 return {positions,candidates,sla,warnings,missing};
}
if(typeof module!=='undefined')module.exports={STAGES,DATES,normRes,importBook,evalCand,evalPos,parseDate,workdays};
/* Kiểm tra dữ liệu một hồ sơ: trả về danh sách cảnh báo */
const RANK={nhanCV:0,hrLoc:1,guiCM:2,cmDuyet:3,pvCM:4,kqPV:5,pvCEO:5,deXuat:6,duyetOffer:7,guiThu:8,uvPhanHoi:9,nhanViec:10};
function checkCand(c,all,today,P){
 today=today||todayISO();const d=c.dates||{},w=[],fd=s=>s.split('-').reverse().join('/');
 if(!clean(c.ten))w.push('Chưa có họ tên ứng viên');
 if(!clean(c.viTri))w.push('Chưa chọn vị trí');
 const set=DATES.filter(f=>d[f.k]);
 for(const f of set){const prev=set.filter(g=>RANK[g.k]<RANK[f.k]&&d[g.k]>d[f.k]);if(prev.length){const g=prev[prev.length-1];w.push(`${f.label} (${fd(d[f.k])}) đang trước ${g.label} (${fd(d[g.k])})`)}}
 const lim=isoOf(new Date(Date.now()+180*864e5));
 for(const f of set){if(d[f.k]<'2026-01-01')w.push(`${f.label} là ${fd(d[f.k])}, có thể gõ nhầm năm`);else if(f.k!=='nhanViec'&&d[f.k]>today)w.push(`${f.label} (${fd(d[f.k])}) là ngày trong tương lai`);else if(d[f.k]>lim)w.push(`${f.label} (${fd(d[f.k])}) xa hơn 6 tháng`)}
 const pos=P&&P.find(p=>p.ten===c.viTri);if(pos&&pos.ngayMo&&d.nhanViec&&d.nhanViec<pos.ngayMo)w.push(`Ngày nhận việc (${fd(d.nhanViec)}) trước ngày mở tuyển vị trí (${fd(pos.ngayMo)})`);
 if(clean(c.ten)&&all){const dup=all.filter(x=>x!==c&&x.id!==c.id&&clean(x.ten).toLowerCase()===clean(c.ten).toLowerCase()&&x.viTri===c.viTri);if(dup.length)w.push('Trùng họ tên với một hồ sơ khác cùng vị trí')}
 return w;
}
/* Tiến độ theo tháng: ym = 'YYYY-MM' */
function monthStats(ym,P,C,today){
 today=today||todayISO();const [y,m]=ym.split('-').map(Number);const start=ym+'-01',end=isoOf(new Date(y,m,0));
 const inM=v=>v&&v>=start&&v<=end&&v<=today;const has=k=>C.filter(c=>c.dates&&inM(c.dates[k])).length;
 const open=P.filter(p=>p.ngayMo&&p.ngayMo<=end&&(!p.ngayDong||p.ngayDong>=start));
 const names=new Set(open.map(p=>p.ten));const need=open.reduce((s,p)=>s+(+p.canTuyen||0),0);
 const cut=end<today?end:today;
 const hiredCum=C.filter(c=>names.has(c.viTri)&&c.dates&&c.dates.nhanViec&&c.dates.nhanViec<=cut&&!CLOSED.includes(c.ketQua)).length;
 return {opened:P.filter(p=>inM(p.ngayMo)).reduce((s,p)=>s+(+p.canTuyen||0),0),need,cv:has('nhanCV'),hrpv:has('hrLoc'),pv:has('pvCM'),thu:has('guiThu'),hired:has('nhanViec'),hiredCum,fill:need?Math.min(1,hiredCum/need):null};
}
if(typeof module!=='undefined')Object.assign(module.exports,{checkCand,monthStats});
