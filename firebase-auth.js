const firebaseConfig = {
  apiKey: 'AIzaSyB9kXWad8Ju1NHwfR4dMDTxlC54kNgtz10',
  authDomain: 'website-df2cd.firebaseapp.com',
  projectId: 'website-df2cd',
  storageBucket: 'website-df2cd.firebasestorage.app',
  messagingSenderId: '222574367623',
  appId: '1:222574367623:web:13cfbf59751a2f513a3922'
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
document.body.style.display = 'none';

function showLogin(message = '') {
  document.body.style.display = 'grid';
  document.body.innerHTML = `<main style="max-width:420px;width:calc(100% - 32px);margin:auto;background:#fff;padding:32px;border-radius:18px;box-shadow:0 20px 60px #0002;font-family:Arial,sans-serif"><h1 style="margin:0 0 8px">IMI CENTER Admin</h1><p style="color:#667085;margin:0 0 24px">Sign in to manage public services.</p><form id="loginForm"><label style="display:block;margin:12px 0 6px">Email</label><input id="adminEmail" type="email" required style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccd2da;border-radius:8px"><label style="display:block;margin:12px 0 6px">Password</label><input id="adminPassword" type="password" required style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccd2da;border-radius:8px"><button style="width:100%;margin-top:20px;padding:13px;border:0;border-radius:8px;background:#176b5b;color:#fff;font-weight:700;cursor:pointer">Sign in</button><p id="loginError" style="color:#b42318;min-height:20px">${message}</p></form></main>`;
  document.querySelector('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.querySelector('#loginError');
    error.textContent = 'Signing in…';
    try {
      await auth.signInWithEmailAndPassword(document.querySelector('#adminEmail').value, document.querySelector('#adminPassword').value);
    } catch (err) {
      error.textContent = 'Email or password is incorrect.';
    }
  });
}

auth.onAuthStateChanged((user) => {
  if (!user) return showLogin();
  document.body.style.display = '';
  const script = document.createElement('script');
  script.src = 'dashboard.js';
  document.body.appendChild(script);
});
