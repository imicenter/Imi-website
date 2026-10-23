firebase.initializeApp({apiKey:'AIzaSyB9kXWad8Ju1NHwfR4dMDTxlC54Kngtz10',authDomain:'website-df2cd.firebaseapp.com',projectId:'website-df2cd',storageBucket:'website-df2cd.firebasestorage.app',messagingSenderId:'222574367623',appId:'1:222574367623:web:13cfbf59751a2f513a3922'});
const sevaDb=firebase.firestore();
sevaDb.collection('services').get().then(snapshot=>{if(!snapshot.empty){localStorage.setItem('sevaSetuServices',JSON.stringify(snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))));window.dispatchEvent(new Event('sevaServicesLoaded'));}}).catch(()=>{});
