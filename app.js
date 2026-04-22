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
  updateDoc,
  getDoc,
  onSnapshot,
  increment
} from "./firebase.js";

/* ---------------- ROOT ---------------- */

const app = document.getElementById("app");
const loading = document.getElementById("loading");

let currentUser = null;
let role = null;

/* ---------------- INIT SAFE ---------------- */

function showApp() {
  loading.style.display = "none";
  app.style.display = "block";
}

/* ---------------- LOGIN PAGE ---------------- */

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

/* ---------------- LOGIN ---------------- */

async function login() {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User not found in database.");
      return;
    }

    role = userSnap.data().role;
    route();

  } catch (err) {
    console.error(err);
    alert("Login failed. Check credentials or Firebase setup.");
  }
}

/* ---------------- ROUTING ---------------- */

function route() {
  if (!role) return loginPage();

  if (role === "admin") adminDashboard();
  else studentDashboard();
}

/* ---------------- ADMIN ---------------- */

async function adminDashboard() {
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
      <div id="candidates"></div>

      <h3>Live Results</h3>
      <div id="results"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = logout;
  document.getElementById("addBtn").onclick = addCandidate;

  loadCandidates();
  loadResults();
}

/* ---------------- ADD CANDIDATE ---------------- */

async function addCandidate() {
  const name = document.getElementById("name").value;
  const position = document.getElementById("position").value;
  const party = document.getElementById("party").value;

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
}

/* ---------------- LOAD CANDIDATES ---------------- */

async function loadCandidates() {
  const snap = await getDocs(collection(db, "candidates"));

  let html = "";
  snap.forEach(docu => {
    const c = docu.data();

    html += `
      <div class="card">
        <b>${c.name}</b><br>
        ${c.position} - ${c.party}
      </div>
    `;
  });

  const el = document.getElementById("candidates");
  if (el) el.innerHTML = html;
}

/* ---------------- STUDENT ---------------- */

async function studentDashboard() {
  showApp();

  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    loginPage();
    return;
  }

  if (userSnap.data().voted) {
    app.innerHTML = "<h2>You already voted.</h2>";
    return;
  }

  app.innerHTML = `
    <div class="container">
      <h2>Vote Now</h2>
      <div id="voteList"></div>
      <button id="submitVoteBtn">Submit Vote</button>
    </div>
  `;

  document.getElementById("submitVoteBtn").onclick = submitVote;

  loadVoteList();
}

/* ---------------- VOTE LIST ---------------- */

async function loadVoteList() {
  const snap = await getDocs(collection(db, "candidates"));

  let html = "";

  snap.forEach(docu => {
    const c = docu.data();

    html += `
      <div class="card">
        <input type="radio" name="${c.position}" value="${docu.id}">
        <b>${c.name}</b><br>
        ${c.party}
      </div>
    `;
  });

  const el = document.getElementById("voteList");
  if (el) el.innerHTML = html;
}

/* ---------------- SUBMIT VOTE ---------------- */

async function submitVote() {
  const selected = document.querySelectorAll("input[type=radio]:checked");

  if (selected.length === 0) {
    alert("Please complete your vote.");
    return;
  }

  for (let input of selected) {
    const ref = doc(db, "candidates", input.value);

    await updateDoc(ref, {
      votes: increment(1)
    });
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    voted: true
  });

  alert("Vote submitted successfully!");
  studentDashboard();
}

/* ---------------- RESULTS ---------------- */

function loadResults() {
  onSnapshot(collection(db, "candidates"), (snap) => {
    let html = "";

    snap.forEach(docu => {
      const c = docu.data();

      html += `
        <div class="card">
          ${c.name} - ${c.votes} votes
        </div>
      `;
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

/* ---------------- AUTH STATE ---------------- */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginPage();
    return;
  }

  currentUser = user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    loginPage();
    return;
  }

  role = userSnap.data().role;
  route();
});
