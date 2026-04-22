import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment
} from "./firebase.js";

const app = document.getElementById("app");
const loading = document.getElementById("loading");

let currentUser = null;
let role = null;

/* ---------------- SAFE START ---------------- */

function showApp() {
  loading.style.display = "none";
  app.style.display = "block";
}

/* ---------------- LOGIN ---------------- */

function loginPage() {
  showApp();

  app.innerHTML = `
    <div class="container">
      <h2>School Voting System</h2>

      <input id="email" placeholder="Email / LRN Email">
      <input id="password" type="password" placeholder="Password">

      <button id="loginBtn">Login</button>
    </div>
  `;

  document.getElementById("loginBtn").onclick = login;
}

async function login() {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));

    if (!userSnap.exists()) {
      alert("User not found in database");
      return;
    }

    role = userSnap.data().role;
    route();

  } catch (e) {
    console.error(e);
    alert("Login failed");
  }
}

/* ---------------- ROUTER ---------------- */

function route() {
  if (role === "admin") admin();
  else student();
}

/* ---------------- ADMIN ---------------- */

async function admin() {
  showApp();

  app.innerHTML = `
    <div class="container">
      <h2>Admin Dashboard</h2>
      <button onclick="logout()">Logout</button>

      <input id="name" placeholder="Name">
      <input id="position" placeholder="Position">
      <input id="party" placeholder="Party">

      <button onclick="addCandidate()">Add</button>

      <div id="list"></div>
      <div id="results"></div>
    </div>
  `;

  loadCandidates();
  loadResults();
}

window.addCandidate = async function () {
  const name = document.getElementById("name").value;
  const position = document.getElementById("position").value;
  const party = document.getElementById("party").value;

  if (!name || !position || !party) return alert("Fill all fields");

  await addDoc(collection(db, "candidates"), {
    name,
    position,
    party,
    votes: 0
  });

  loadCandidates();
};

async function loadCandidates() {
  const snap = await getDocs(collection(db, "candidates"));

  let html = "";
  snap.forEach(d => {
    const c = d.data();
    html += `<div class="card">${c.name} - ${c.position}</div>`;
  });

  document.getElementById("list").innerHTML = html;
}

/* ---------------- STUDENT ---------------- */

async function student() {
  showApp();

  const userSnap = await getDoc(doc(db, "users", currentUser.uid));

  if (userSnap.data().voted) {
    app.innerHTML = "<h2>You already voted</h2>";
    return;
  }

  app.innerHTML = `
    <div class="container">
      <h2>Vote</h2>
      <div id="voteList"></div>
      <button onclick="submitVote()">Submit</button>
    </div>
  `;

  loadVotes();
}

async function loadVotes() {
  const snap = await getDocs(collection(db, "candidates"));

  let html = "";

  snap.forEach(d => {
    const c = d.data();

    html += `
      <div class="card">
        <input type="radio" name="${c.position}" value="${d.id}">
        ${c.name} (${c.party})
      </div>
    `;
  });

  document.getElementById("voteList").innerHTML = html;
}

window.submitVote = async function () {
  const selected = document.querySelectorAll("input[type=radio]:checked");

  if (!selected.length) return alert("Complete your vote");

  for (let s of selected) {
    await updateDoc(doc(db, "candidates", s.value), {
      votes: increment(1)
    });
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    voted: true
  });

  alert("Vote submitted!");
  student();
};

/* ---------------- RESULTS ---------------- */

function loadResults() {
  onSnapshot(collection(db, "candidates"), snap => {
    let html = "";

    snap.forEach(d => {
      const c = d.data();
      html += `<div class="card">${c.name}: ${c.votes}</div>`;
    });

    const el = document.getElementById("results");
    if (el) el.innerHTML = html;
  });
}

/* ---------------- LOGOUT ---------------- */

window.logout = async function () {
  await signOut(auth);
  loginPage();
};

/* ---------------- INIT ---------------- */

onAuthStateChanged(auth, user => {
  if (!user) loginPage();
  else {
    currentUser = user;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      role = snap.data()?.role;
      route();
    });
  }
});
