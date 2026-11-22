firebase.initializeApp(window.IMI_FIREBASE);
const auth=firebase.auth();window.sevaDb=firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
const appHTML=document.body.innerHTML;let loaded=false;
document.body.style.visibility='hidden';
function showLogin(){
  document.body.style.visibility='';document.body.className='login-page';
  document.body.innerHTML='<main class="login-card"><div class="brand-mark">I</div><h1>IMI CENTER Admin</h1><p>Sign in to manage services.</p><form id="loginForm"><label>Email<input id="adminEmail" type="email" required autocomplete="username"></label><label>Password<input id="adminPassword" type="password" required autocomplete="current-password"></label><button>Sign in</button><p id="loginError"></p></form></main>';
  document.querySelector('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const err=document.querySelector('#loginError');err.textContent='Signing in…';
    try{await auth.signInWithEmailAndPassword(adminEmail.value,adminPassword.value);location.reload();}
    catch(x){err.textContent=x.code==='auth/network-request-failed'?'No internet connection.':x.code==='auth/too-many-requests'?'Too many attempts. Try again later.':'Email or password is incorrect.';console.warn(x.code);}});
}
auth.onAuthStateChanged(user=>{
  if(!user)return showLogin();
  if(loaded)return;loaded=true;document.body.style.visibility='';
  const s=document.createElement('script');s.src='dashboard.js';document.body.appendChild(s);
});
