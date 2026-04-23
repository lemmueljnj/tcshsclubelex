import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
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

      <h3>Login</h3>
      <input id="email" placeholder="Email">
      <input id="password" type="password" placeholder="Password">
      <button id="loginBtn">Login</button>

      <hr>

      <h3>Create Voter Account</h3>
      <input id="regEmail" placeholder="Email">
      <input id="regPassword" type="password" placeholder="Password">
      <input id="regLRN" placeholder="LRN">
      <button id="registerBtn">Register</button>
    </div>
  `;

  document.getElementById("loginBtn").onclick = login;
  document.getElementById("registerBtn").onclick = register;
}

/* ---------------- LOGIN ---------------- */

async function login() {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Fill in all fields");
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

    role = snap.data().role;
    route();

  } catch (e) {
    console.error(e);
    alert("Login failed");
  }
}

/* ---------------- REGISTER ---------------- */

async function register() {
  try {
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const lrn = document.getElementById("regLRN").value.trim();

    if (!email || !password || !lrn) {
      alert("All fields required");
      return;
    }

    // 🔍 CHECK DUPLICATE LRN
    const q = query(collection(db, "users"), where("lrn", "==", lrn));
    const existing = await getDocs(q);

    if (!existing.empty) {
      alert("LRN already registered");
      return;
    }

    // 🔐 CREATE AUTH USER
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 🧾 CREATE FIRESTORE USER
    await setDoc(doc(db, "users", user.uid), {
      role: "student",
      lrn: lrn,
      voted: false
    });

    alert("Account created successfully!");

    currentUser = user;
    role = "student";
    route();

  } catch (e) {
    console.error("REGISTER ERROR:", e);
    alert(e.message);
  }
}

/* ---------------- ROUTING ---------------- */

function route() {
  if (!role) return loginPage();

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
      <button onclick="logout()">Logout</button>

      <h3>Add Candidate</h3>
      <input id="name" placeholder="Name">
      <input id="position" placeholder="Position">
      <input id="party" placeholder="Party">
      <button onclick="addCandidate()">Add</button>

      <h3>Candidates</h3>
      <div id="list"></div>

      <h3>Results</h3>
      <div id="results"></div>
    </div>
  `;

  loadCandidates();
  loadResults();
}

window.addCandidate = async function () {
  const name = document.getElementById("name").value.trim();
  const position = document.getElementById("position").value.trim();
  const party = document.getElementById("party").value.trim();

  if (!name || !position || !party) {
    alert("Fill all fields");
    return;
  }

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

  const el = document.getElementById("list");
  if (el) el.innerHTML = html;
}

/* ---------------- STUDENT ---------------- */

async function studentDashboard() {
  showApp();

  const snap = await getDoc(doc(db, "users", currentUser.uid));

  if (snap.data()?.voted) {
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
      <button onclick="submitVote()">Submit Vote</button>
      <button onclick="logout()">Logout</button>
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

/* ---------------- VOTE SUBMIT ---------------- */

window.submitVote = async function () {
  const selected = document.querySelectorAll("input[type=radio]:checked");

  if (!selected.length) {
    alert("Complete your vote");
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
  currentUser = null;
  role = null;
  loginPage();
};

/* ---------------- INIT ---------------- */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginPage();
    return;
  }

  currentUser = user;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    alert("User not found in database");
    await signOut(auth);
    loginPage();
    return;
  }

  role = snap.data().role;
  route();
});
