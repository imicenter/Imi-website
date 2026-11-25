const defaultServices = [
  { name: 'Fresh passport application', hi: 'नया पासपोर्ट आवेदन', category: 'identity', state: 'All India', desc: 'Understand the process, documents, fee and appointment steps for a fresh passport.', hiDesc: 'नए पासपोर्ट के लिए प्रक्रिया, दस्तावेज़, शुल्क और अपॉइंटमेंट के चरण समझें।', type: 'GOVERNMENT' },
  { name: 'Aadhaar services', hi: 'आधार सेवाएँ', category: 'identity', state: 'All India', desc: 'Update your address, mobile number or demographic details.', hiDesc: 'अपना पता, मोबाइल नंबर या अन्य विवरण अपडेट करें।', type: 'GOVERNMENT' },
  { name: 'Ayushman Bharat', hi: 'आयुष्मान भारत', category: 'health', state: 'All India', desc: 'Check eligibility for cashless health coverage for your family.', hiDesc: 'परिवार के लिए कैशलेस स्वास्थ्य कवर की पात्रता जाँचें।', type: 'GOVERNMENT' },
  { name: 'National Scholarship Portal', hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल', category: 'education', state: 'All India', desc: 'Find and apply for government scholarships in one place.', hiDesc: 'सरकारी छात्रवृत्तियाँ खोजें और एक ही जगह आवेदन करें।', type: 'GOVERNMENT' },
  { name: 'PM Kisan Samman Nidhi', hi: 'पीएम किसान सम्मान निधि', category: 'welfare', state: 'Uttar Pradesh', desc: 'Income support scheme for eligible farmer families.', hiDesc: 'पात्र किसान परिवारों के लिए आय सहायता योजना।', type: 'GOVERNMENT' },
  { name: 'Emergency blood support', hi: 'आपातकालीन रक्त सहायता', category: 'community', state: 'Delhi', desc: 'Locate nearby blood banks and donation support services.', hiDesc: 'पास के ब्लड बैंक और रक्तदान सहायता सेवाएँ खोजें।', type: 'COMMUNITY' },
  { name: 'Jan Aushadhi Kendra', hi: 'जन औषधि केंद्र', category: 'health', state: 'Maharashtra', desc: 'Find quality generic medicines at affordable prices.', hiDesc: 'किफायती कीमतों पर गुणवत्तापूर्ण जेनेरिक दवाएँ पाएँ।', type: 'GOVERNMENT' }
];
const SERVICES_STORAGE_KEY = 'sevaSetuServices';
let services = JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY) || 'null') || defaultServices;
if (!services.some(s => s.name === 'Fresh passport application')) services.unshift(defaultServices[0]);

