(function(){
const $=s=>document.querySelector(s);
const SITE=window.IMI_SITE||{};
const KEY='sevaSetuServices';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT={identity:['पहचान व दस्तावेज़','IDENTITY & DOCUMENTS'],health:['स्वास्थ्य व आपातकाल','HEALTH & EMERGENCY'],education:['शिक्षा व कौशल','EDUCATION & SKILLS'],welfare:['कल्याण व सहायता','WELFARE & SUPPORT'],community:['सामुदायिक सेवाएँ','COMMUNITY SERVICES']};
const T={
hi:{loading:'लोड हो रहा है…',services:'सेवाएँ',help:'मदद',back:'← सेवाओं पर वापस जाएँ',email:'ईमेल',copy:'लिंक कॉपी करें',copied:'लिंक कॉपी हो गया!',getTitle:'यह सेवा पाएँ',apply:'लागू करें',total:'कुल राशि',askWa:'WhatsApp पर पूछें',call:'कॉल करें',
 payNote:'अभी भुगतान केंद्र पर होगा। ऑनलाइन भुगतान जल्द शुरू होगा।',about:'इस सेवा के बारे में',docs:'ज़रूरी दस्तावेज़',know:'ध्यान रखें',k1:'आवेदन से पहले पात्रता और ज़रूरी दस्तावेज़ जाँच लें।',k2:'जहाँ आधिकारिक लिंक दिया हो, वहीं की जानकारी को सही मानें।',k3:'किसी को भी अपना OTP, पासवर्ड या खाते की जानकारी न बताएँ।',
 officialT:'आधिकारिक स्रोत',officialP:'सबसे नई पात्रता, शुल्क और दस्तावेज़ की जानकारी के लिए आधिकारिक वेबसाइट देखें।',officialBtn:'वेबसाइट खोलें ↗',info:'सेवा जानकारी',coverage:'लागू क्षेत्र',type:'प्रकार',footer:'सार्वजनिक सेवाएँ, अब और आसान।',
 gov:'सरकारी',pvt:'गैर-सरकारी',india:'पूरा भारत',orderPrice:'अभी ऑर्डर करें',orderFree:'यह सेवा माँगें',feeAtCentre:'शुल्क केंद्र पर बताया जाएगा',fee:'सेवा शुल्क',
 couponOk:p=>`कूपन लगा: ${p}% छूट`,couponBad:'कूपन कोड सही नहीं है',couponEmpty:'कूपन कोड लिखें',srcGov:'आधिकारिक सेवा जानकारी',
 nfT:'यह सेवा नहीं मिली',nfP:'हो सकता है यह सेवा हटा दी गई हो या अभी उपलब्ध न हो। आप सीधे हमसे पूछ सकते हैं।',nfBtn:'WhatsApp पर पूछें',waAsk:'नमस्ते, मुझे इस सेवा की जानकारी चाहिए: ',share:'इस सेवा की जानकारी देखें: '},
en:{loading:'Loading…',services:'Services',help:'Help',back:'← Back to services',email:'Email',copy:'Copy link',copied:'Link copied!',getTitle:'Get this service',apply:'Apply',total:'Total payable',askWa:'Ask on WhatsApp',call:'Call us',
 payNote:'Pay at the centre for now. Online payment is coming soon.',about:'About this service',docs:'Required documents',know:'What you should know',k1:'Review eligibility and required documents before applying.',k2:'Use the official source wherever an official link is provided.',k3:'Never share OTPs, passwords or sensitive account details.',
 officialT:'Official source',officialP:'Check the official website for the latest eligibility, fee and document requirements.',officialBtn:'Open website ↗',info:'SERVICE INFORMATION',coverage:'Coverage',type:'Type',footer:'Public services, made simpler.',
 gov:'Government',pvt:'Non-government',india:'All India',orderPrice:'Order now',orderFree:'Request this service',feeAtCentre:'Fee will be told at the centre',fee:'Service fee',
 couponOk:p=>`Coupon applied: ${p}% off`,couponBad:'Invalid coupon code',couponEmpty:'Enter a coupon code',srcGov:'Official service information',
 nfT:'Service not found',nfP:'This service may have been removed or is not available right now. You can ask us directly.',nfBtn:'Ask on WhatsApp',waAsk:'Hello, I need information about this service: ',share:'See this service: '}
};
let lang=localStorage.getItem('imiLang')==='en'?'en':'hi';
const t=k=>T[lang][k];
let svc=null,total=0,base=0,coupon='';
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const wa=text=>`https://wa.me/${SITE.whatsapp||''}?text=${encodeURIComponent(text)}`;

/* ---- one rich-text renderer: # heading, ## sub, - bullets, [text](url), bare urls, "Heading:" lines ---- */
function inline(raw){
  const keep=[];const hold=h=>{keep.push(h);return '\u0000'+(keep.length-1)+'\u0000';};
  let s=esc(raw);
  s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,(m,a,u)=>hold(`<a href="${u}" target="_blank" rel="noopener">${a} ↗</a>`));
  s=s.replace(/(https?:\/\/[^\s<]+)/g,u=>hold(`<a href="${u}" target="_blank" rel="noopener">${u} ↗</a>`));
  s=s.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>');
  return s.replace(/\u0000(\d+)\u0000/g,(m,i)=>keep[i]);
}
function rich(text){
  const out=[];let para=[],list=[],lt='ul';
  const fp=()=>{if(para.length){out.push(`<p>${para.join(' ')}</p>`);para=[];}};
  const fl=()=>{if(list.length){out.push(`<${lt}>${list.join('')}</${lt}>`);list=[];}};
  String(text||'').split(/\r?\n/).forEach(v=>{
    const line=v.trim();
    if(!line){fp();fl();return;}
    if(line.startsWith('## ')){fp();fl();out.push(`<h3>${inline(line.slice(3))}</h3>`);}
    else if(line.startsWith('# ')){fp();fl();out.push(`<h3>${inline(line.slice(2))}</h3>`);}
    else if(/^[-•] /.test(line)){fp();if(lt!=='ul')fl();lt='ul';list.push(`<li>${inline(line.replace(/^[-•] /,''))}</li>`);}
    else if(/^\d+[.)] /.test(line)){fp();if(lt!=='ol')fl();lt='ol';list.push(`<li>${inline(line.replace(/^\d+[.)] /,''))}</li>`);}
    else if(line.startsWith('> ')){fp();fl();out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);}
    else if(/:$/.test(line)&&line.length<65){fp();fl();out.push(`<h3>${inline(line.slice(0,-1))}</h3>`);}
    else{fl();para.push(inline(line));}
  });
  fp();fl();return out.join('');
}

