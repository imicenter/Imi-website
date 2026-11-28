const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty={identity:'Identity & documents',health:'Health & emergency',education:'Education & skills',welfare:'Welfare & support',community:'Community services'};
const col=sevaDb.collection('services');
const form=$('#serviceForm'),table=$('#serviceTable');let editorOpen=false;
const dialog={showModal(){editorOpen=true;location.hash='#editor';},close(){editorOpen=false;location.hash='#services';}};
const FIELDS=[['serviceName','name'],['serviceHindi','hi'],['serviceCategory','category'],['serviceState','state'],['serviceDesc','desc'],['serviceHindiDesc','hiDesc'],['serviceLongDesc','longDesc'],['serviceLongDescHi','longDescHi'],['serviceDocuments','documents'],['serviceDocumentsHi','documentsHi'],['serviceUrl','url'],['serviceImage','image'],['serviceType','type'],['serviceStatus','status'],['servicePrice','price'],['serviceOfferPrice','offerPrice'],['serviceCoupon','coupon'],['serviceCouponDiscount','couponDiscount'],['serviceDiscovery','discovery'],['serviceViews','views']];
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
  if(b.dataset.link){const s=services.find(x=>x.id===b.dataset.link);const url=location.origin+location.pathname.replace('dashboard.html','')+'service.html?id='+encodeURIComponent(s.id);navigator.clipboard?.writeText(url).then(()=>toast('Link copied'),()=>prompt('Copy link:',url));}
  if(b.dataset.del){const s=services.find(x=>x.id===b.dataset.del);if(confirm('Delete “'+s.name+'” permanently?'))col.doc(s.id).delete().then(()=>toast('Deleted')).catch(x=>alert('Delete failed: '+x.code));}
});
function openEdit(id){
  const s=id?services.find(x=>x.id===id):{status:'Published',type:'GOVERNMENT'};
  $('#dialogTitle').textContent=id?'Edit service':'Add a service';$('#editId').value=id||'';
  FIELDS.forEach(([el,key])=>{$('#'+el).value=s[key]??'';});RTE.load($('#serviceLongDesc').value);dialog.showModal();
}
$('#addService').onclick=()=>openEdit(null);
$('#tableSearch').addEventListener('input',render);$('#statusFilter').addEventListener('change',render);
form.addEventListener('submit',async e=>{
  if(e.submitter?.value==='cancel')return;
  e.preventDefault();
  const num=id=>Number($('#'+id).value)||0;
  const obj={name:$('#serviceName').value.trim(),hi:$('#serviceHindi').value.trim(),category:$('#serviceCategory').value,state:$('#serviceState').value,desc:$('#serviceDesc').value.trim(),hiDesc:$('#serviceHindiDesc').value.trim(),longDesc:$('#serviceLongDesc').value,longDescHi:$('#serviceLongDescHi').value,documents:$('#serviceDocuments').value,documentsHi:$('#serviceDocumentsHi').value,url:$('#serviceUrl').value.trim(),image:$('#serviceImage').value.trim(),type:$('#serviceType').value,status:$('#serviceStatus').value,price:num('servicePrice'),offerPrice:num('serviceOfferPrice'),coupon:$('#serviceCoupon').value.trim().toUpperCase(),couponDiscount:num('serviceCouponDiscount'),discovery:$('#serviceDiscovery').value,views:num('serviceViews'),updatedAt:new Date().toISOString()};
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

/* ================= ORDER BOOK ================= */
const ocol=sevaDb.collection('orders');
const oTable=$('#orderTable'),oDlg=$('#orderDialog');
const STATUSES=['New','In progress','Completed','Cancelled'];
const sKey=s=>String(s||'New').toLowerCase().replace(/\s+/g,'');
let orders=[],firstOrderLoad=true,openOrderId=null;
const rupee=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const fmtDT=d=>d?new Date(d).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'–';
const waNum=m=>'91'+String(m||'').replace(/\D/g,'').slice(-10);

ocol.onSnapshot(snap=>{
  if(!firstOrderLoad)snap.docChanges().forEach(c=>{if(c.type==='added')toast('New order: '+(c.doc.data().name||'')+' · '+(c.doc.data().serviceName||''));});
  firstOrderLoad=false;
  orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  renderOrders();
  if(openOrderId&&oDlg.open){const o=orders.find(x=>x.id===openOrderId);if(!o)oDlg.close();}
},err=>{oTable.innerHTML='<tr><td colspan="6">Could not load orders: '+esc(err.code||err.message)+'. Add the “orders” rules in Firestore (see firestore.rules).</td></tr>';});

function renderOrders(){
  const q=$('#orderSearch').value.trim().toLowerCase(),f=$('#orderStatusFilter').value;
  const nNew=orders.filter(o=>(o.status||'New')==='New').length;
  $('#mNewOrders').textContent=nNew;$('#mOrders').textContent=orders.length;
  const b=$('#newBadge');b.textContent=nNew;b.hidden=!nNew;
  const list=orders.filter(o=>(f==='all'||(o.status||'New')===f)&&`${o.orderNo} ${o.name} ${o.mobile} ${o.serviceName} ${o.serviceHi||''}`.toLowerCase().includes(q));
  oTable.innerHTML=list.map(o=>{
    const st=o.status||'New';
    const sel=`<select class="st-select s-${sKey(st)}" data-st="${esc(o.id)}">${STATUSES.map(x=>`<option${x===st?' selected':''}>${x}</option>`).join('')}</select>`;
    const amt=o.total>0?rupee(o.total)+(o.paymentStatus==='Paid'?' <small>Paid</small>':''):'<small>At centre</small>';
    return `<tr class="${st==='New'?'is-new':''}"><td><strong>${esc(o.orderNo)}</strong><small>${esc(fmtDT(o.createdAt))}</small></td><td><strong>${esc(o.name)}</strong><small><a class="tel" href="tel:+${waNum(o.mobile)}">${esc(o.mobile)}</a></small></td><td>${esc(o.serviceName)}${o.coupon?`<small>Coupon: ${esc(o.coupon)}</small>`:''}</td><td>${amt}</td><td>${sel}</td><td class="row-actions"><button class="edit" data-view="${esc(o.id)}">View</button></td></tr>`;
  }).join('')||'<tr><td colspan="6">No orders yet. They will appear here when customers order from the site.</td></tr>';
  $('#recentOrders').innerHTML=orders.slice(0,5).map(o=>`<button type="button" class="recent-row" data-view="${esc(o.id)}"><span><strong>${esc(o.name)}</strong><small>${esc(o.serviceName)}</small></span><span class="status ${sKey(o.status)}">${esc(o.status||'New')}</span><small>${esc(fmtDT(o.createdAt))}</small></button>`).join('')||'<p class="empty">No orders yet.</p>';
}

oTable.addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)openOrder(b.dataset.view);});
oTable.addEventListener('change',e=>{
  const s=e.target.closest('select[data-st]');if(!s)return;
  ocol.doc(s.dataset.st).update({status:s.value,updatedAt:new Date().toISOString()}).then(()=>toast('Status: '+s.value)).catch(x=>{alert('Could not update: '+(x.code||x.message));renderOrders();});
});
$('#orderSearch').addEventListener('input',renderOrders);$('#orderStatusFilter').addEventListener('change',renderOrders);

