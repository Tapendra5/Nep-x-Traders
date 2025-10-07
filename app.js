// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBX3-J3vZlGnM_CkKnXn7jVVdZj7Rrsx-8",
  authDomain: "nepal-trader.firebaseapp.com",
  projectId: "nepal-trader",
  storageBucket: "nepal-trader.firebasestorage.app",
  messagingSenderId: "225982610863",
  appId: "1:225982610863:web:dfe44ff14d72f91013435a",
  measurementId: "G-R6K7E8814T"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const msg = document.getElementById('auth-msg');
const appSection = document.getElementById('app-section');
const authSection = document.getElementById('auth-section');
const userNameEl = document.getElementById('user-name');
const balanceEl = document.getElementById('user-balance');
const packagesDiv = document.getElementById('packages');
const withdrawCard = document.getElementById('withdraw-card');
const historyCard = document.getElementById('history-card');
const withdrawAmount = document.getElementById('withdraw-amount');
const withdrawID = document.getElementById('withdraw-id');
const paymentMethods = document.querySelectorAll('.pay-icon');
const historyTable = document.getElementById('history-table');

// Packages
const packageList = [
  {name:'Silver', amount:300},
  {name:'Gold', amount:500},
  {name:'Nepal', amount:650},
  {name:'Good', amount:1000}
];

let selectedMethod = null;

// Show/Hide Forms
showRegister.addEventListener('click', e=>{
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});
showLogin.addEventListener('click', e=>{
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// Register
document.getElementById('btn-register').addEventListener('click', async()=>{
  const name=document.getElementById('reg-name').value;
  const email=document.getElementById('reg-email').value;
  const pass=document.getElementById('reg-pass').value;
  try{
    const cred=await auth.createUserWithEmailAndPassword(email,pass);
    await db.collection('users').doc(cred.user.uid).set({
      displayName:name||email.split('@')[0],
      email,
      balance:0,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  }catch(e){alert(e.message);}
});

// Login
document.getElementById('btn-login').addEventListener('click', async()=>{
  const email=document.getElementById('login-email').value;
  const pass=document.getElementById('login-pass').value;
  msg.innerText='';
  try{await auth.signInWithEmailAndPassword(email,pass);}catch(e){msg.innerText=e.message;}
});

// Auth State
auth.onAuthStateChanged(user=>{
  if(user){
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    db.collection('users').doc(user.uid).onSnapshot(doc=>{
      const data=doc.data();
      userNameEl.innerText=data.displayName||user.email;
      balanceEl.innerText=Number(data.balance||0);
    });
    renderPackages();
    renderHistory(user.uid);
  }else{
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});

// Render Packages
function renderPackages(){
  packagesDiv.innerHTML='';
  packageList.forEach(p=>{
    const div=document.createElement('div');
    div.className='package-card';
    div.innerHTML=`<b>${p.name}</b> - Rs.${p.amount} <button onclick="buyPackage('${p.name}',${p.amount})">Buy</button>`;
    packagesDiv.appendChild(div);
  });
}

// Buy via WhatsApp
function buyPackage(name,amount){
  const phone='9766692182';
  const msgTxt=encodeURIComponent(`Hello, I want to buy ${name} package for Rs.${amount}`);
  window.open(`https://wa.me/${phone}?text=${msgTxt}`,'_blank');
}

// Logout
document.getElementById('btn-logout').addEventListener('click',()=>auth.signOut());

// Payment Method Select
paymentMethods.forEach(icon=>{
  icon.addEventListener('click',()=>{
    paymentMethods.forEach(i=>i.classList.remove('selected'));
    icon.classList.add('selected');
    selectedMethod = icon.dataset.method;
  });
});

// Withdraw Submit
document.getElementById('btn-withdraw-submit').addEventListener('click', async()=>{
  const user = auth.currentUser;
  if(!user){alert("Login first");return;}
  const amount = Number(withdrawAmount.value);
  const id = withdrawID.value;
  if(!amount || !selectedMethod || !id){alert("All fields required"); return;}
  await db.collection('withdraws').add({
    uid:user.uid,
    username:userNameEl.innerText,
    amount,
    method:selectedMethod,
    walletID:id,
    status:"Pending",
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  alert("Withdraw request submitted!");
  withdrawAmount.value="";
  withdrawID.value="";
  paymentMethods.forEach(i=>i.classList.remove('selected'));
  selectedMethod=null;
});

// Render History
async function renderHistory(uid){
  const snapshot = await db.collection('history')
    .where('uid','==',uid)
    .orderBy('createdAt','desc')
    .get();
  historyTable.innerHTML=`<tr><th>Username</th><th>Amount</th><th>Date 📅</th><th>Status</th></tr>`;
  snapshot.forEach(doc=>{
    const d = doc.data();
    const date = d.createdAt ? d.createdAt.toDate().toLocaleString() : '';
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${d.username}</td><td>${d.amount}</td><td>${date}</td><td>${d.status}</td>`;
    historyTable.appendChild(tr);
  });
});
