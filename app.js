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
  if (loading) loading.style.display = "none";
  if (app) app.style.display = "block";
}

/* ---------------- LOGIN PAGE ---------------- */

function loginPage() {
  showApp();

  app.innerHTML = `
    <div class="container">
      <h2>School Voting System</h2>
      <input id="email" placeholder="Email">
      <input id="password" type="password" placeholder="Password">
      <button id="loginBtn">Login</button>
    </div>
  `;

  document.getElementById("loginBtn").onclick = login;
}

/* ---------------- LOGIN FUNCTION ---------------- */

async function login() {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;

    const snap = await getDoc(doc(db, "users", currentUser.uid));

    if (!snap.exists()) {
      alert("User not found in database");
      await signOut(auth);
      return;
    }

    const data = snap.data();

    if (!data.role) {
      alert("User has no role assigned");
      await signOut(auth);
      return;
    }

    role = data.role;
    route();

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    alert(e.message);
  }
}

/* ---------------- ROUTE ---------------- */

function route() {
  if (!role) {
    loginPage();
    return;
  }

  if (role === "admin") {
    adminDashboard();
  } else {
    studentDashboard();
  }
}

/* ---------------- ADMIN ---------------- */

function adminDashboard() {
  showApp();

  app.innerHTML = `
    <div class="container">
      <h2>Admin Dashboard</h2>
      <button id="logoutBtn">Logout</button>

      <h3>Add Candidate</h3>
      <input id="name" placeholder="Name">
      <input id="position" placeholder="Position">
      <input id="party" placeholder="Party">
      <button id="addBtn">Add Candidate</button>

      <h3>Candidates</h3>
      <div id="list"></div>

      <h3>Live Results</h3>
      <div id="results"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = logout;
  document.getElementById("addBtn").onclick = addCandidate;

  loadCandidates();
  loadResults();
}

async function addCandidate() {
  const name = document.getElementById("name").value.trim();
  const position = document.getElementById("position").value.trim();
  const party = document.getElementById("party").value.trim();

  if (!name || !position || !party) {
    alert("Fill all fields");
    return;
  }

  try {
    await addDoc(collection(db, "candidates"), {
      name,
      position,
      party,
      votes: 0
    });

    loadCandidates();

  } catch (e) {
    console.error(e);
    alert("Failed to add candidate");
  }
}

/* ---------------- LOAD CANDIDATES ---------------- */

async function loadCandidates() {
  try {
    const snap = await getDocs(collection(db, "candidates"));

    let html = "";
    snap.forEach(d => {
      const c = d.data();
      html += `<div class="card">${c.name} - ${c.position}</div>`;
    });

    const el = document.getElementById("list");
    if (el) el.innerHTML = html;

  } catch (e) {
    console.error(e);
  }
}

/* ---------------- STUDENT ---------------- */

async function studentDashboard() {
  showApp();

  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));

    if (!snap.exists()) {
      alert("User data missing");
      return;
    }

    if (snap.data().voted) {
      app.innerHTML = `
        <div class="container">
          <h2>You already voted</h2>
          <button onclick="logout()">Logout</button>
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <div class="container">
        <h2>Vote Now</h2>
        <div id="voteList"></div>
        <button id="voteBtn">Submit Vote</button>
        <button id="logoutBtn">Logout</button>
      </div>
    `;

    document.getElementById("voteBtn").onclick = submitVote;
    document.getElementById("logoutBtn").onclick = logout;

    loadVoteList();

  } catch (e) {
    console.error(e);
  }
}

/* ---------------- VOTE LIST ---------------- */

async function loadVoteList() {
  try {
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

  } catch (e) {
    console.error(e);
  }
}

/* ---------------- SUBMIT VOTE ---------------- */

async function submitVote() {
  try {
    const selected = document.querySelectorAll("input[type=radio]:checked");

    if (!selected.length) {
      alert("Complete vote first");
      return;
    }

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

  } catch (e) {
    console.error(e);
    alert("Vote failed");
  }
}

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

async function logout() {
  await signOut(auth);
  currentUser = null;
  role = null;
  loginPage();
}

window.logout = logout;

/* ---------------- INIT ---------------- */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    role = null;
    loginPage();
    return;
  }

  currentUser = user;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User record missing");
      await signOut(auth);
      return;
    }

    const data = snap.data();

    if (!data.role) {
      alert("No role assigned");
      await signOut(auth);
      return;
    }

    role = data.role;
    route();

  } catch (e) {
    console.error(e);
    loginPage();
  }
});