function openOrder(id){
  const o=orders.find(x=>x.id===id);if(!o)return;openOrderId=id;
  $('#oNo').textContent=o.orderNo||id;$('#oName').textContent=o.name||'–';$('#oMobile').textContent=o.mobile||'–';
  $('#oAddr').textContent=o.address||'–';$('#oService').textContent=o.serviceName+(o.serviceHi?' ('+o.serviceHi+')':'');
  $('#oAmount').textContent=o.total>0?rupee(o.total)+(o.coupon?' · coupon '+o.coupon:''):'Fee at centre';
  $('#oNote').textContent=o.note||'–';$('#oDate').textContent=fmtDT(o.createdAt);$('#oMethod').textContent=o.paymentMethod||'–';
  $('#oStatus').value=o.status||'New';$('#oPay').value=o.paymentStatus||'Pending';$('#oAdminNote').value=o.adminNote||'';
  $('#oCall').href='tel:+'+waNum(o.mobile);
  $('#oWa').href='https://wa.me/'+waNum(o.mobile)+'?text='+encodeURIComponent('नमस्ते '+(o.name||'')+', IMI Center से। आपका ऑर्डर '+o.orderNo+' ('+o.serviceName+') मिल गया है। ');
  oDlg.showModal();
}
$('#oClose').onclick=()=>oDlg.close();
$('#oSave').onclick=async()=>{
  const btn=$('#oSave');btn.disabled=true;
  try{await ocol.doc(openOrderId).update({status:$('#oStatus').value,paymentStatus:$('#oPay').value,adminNote:$('#oAdminNote').value.trim(),updatedAt:new Date().toISOString()});oDlg.close();toast('Order updated');}
  catch(x){alert('Could not save: '+(x.code||x.message));}
  btn.disabled=false;
};
$('#oDelete').onclick=()=>{
  const o=orders.find(x=>x.id===openOrderId);if(!o)return;
  if(confirm('Delete order '+o.orderNo+' permanently?'))ocol.doc(o.id).delete().then(()=>{oDlg.close();toast('Order deleted');}).catch(x=>alert('Delete failed: '+(x.code||x.message)));
};
$('#exportOrders').onclick=()=>{
  const cols=['orderNo','createdAt','name','mobile','address','serviceName','price','coupon','total','status','paymentStatus','paymentMethod','note','adminNote'];
  const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const csv='\ufeff'+[cols.join(',')].concat(orders.map(o=>cols.map(c=>cell(o[c])).join(','))).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='imi-center-orders.csv';a.click();URL.revokeObjectURL(a.href);
};