/* ---- load: Firestore first (always fresh), cached copy only as offline fallback ---- */
function cached(id,name){
  try{return JSON.parse(localStorage.getItem(KEY)||'[]').find(s=>(id&&s.id===id)||(!id&&name&&s.name===name))||null;}catch{return null;}
}
async function load(){
  const p=new URLSearchParams(location.search),id=p.get('id'),name=p.get('name');
  let s=null;
  try{
    const col=window.sevaDb.collection('services');
    if(id){const d=await col.doc(id).get();if(d.exists)s={id:d.id,...d.data()};}
    if(!s&&name){const q=await col.where('status','==','Published').where('name','==',name).limit(1).get();if(!q.empty)s={id:q.docs[0].id,...q.docs[0].data()};}
  }catch(e){console.warn('Service load failed',e);s=cached(id,name);}
  if(!s&&!window.sevaDb)s=cached(id,name);
  if(s&&s.status==='Draft')s=null;
  return s;
}

function notFound(){
  $('#state').innerHTML=`<h2>${esc(t('nfT'))}</h2><p>${esc(t('nfP'))}</p><a class="primary" target="_blank" rel="noopener" href="${esc(wa(t('waAsk')))}">${esc(t('nfBtn'))}</a><br><a class="back-link" style="display:inline-block;margin-top:18px" href="index.html#services">${esc(t('back'))}</a>`;
}

function paintPrice(){
  const offer=svc.offerPrice&&svc.offerPrice<svc.price;
  $('#price').innerHTML=base>0?`${offer?`<s>${money(svc.price)}</s>`:''}${money(base)}<small>${esc(t('fee'))}</small>`:`<small style="font-size:15px;color:var(--ink);font-weight:600">${esc(t('feeAtCentre'))}</small>`;
  $('#couponBox').hidden=!(base>0&&svc.coupon);
  $('#totalRow').hidden=base<=0;
  $('#total').textContent=money(total);
  $('#buy').textContent=base>0?`${t('orderPrice')} →`:`${t('orderFree')} →`;
}

