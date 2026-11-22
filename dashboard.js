const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty={identity:'Identity & documents',health:'Health & emergency',education:'Education & skills',welfare:'Welfare & support',community:'Community services'};
const col=sevaDb.collection('services');
const dialog=$('#serviceDialog'),form=$('#serviceForm'),table=$('#serviceTable');
const FIELDS=[['serviceName','name'],['serviceHindi','hi'],['serviceCategory','category'],['serviceState','state'],['serviceDesc','desc'],['serviceHindiDesc','hiDesc'],['serviceLongDesc','longDesc'],['serviceDocuments','documents'],['serviceUrl','url'],['serviceImage','image'],['serviceType','type'],['serviceStatus','status'],['servicePrice','price'],['serviceOfferPrice','offerPrice'],['serviceCoupon','coupon'],['serviceCouponDiscount','couponDiscount'],['serviceDiscovery','discovery'],['serviceViews','views']];
let services=[];
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
const slug=n=>n.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'service-'+Date.now();
const fmt=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'–';

col.onSnapshot(snap=>{services=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));render();},err=>{table.innerHTML='<tr><td colspan="6">Could not load services: '+esc(err.code||err.message)+'. Check Firestore rules.</td></tr>';});
sevaDb.collection('siteStats').doc('summary').get().then(s=>{$('#visitorCount').textContent=(s.data()?.visitors||0).toLocaleString('en-IN');}).catch(()=>{$('#visitorCount').textContent='–';});

function render(){
  const q=$('#tableSearch').value.toLowerCase(),f=$('#statusFilter').value;
  $('#mTotal').textContent=services.length;$('#mPub').textContent=services.filter(s=>s.status==='Published').length;$('#mDraft').textContent=services.filter(s=>s.status!=='Published').length;
  const list=services.filter(s=>(f==='all'||s.status===f)&&`${s.name} ${s.hi} ${s.state}`.toLowerCase().includes(q));
  table.innerHTML=list.map(s=>{const st=s.status==='Published'?'Published':'Draft';const price=s.offerPrice&&s.offerPrice<s.price?s.offerPrice:s.price;return `<tr><td><strong>${esc(s.name)}</strong><small>${esc(s.hi)}</small></td><td>${esc(pretty[s.category]||s.category)}</td><td>${price?'₹'+esc(price):'–'}</td><td>${fmt(s.updatedAt)}</td><td><span class="status ${st.toLowerCase()}">${st}</span></td><td class="row-actions"><button class="edit" data-edit="${esc(s.id)}">Edit</button><button class="edit" data-link="${esc(s.id)}">Link</button><button class="edit danger" data-del="${esc(s.id)}">Delete</button></td></tr>`;}).join('')||'<tr><td colspan="6">No services yet. Click “Add service”.</td></tr>';
}
table.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.edit)openEdit(b.dataset.edit);
  if(b.dataset.link){const s=services.find(x=>x.id===b.dataset.link);const url=location.origin+location.pathname.replace('dashboard.html','')+'service.html?name='+encodeURIComponent(s.name);navigator.clipboard?.writeText(url).then(()=>toast('Link copied'),()=>prompt('Copy link:',url));}
  if(b.dataset.del){const s=services.find(x=>x.id===b.dataset.del);if(confirm('Delete “'+s.name+'” permanently?'))col.doc(s.id).delete().then(()=>toast('Deleted')).catch(x=>alert('Delete failed: '+x.code));}
});
function openEdit(id){
  const s=id?services.find(x=>x.id===id):{status:'Published',type:'GOVERNMENT'};
  $('#dialogTitle').textContent=id?'Edit service':'Add a service';$('#editId').value=id||'';
  FIELDS.forEach(([el,key])=>{$('#'+el).value=s[key]??'';});dialog.showModal();
}
$('#addService').onclick=()=>openEdit(null);
$('#tableSearch').addEventListener('input',render);$('#statusFilter').addEventListener('change',render);
form.addEventListener('submit',async e=>{
  if(e.submitter?.value==='cancel')return;
  e.preventDefault();
  const num=id=>Number($('#'+id).value)||0;
  const obj={name:$('#serviceName').value.trim(),hi:$('#serviceHindi').value.trim(),category:$('#serviceCategory').value,state:$('#serviceState').value,desc:$('#serviceDesc').value.trim(),hiDesc:$('#serviceHindiDesc').value.trim(),longDesc:$('#serviceLongDesc').value,documents:$('#serviceDocuments').value,url:$('#serviceUrl').value.trim(),image:$('#serviceImage').value.trim(),type:$('#serviceType').value,status:$('#serviceStatus').value,price:num('servicePrice'),offerPrice:num('serviceOfferPrice'),coupon:$('#serviceCoupon').value.trim().toUpperCase(),couponDiscount:num('serviceCouponDiscount'),discovery:$('#serviceDiscovery').value,views:num('serviceViews'),updatedAt:new Date().toISOString()};
  let id=$('#editId').value;
  if(!id){id=slug(obj.name);if(services.some(s=>s.id===id))id+='-'+Date.now();}
  const btn=$('#saveService');btn.disabled=true;btn.textContent='Saving…';
  try{await col.doc(id).set({...obj,id},{merge:true});dialog.close();toast('Saved');}
  catch(err){alert('Could not save: '+(err.code||err.message)+'\nCheck that you are logged in and Firestore rules allow admin writes.');}
  btn.disabled=false;btn.textContent='Save service';
});
$('#downloadData').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(services,null,2)],{type:'application/json'}));a.download='imi-center-services.json';a.click();URL.revokeObjectURL(a.href);};
const out=()=>firebase.auth().signOut().then(()=>location.reload());
$('#signOut').onclick=out;$('#signOutMobile').onclick=out;