/* ================= PAGES (sidebar tabs) ================= */
const VIEWS=['overview','orders','services','editor'];
function route(){
  let v=(location.hash||'#overview').slice(1);if(!VIEWS.includes(v))v='overview';
  if(v==='editor'&&!editorOpen){location.hash='#services';return;}
  document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!=='v-'+v);
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(v==='editor'?'services':v)));
  window.scrollTo(0,0);
}
addEventListener('hashchange',route);
$('#addService2').onclick=()=>openEdit(null);
$('#cancelEdit').onclick=()=>dialog.close();
$('#recentOrders').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)openOrder(b.dataset.view);});

/* ================= RICH TEXT EDITOR (saves in the site's simple text format) ================= */
const RTE=(()=>{
  const ed=$('#rte'),ta=$('#serviceLongDesc');
  try{document.execCommand('defaultParagraphSeparator',false,'p');}catch{}
  const il=s=>esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>');
  function toHtml(md){
    const out=[];let list='';const close=()=>{if(list){out.push('</'+list+'>');list='';}};
    String(md||'').split(/\r?\n/).forEach(v=>{
      const l=v.trim();let m;
      if(!l){close();return;}
      if(m=l.match(/^#{1,2} (.*)/)){close();out.push('<h2>'+il(m[1])+'</h2>');}
      else if(m=l.match(/^[-•] (.*)/)){if(list!=='ul'){close();out.push('<ul>');list='ul';}out.push('<li>'+il(m[1])+'</li>');}
      else if(m=l.match(/^\d+[.)] (.*)/)){if(list!=='ol'){close();out.push('<ol>');list='ol';}out.push('<li>'+il(m[1])+'</li>');}
      else if(m=l.match(/^> (.*)/)){close();out.push('<blockquote>'+il(m[1])+'</blockquote>');}
      else{close();out.push('<p>'+il(l)+'</p>');}
    });
    close();return out.join('');
  }
  const inl=n=>{
    if(n.nodeType===3)return n.textContent.replace(/\u00a0/g,' ');
    if(n.nodeType!==1)return '';
    const t=[...n.childNodes].map(inl).join('');
    switch(n.tagName){
      case 'B':case 'STRONG':return t.trim()?'**'+t.trim()+'** ':t;
      case 'I':case 'EM':return t.trim()?'*'+t.trim()+'* ':t;
      case 'A':{const h=n.getAttribute('href')||'';return /^https?:\/\//.test(h)?'['+t+']('+h+')':t;}
      case 'BR':return ' ';
      default:return t;
    }
  };
  const one=n=>inl(n).replace(/\s*\n\s*/g,' ').replace(/\s{2,}/g,' ').trim();
  function toMd(){
    const out=[];
    [...ed.childNodes].forEach(n=>{
      if(n.nodeType===3){const t=n.textContent.trim();if(t)out.push(t);return;}
      const tag=n.tagName;
      if(/^H[1-6]$/.test(tag)){const t=one(n);if(t)out.push('# '+t);}
      else if(tag==='UL'||tag==='OL'){const items=[...n.children].map(one).filter(Boolean).map((t,i)=>(tag==='UL'?'- ':(i+1)+'. ')+t);if(items.length)out.push(items.join('\n'));}
      else if(tag==='BLOCKQUOTE'){const t=one(n);if(t)out.push('> '+t);}
      else{const t=one(n);if(t)out.push(t);}
    });
    return out.join('\n\n');
  }
  const sync=()=>{ta.value=toMd();};
  const cmd=(c,v)=>{ed.focus();document.execCommand(c,false,v);sync();};
  const block=t=>cmd('formatBlock',document.queryCommandValue('formatBlock').toLowerCase()===t?'p':t);
  const tools=$('#rteTools');
  tools.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
  tools.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;const a=b.dataset.cmd;
    if(a==='h')block('h2');
    else if(a==='q')block('blockquote');
    else if(a==='clear'){cmd('removeFormat');cmd('formatBlock','p');}
    else if(a==='link'){
      const sel=getSelection();if(!sel.rangeCount||!sel.toString()){toast('Select some text first, then click Link');return;}
      const r=sel.getRangeAt(0).cloneRange();const u=(prompt('Paste the link (starts with https://)')||'').trim();
      if(!u)return;if(!/^https?:\/\//.test(u)){toast('Link must start with https://');return;}
      sel.removeAllRanges();sel.addRange(r);cmd('createLink',u);
    }
    else cmd(a);
  });
  ed.addEventListener('input',sync);
  ed.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain'));});
  return{load(md){ed.innerHTML=toHtml(md);ta.value=md||'';}};
})();

/* ================= JSON IMPORT ================= */
const IMP_CATS=[...$('#serviceCategory').options].map(o=>o.value);
const IMP_STATES=[...$('#serviceState').options].map(o=>o.value);
const impDlg=$('#importDialog'),impText=$('#impText'),impMsg=$('#impMsg');
const impSay=(m,c)=>{impMsg.textContent=m;impMsg.className='imp-msg '+(c||'');};
const impLines=v=>Array.isArray(v)?v.map(x=>String(x).replace(/^[-•]\s*/,'').trim()).filter(Boolean).join('\n'):String(v??'').trim();
const impText2=v=>Array.isArray(v)?v.join('\n'):String(v??'');

/* one JSON object -> the same shape the form saves. Only keys present in the JSON are returned. */
function impNormalize(raw){
  const o={},w=[];
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return{o,w,err:'Each service must be a JSON object { ... }.'};
  const has=k=>raw[k]!==undefined&&raw[k]!==null&&raw[k]!=='';
  ['name','hi','desc','hiDesc','url','image','discovery'].forEach(k=>{if(has(k))o[k]=String(raw[k]).trim();});
  ['longDesc','longDescHi'].forEach(k=>{if(has(k))o[k]=impText2(raw[k]).trim();});
  ['documents','documentsHi'].forEach(k=>{if(has(k))o[k]=impLines(raw[k]);});
  ['price','offerPrice','couponDiscount','views'].forEach(k=>{if(has(k)){const n=Number(raw[k]);if(Number.isFinite(n)&&n>=0)o[k]=n;else w.push(k+' must be a number');}});
  if(has('coupon'))o.coupon=String(raw.coupon).trim().toUpperCase();
  if(has('category')){const c=String(raw.category).toLowerCase().trim();if(IMP_CATS.includes(c))o.category=c;else w.push('category "'+raw.category+'" not valid (use '+IMP_CATS.join(', ')+')');}
  if(has('state')){const st=IMP_STATES.find(x=>x.toLowerCase()===String(raw.state).toLowerCase().trim());if(st)o.state=st;else w.push('state "'+raw.state+'" is not in the Coverage list');}
  if(has('type')){const t=String(raw.type).toUpperCase().trim();if(['GOVERNMENT','COMMUNITY'].includes(t))o.type=t;else w.push('type must be GOVERNMENT or COMMUNITY');}
  if(has('status')){const t=String(raw.status).toLowerCase().trim();if(t==='published')o.status='Published';else if(t==='draft')o.status='Draft';else w.push('status must be Published or Draft');}
  if(o.url&&!/^https?:\/\//.test(o.url)){w.push('url must start with https://');delete o.url;}
  if(o.image&&!/^https?:\/\//.test(o.image)){w.push('image must start with https://');delete o.image;}
  if(o.discovery&&!['popular','trending','new'].includes(o.discovery)){w.push('discovery must be popular, trending or new');delete o.discovery;}
  if(o.offerPrice&&o.price&&o.offerPrice>=o.price)w.push('offerPrice should be lower than price');
  if(!o.name)return{o,w,err:'"name" is required.'};
  ['hi','desc','hiDesc'].forEach(k=>{if(!o[k])w.push('"'+k+'" is empty (the form needs it before saving)');});
  return{o,w};
}
function impParse(txt){
  txt=txt.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  if(!txt)throw new Error('Paste some JSON first.');
  let j;try{j=JSON.parse(txt);}catch(e){throw new Error('This is not valid JSON: '+e.message);}
  if(j&&!Array.isArray(j)&&Array.isArray(j.services))j=j.services;
  return j;
}
function impOpen(){impText.value='';$('#impFile').value='';impSay('');impDlg.showModal();}
function impFill(o){
  /* fill the editor with the imported values; untouched fields keep their current value */
  if(!editorOpen||location.hash!=='#editor'){openEdit(null);}
  const sameId=slug(o.name);
  if(!$('#editId').value&&services.some(s=>s.id===sameId)){
    const cur=services.find(s=>s.id===sameId);
    FIELDS.forEach(([el,key])=>{$('#'+el).value=cur[key]??'';});
    $('#editId').value=sameId;$('#dialogTitle').textContent='Edit service';
    toast('A service with this name exists — updating it');
  }
  FIELDS.forEach(([el,key])=>{if(o[key]!==undefined)$('#'+el).value=o[key];});
  RTE.load($('#serviceLongDesc').value);
}
async function impRun(){
  let j;try{j=impParse(impText.value);}catch(e){impSay(e.message,'err');return;}
  const list=Array.isArray(j)?j:[j];
  if(!list.length){impSay('The list is empty.','err');return;}
  const res=list.map((x,i)=>({i,...impNormalize(x)}));
  const bad=res.filter(r=>r.err);
  if(bad.length){impSay(bad.map(r=>'Item '+(r.i+1)+': '+r.err).join('\n'),'err');return;}
  if(!Array.isArray(j)){
    impFill(res[0].o);impDlg.close();
    toast(res[0].w.length?'Form filled — check: '+res[0].w.join('; '):'Form filled — review and press Save');
    return;
  }
  const ids=res.map(r=>slug(r.o.name)),dupInFile=ids.find((x,i)=>ids.indexOf(x)!==i);
  if(dupInFile){impSay('Two services in the list have the same name ("'+dupInFile+'").','err');return;}
  const upd=ids.filter(id=>services.some(s=>s.id===id)).length;
  const warn=res.filter(r=>r.w.length).map(r=>'• '+r.o.name+': '+r.w.join('; ')).join('\n');
  if(!confirm('Save '+res.length+' services ('+(res.length-upd)+' new, '+upd+' will be updated)?\nNew ones without a status are saved as Draft.'+(warn?'\n\nCheck:\n'+warn:'')))return;
  const btn=$('#impGo');btn.disabled=true;impSay('Saving…');
  try{
    for(let k=0;k<res.length;k+=400){
      const b=sevaDb.batch();
      res.slice(k,k+400).forEach((r,n)=>{const id=ids[k+n];const isNew=!services.some(s=>s.id===id);b.set(col.doc(id),{...(isNew?{status:'Draft',type:'GOVERNMENT',category:'identity',state:'All India'}:{}),...r.o,id,updatedAt:new Date().toISOString()},{merge:true});});
      await b.commit();
    }
    impDlg.close();toast(res.length+' services saved');location.hash='#services';
  }catch(e){impSay('Could not save: '+(e.code||e.message)+'\nCheck that you are logged in and Firestore rules allow admin writes.','err');}
  btn.disabled=false;
}
$('#importJson').onclick=impOpen;$('#importJson2').onclick=impOpen;
$('#impClose').onclick=$('#impCancel').onclick=()=>impDlg.close();
$('#impGo').onclick=impRun;
$('#impFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{impText.value=String(r.result||'');impSay('File loaded — press Import.','ok');};r.readAsText(f);});
route();
