/* IMI CENTER - shared order form. Needs firebase-data.js (window.sevaDb) and site-config.js on the page.
   Use: IMIOrder.open({id,name,hi,price,total,coupon})  or put data-order-service="Service name" on any button. */
(function(){
  if(window.IMIOrder)return;
  const SITE=window.IMI_SITE||{};
  const T={
    hi:{title:'ऑर्डर करें',service:'सेवा',amount:'कुल राशि',free:'शुल्क केंद्र पर बताया जाएगा',name:'आपका नाम',mobile:'मोबाइल नंबर',address:'गाँव / पता (वैकल्पिक)',note:'कोई खास बात (वैकल्पिक)',
      pay:'अभी भुगतान केंद्र पर होगा। ऑनलाइन भुगतान जल्द शुरू होगा।',submit:'ऑर्डर भेजें',sending:'भेजा जा रहा है…',cancel:'रद्द करें',
      errName:'कृपया अपना पूरा नाम लिखें।',errMobile:'सही 10 अंकों का मोबाइल नंबर लिखें।',errWait:'कृपया कुछ सेकंड रुककर फिर कोशिश करें।',
      errSend:'ऑर्डर नहीं जा सका। कृपया नीचे WhatsApp से भेज दें।',doneTitle:'ऑर्डर मिल गया ✓',doneText:'हमारी टीम जल्द ही इसी नंबर पर आपसे संपर्क करेगी।',
      orderNo:'ऑर्डर नंबर',wa:'WhatsApp पर भी भेजें',close:'बंद करें',coupon:'कूपन',
      waMsg:(o)=>`नमस्ते, मैंने वेबसाइट पर ऑर्डर किया है।\nऑर्डर नंबर: ${o.orderNo}\nसेवा: ${o.serviceName}\nनाम: ${o.name}\nमोबाइल: ${o.mobile}`},
    en:{title:'Place your order',service:'Service',amount:'Total amount',free:'Fee will be told at the centre',name:'Your name',mobile:'Mobile number',address:'Village / address (optional)',note:'Anything we should know (optional)',
      pay:'Pay at the centre for now. Online payment is coming soon.',submit:'Send order',sending:'Sending…',cancel:'Cancel',
      errName:'Please enter your full name.',errMobile:'Enter a valid 10-digit mobile number.',errWait:'Please wait a few seconds and try again.',
      errSend:'Could not send the order. Please send it on WhatsApp below.',doneTitle:'Order received ✓',doneText:'Our team will contact you on this number shortly.',
      orderNo:'Order number',wa:'Also send on WhatsApp',close:'Close',coupon:'Coupon',
      waMsg:(o)=>`Hello, I placed an order on the website.\nOrder no: ${o.orderNo}\nService: ${o.serviceName}\nName: ${o.name}\nMobile: ${o.mobile}`}
  };
  const lang=()=>document.documentElement.lang==='en'?'en':'hi';
  const t=k=>T[lang()][k];
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');

  const css=`
  .imo{width:min(480px,94vw);border:0;border-radius:14px;padding:0;background:#fffdf8;color:#173630;box-shadow:0 20px 70px #17363055;font:15px 'DM Sans','Noto Sans Devanagari',sans-serif}
  .imo::backdrop{background:#17363088}
  .imo-in{padding:24px}
  .imo h2{font:400 26px Georgia,'Noto Sans Devanagari',serif;margin:0 0 14px}
  .imo-sum{background:#edf4ed;border-radius:10px;padding:13px 15px;margin-bottom:16px;font-size:14px}
  .imo-sum div{display:flex;justify-content:space-between;gap:12px}.imo-sum div+div{margin-top:6px}
  .imo-sum b{text-align:right}
  .imo label{display:block;font-size:12px;font-weight:700;color:#64766f;margin:12px 0 0}
  .imo input,.imo textarea{width:100%;margin-top:5px;border:1px solid #e6e2d8;border-radius:8px;background:#fff;padding:11px 12px;font:15px inherit;color:#173630;outline:0}
  .imo input:focus,.imo textarea:focus{border-color:#e96935}
  .imo textarea{min-height:64px;resize:vertical}
  .imo .hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}
  .imo-pay{font-size:12px;color:#64766f;margin:14px 0 0;line-height:1.5}
  .imo-err{color:#b42318;font-size:13px;min-height:18px;margin:10px 0 0}
  .imo-act{display:flex;gap:10px;margin-top:8px}
  .imo-btn{flex:1;border:0;border-radius:8px;padding:13px;font:700 15px inherit;cursor:pointer;text-align:center;text-decoration:none;display:block}
  .imo-go{background:#e96935;color:#fff}.imo-go:disabled{opacity:.6;cursor:wait}
  .imo-no{background:#fff;color:#173630;border:1px solid #e6e2d8}
  .imo-wa{background:#1faa59;color:#fff}
  .imo-done{text-align:center}
  .imo-done .no{font:700 24px 'DM Sans',sans-serif;letter-spacing:.5px;background:#edf4ed;border-radius:10px;padding:14px;margin:14px 0}
  .imo-done p{color:#64766f;line-height:1.6;margin:0}
  .imo-done .imo-act{flex-direction:column}`;

  let dlg,cur=null;
  function build(){
    if(dlg)return;
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    dlg=document.createElement('dialog');dlg.className='imo';
    dlg.innerHTML='<div class="imo-in" id="imoBody"></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  }
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function orderNo(){
    const d=new Date(),p=n=>String(n).padStart(2,'0');
    return 'IMI-'+String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+'-'+String(Math.floor(1000+Math.random()*9000));
  }

  function showForm(){
    const s=cur,name=lang()==='hi'&&s.hi?s.hi:s.name;
    const body=dlg.querySelector('#imoBody');
    const amount=s.total>0?`<b>${money(s.total)}</b>`:`<b style="font-weight:600">${esc(t('free'))}</b>`;
    const coupon=s.coupon?`<div><span>${esc(t('coupon'))}</span><b>${esc(s.coupon)}</b></div>`:'';
    body.innerHTML=`<h2>${esc(t('title'))}</h2>
    <div class="imo-sum"><div><span>${esc(t('service'))}</span><b>${esc(name)}</b></div>${coupon}<div><span>${esc(t('amount'))}</span>${amount}</div></div>
    <form id="imoForm" novalidate>
      <label>${esc(t('name'))}<input id="imoName" autocomplete="name" maxlength="80" required></label>
      <label>${esc(t('mobile'))}<input id="imoMobile" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" required></label>
      <label>${esc(t('address'))}<input id="imoAddr" autocomplete="street-address" maxlength="300"></label>
      <label>${esc(t('note'))}<textarea id="imoNote" maxlength="500"></textarea></label>
      <input class="hp" id="imoHp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="imo-pay">${esc(t('pay'))}</p>
      <p class="imo-err" id="imoErr" role="alert"></p>
      <div class="imo-act"><button type="button" class="imo-btn imo-no" id="imoCancel">${esc(t('cancel'))}</button><button class="imo-btn imo-go" id="imoGo">${esc(t('submit'))}</button></div>
    </form>`;
    body.querySelector('#imoCancel').onclick=()=>dlg.close();
    body.querySelector('#imoMobile').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10);});
    body.querySelector('#imoForm').addEventListener('submit',submit);
  }

  function waLink(text){return `https://wa.me/${SITE.whatsapp||''}?text=${encodeURIComponent(text)}`;}

  async function submit(e){
    e.preventDefault();
    const $=id=>dlg.querySelector('#'+id),err=$('imoErr'),btn=$('imoGo');
    err.textContent='';
    if($('imoHp').value)return;
    const name=$('imoName').value.trim(),mobile=$('imoMobile').value.trim();
    if(name.length<2){err.textContent=t('errName');$('imoName').focus();return;}
    if(!/^[6-9]\d{9}$/.test(mobile)){err.textContent=t('errMobile');$('imoMobile').focus();return;}
    const last=Number(localStorage.getItem('imiLastOrder')||0);
    if(Date.now()-last<15000){err.textContent=t('errWait');return;}
    const s=cur,o={
      orderNo:orderNo(),serviceId:String(s.id||''),serviceName:String(s.name||''),serviceHi:String(s.hi||''),
      price:Number(s.price)||0,coupon:String(s.coupon||''),total:Number(s.total)||0,
      name,mobile,address:$('imoAddr').value.trim(),note:$('imoNote').value.trim(),
      status:'New',paymentStatus:'Pending',paymentMethod:'Pay at centre',
      page:location.pathname.split('/').pop()||'index.html',lang:lang(),createdAt:new Date().toISOString()
    };
    btn.disabled=true;btn.textContent=t('sending');
    try{
      if(!window.sevaDb)throw new Error('no-db');
      await window.sevaDb.collection('orders').add(o);
      localStorage.setItem('imiLastOrder',String(Date.now()));
      showDone(o);
    }catch(x){
      console.warn('Order failed',x);
      btn.disabled=false;btn.textContent=t('submit');
      err.innerHTML=esc(t('errSend'))+`<br><a class="imo-btn imo-wa" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(waLink(T[lang()].waMsg({orderNo:'—',serviceName:s.name,name,mobile})))}">${esc(t('wa'))}</a>`;
    }
  }

  function showDone(o){
    dlg.querySelector('#imoBody').innerHTML=`<div class="imo-done"><h2>${esc(t('doneTitle'))}</h2><p>${esc(t('doneText'))}</p>
      <div class="no"><small style="display:block;font:700 11px 'DM Sans',sans-serif;color:#64766f;letter-spacing:1px;margin-bottom:4px">${esc(t('orderNo').toUpperCase())}</small>${esc(o.orderNo)}</div>
      <div class="imo-act"><a class="imo-btn imo-wa" target="_blank" rel="noopener" href="${esc(waLink(T[lang()].waMsg(o)))}">${esc(t('wa'))}</a><button type="button" class="imo-btn imo-no" id="imoClose">${esc(t('close'))}</button></div></div>`;
    dlg.querySelector('#imoClose').onclick=()=>dlg.close();
  }

  function open(svc){
    build();
    const price=Number(svc.price)||0;
    cur={id:svc.id||'',name:svc.name||'',hi:svc.hi||'',price,total:svc.total!=null?Number(svc.total)||0:price,coupon:svc.coupon||''};
    showForm();
    if(!dlg.open)dlg.showModal();
  }

  /* Any button with data-order-service="Exact service name" opens the form (price taken from cached Firestore data if present) */
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-order-service]');if(!b)return;
    e.preventDefault();
    const name=b.dataset.orderService;let f={};
    try{f=(JSON.parse(localStorage.getItem('sevaSetuServices')||'[]').find(s=>s.name===name))||{};}catch{}
    const price=f.offerPrice&&f.offerPrice<f.price?f.offerPrice:f.price;
    open({id:f.id||'',name,hi:b.dataset.orderHi||f.hi||'',price:f.price||0,total:price||0});
  });

  window.IMIOrder={open};
})();
