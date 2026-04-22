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

/* ---------------- SAFE BOOT ---------------- */

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

/* ---------------- LOGIN FUNCTION ---------------- */

async function login() {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;

    const snap = await getDoc(doc(db, "users", currentUser.uid));

    if (!snap.exists()) {
      alert("User not found in database");
      return;
    }

    role = snap.data().role;
    route();

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    alert("Login failed. Check Firebase setup.");
  }
}

/* ---------------- ROUTE ---------------- */

function route() {
  if (!role) return loginPage();
  role === "admin" ? adminDashboard() : studentDashboard();
}

/* ---------------- ADMIN ---------------- */

async function adminDashboard() {
  showApp();

  app.innerHTML = `
    <div class="container">
      <h2>Admin</h2>
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

/* ---------------- LOAD CANDIDATES ---------------- */

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

async function studentDashboard() {
  showApp();

  const snap = await getDoc(doc(db, "users", currentUser.uid));

  if (snap.data()?.voted) {
    app.innerHTML = "<h2>You already voted</h2>";
    return;
  }

  app.innerHTML = `
    <div class="container">
      <h2>Vote Now</h2>
      <div id="voteList"></div>
      <button onclick="submitVote()">Submit</button>
    </div>
  `;

  loadVoteList();
}

/* ---------------- VOTE LIST ---------------- */

async function loadVoteList() {
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

/* ---------------- SUBMIT VOTE ---------------- */

window.submitVote = async function () {
  const selected = document.querySelectorAll("input[type=radio]:checked");

  if (!selected.length) return alert("Complete vote first");

  for (let s of selected) {
    await updateDoc(doc(db, "candidates", s.value), {
      votes: increment(1)
    });
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    voted: true
  });

  alert("Vote submitted!");
  studentDashboard();
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