const SITE=window.IMI_SITE||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T={hi:{svc:'सेवाएँ',none:'कोई सेवा नहीं मिली। दूसरी खोज आज़माएँ या हमें WhatsApp करें।',view:'विवरण देखें →',order:'विवरण देखें और ऑर्डर करें →',india:'पूरा भारत',gov:'सरकारी',pvt:'गैर-सरकारी',ask:'WhatsApp पर पूछें',fee:'शुल्क',popular:'लोकप्रिय',trending:'ट्रेंडिंग',new:'नया',toEn:'English',wa:'नमस्ते, मुझे इस सेवा की जानकारी चाहिए: '},
en:{svc:'services',none:'No service found. Try another search or message us on WhatsApp.',view:'View details →',order:'View details & order →',india:'All India',gov:'Government',pvt:'Non-government',ask:'Ask on WhatsApp',fee:'Fee',popular:'Popular',trending:'Trending',new:'New',toEn:'हिंदी',wa:'Hello, I need information about: '}};
let lang=localStorage.getItem('imiLang')||'hi',cat='all',kind='all';
const t=k=>T[lang][k];
const wa=(text='नमस्ते, मुझे जानकारी चाहिए')=>`https://wa.me/${SITE.whatsapp||''}?text=${encodeURIComponent(text)}`;
const link=s=>s.name==='Aadhaar services'?'service-details.html':s.name==='Fresh passport application'?'passport.html':(s.id?'service.html?id='+encodeURIComponent(s.id):'service.html?name='+encodeURIComponent(s.name));
function render(){
  const q=$('#searchInput').value.trim().toLowerCase(),st=$('#stateFilter').value;
  const list=services.filter(s=>s.status!=='Draft'&&(cat==='all'||s.category===cat)&&(kind==='all'||(kind==='gov')===(s.type==='GOVERNMENT'))&&(st==='all'||s.state===st||s.state==='All India')&&(!q||`${s.name} ${s.hi} ${s.desc} ${s.hiDesc}`.toLowerCase().includes(q)));
  $('#resultCount').textContent=`${list.length} ${t('svc')}`;
  $('#serviceGrid').innerHTML=list.length?list.map(s=>{
    const name=lang==='hi'?s.hi:s.name,desc=lang==='hi'?s.hiDesc:s.desc,gov=s.type==='GOVERNMENT';
    const price=s.price?`<div class="price">${s.offerPrice&&s.offerPrice<s.price?`<s>₹${esc(s.price)}</s> <b>₹${esc(s.offerPrice)}</b>`:`<b>₹${esc(s.price)}</b>`}<small>${t('fee')}</small></div>`:'';
    const tag=s.discovery&&t(s.discovery)?`<span class="tag ${esc(s.discovery)}">${t(s.discovery)}</span>`:'';
    return `<article class="card">${s.image?`<img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy">`:''}<div class="badges"><span class="badge ${gov?'gov':'pvt'}">${gov?t('gov'):t('pvt')}</span>${tag}</div><h3>${esc(name)}</h3><p>${esc(desc)}</p>${price}<div class="card-foot"><a class="more" href="${link(s)}">${t('order')}</a><a class="wa-link" target="_blank" rel="noopener" href="${wa(t('wa')+s.name)}" aria-label="WhatsApp">WhatsApp</a></div></article>`;
  }).join(''):`<p class="empty">${t('none')}</p>`;
}
function applyLang(){
  document.documentElement.lang=lang;
  $$('[data-hi]').forEach(el=>{const v=el.dataset[lang];if(v!=null)el.innerHTML=v;});
  const ph=$('#searchInput');ph.placeholder=ph.dataset[lang==='hi'?'hiPh':'enPh'];
  $('#langToggle').textContent=t('toEn');render();
}
function applyContact(){
  const ph=SITE.phone||'';
  $$('[data-call]').forEach(a=>a.href=ph?'tel:+'+ph:'#contact');
  $$('[data-wa]').forEach(a=>a.href=wa());
  $$('[data-phone]').forEach(e=>e.textContent=ph?'+'+ph.replace(/^(\d{2})(\d{5})(\d{5})$/,'$1 $2 $3'):'');
  $$('[data-addr]').forEach(e=>e.textContent=SITE.address||'');
  $$('[data-hours]').forEach(e=>{e.textContent=SITE.hours||'';e.hidden=!SITE.hours;});
}
$$('.cat').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;$$('.cat').forEach(x=>x.classList.toggle('active',x===b));render();});
$$('.seg button').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;$$('.seg button').forEach(x=>x.classList.toggle('active',x===b));render();});
$$('.chip').forEach(b=>b.onclick=()=>{$('#searchInput').value=b.dataset.q;render();$('#services').scrollIntoView({behavior:'smooth'});});
$('#searchBtn').onclick=()=>{render();$('#services').scrollIntoView({behavior:'smooth'});};
$('#searchInput').addEventListener('input',render);$('#stateFilter').addEventListener('change',render);
$('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){render();$('#services').scrollIntoView({behavior:'smooth'});}});
$('#clearBtn').onclick=()=>{$('#searchInput').value='';$('#stateFilter').value='all';cat='all';kind='all';$$('.cat').forEach((b,i)=>b.classList.toggle('active',i===0));$$('.seg button').forEach((b,i)=>b.classList.toggle('active',i===0));render();};
$('#langToggle').onclick=()=>{lang=lang==='hi'?'en':'hi';localStorage.setItem('imiLang',lang);applyLang();};
$('#fontToggle').onclick=()=>{document.body.classList.toggle('large');localStorage.setItem('imiLarge',document.body.classList.contains('large'));};
if(localStorage.getItem('imiLarge')==='true')document.body.classList.add('large');
window.addEventListener('sevaServicesLoaded',()=>{const f=JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY)||'[]');services=f.length?f:defaultServices;if(!services.some(s=>s.name==='Fresh passport application'))services.unshift(defaultServices[0]);render();});
applyContact();applyLang();