function paint(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const v=T[lang][el.dataset.i18n];if(typeof v==='string')el.textContent=v;});
  const ph=$('#coupon');ph.placeholder=lang==='hi'?ph.dataset.phHi:ph.dataset.phEn;
  $('#languageToggle').textContent=lang==='hi'?'English':'हिंदी';
  if(!svc)return;
  const nm=lang==='hi'&&svc.hi?svc.hi:svc.name,ds=lang==='hi'&&svc.hiDesc?svc.hiDesc:(svc.desc||'');
  document.title=`${nm} | IMI CENTER`;
  $('#title').textContent=nm;$('#description').textContent=ds;
  $('#eyebrow').textContent=(CAT[svc.category]||CAT.identity)[lang==='hi'?0:1];
  const gov=svc.type==='GOVERNMENT';
  $('#srcLine').hidden=!gov;$('#srcText').textContent=t('srcGov');
  $('#typeVal').textContent=gov?t('gov'):t('pvt');
  $('#coverage').textContent=!svc.state||svc.state==='All India'?t('india'):svc.state;
  $('#about').innerHTML=rich(svc.longDesc)||`<p>${esc(ds)}</p>`;
  const docs=String(svc.documents||'').split(/\r?\n/).map(x=>x.trim().replace(/^[-•]\s*/,'')).filter(Boolean);
  $('#docsSec').hidden=!docs.length;$('#docs').innerHTML=docs.map(d=>`<li>${esc(d)}</li>`).join('');
  const url=/^https?:\/\//.test(svc.url||'')?svc.url:'';
  $('#officialSec').hidden=!url;if(url)$('#officialLink').href=url;
  const img=/^https?:\/\//.test(svc.image||'')?svc.image:'';
  $('#svcImg').hidden=!img;if(img){$('#svcImg').src=img;$('#svcImg').alt=nm;}
  $('#askWa').href=wa(t('waAsk')+nm);
  $('#callUs').href=SITE.phone?'tel:+'+SITE.phone:'#';
  paintPrice();
}

function bind(){
  $('#languageToggle').onclick=()=>{lang=lang==='hi'?'en':'hi';localStorage.setItem('imiLang',lang);paint();};
  $('#apply').onclick=()=>{
    const code=$('#coupon').value.trim().toUpperCase(),msg=$('#couponMessage');
    if(!code){msg.textContent=t('couponEmpty');msg.style.color='#b42318';return;}
    if(svc.coupon&&code===String(svc.coupon).toUpperCase()){
      const pct=Math.min(100,Math.max(0,Number(svc.couponDiscount)||0));
      total=Math.round(base*(1-pct/100));coupon=code;msg.textContent=t('couponOk')(pct);msg.style.color='#276552';
    }else{total=base;coupon='';msg.textContent=t('couponBad');msg.style.color='#b42318';}
    $('#total').textContent=money(total);
  };
  $('#buy').onclick=()=>window.IMIOrder.open({id:svc.id,name:svc.name,hi:svc.hi,price:base,total,coupon});
  const nm=()=>lang==='hi'&&svc.hi?svc.hi:svc.name;
  const msg=()=>`${t('share')}${nm()} ${location.href}`;
  $('#shareWhatsApp').onclick=()=>window.open(`https://wa.me/?text=${encodeURIComponent(msg())}`,'_blank','noopener');
  $('#shareEmail').onclick=()=>location.href=`mailto:?subject=${encodeURIComponent(nm())}&body=${encodeURIComponent(msg())}`;
  $('#copyLink').onclick=async e=>{const b=e.currentTarget;try{await navigator.clipboard.writeText(location.href);b.textContent=t('copied');setTimeout(()=>b.textContent=t('copy'),1800);}catch{window.prompt('Copy this link:',location.href);}};
}

paint();
load().then(s=>{
  if(!s){notFound();return;}
  svc=s;base=Number(s.offerPrice&&s.offerPrice<s.price?s.offerPrice:s.price)||0;total=base;
  $('#state').hidden=true;$('#page').hidden=false;
  bind();paint();
});
})();
