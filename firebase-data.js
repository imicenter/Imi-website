firebase.initializeApp(window.IMI_FIREBASE);
const sevaDb=firebase.firestore();window.sevaDb=sevaDb;
if(!sessionStorage.getItem('imiVisit')){sessionStorage.setItem('imiVisit','1');sevaDb.collection('siteStats').doc('summary').set({visitors:firebase.firestore.FieldValue.increment(1),lastVisit:new Date().toISOString()},{merge:true}).catch(()=>{});}
sevaDb.collection('services').where('status','==','Published').get().then(snap=>{localStorage.setItem('sevaSetuServices',JSON.stringify(snap.docs.map(d=>({id:d.id,...d.data()}))));window.dispatchEvent(new Event('sevaServicesLoaded'));}).catch(e=>console.warn('Could not load services',e));
