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
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where
} from "./firebase.js";

const app = document.getElementById("app");

let currentUser = null;
let role = null;

/* ---------------- LOGIN ---------------- */

function loginPage() {
  app.innerHTML = `
    <div class="container">
      <h2>School Voting System</h2>
      <input id="email" placeholder="Email / LRN Email">
      <input id="password" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
    </div>
  `;
}

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const userCred = await signInWithEmailAndPassword(auth, email, password);
  currentUser = userCred.user;

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  role = userDoc.data().role;

  route();
};

/* ---------------- ROUTING ---------------- */

function route() {
  if (role === "admin") adminDashboard();
  else studentDashboard();
}

/* ---------------- ADMIN ---------------- */

async function adminDashboard() {
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
      <div id="candidates"></div>

      <h3>Live Results</h3>
      <div id="results"></div>
    </div>
  `;

  loadCandidates();
  loadResults();
}

window.addCandidate = async function () {
  await addDoc(collection(db, "candidates"), {
    name: name.value,
    position: position.value,
    party: party.value,
    votes: 0
  });
  loadCandidates();
};

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

  document.getElementById("candidates").innerHTML = html;
}

/* ---------------- STUDENT ---------------- */

async function studentDashboard() {
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));

  if (userDoc.data().voted) {
    app.innerHTML = "<h2>You already voted.</h2>";
    return;
  }

  app.innerHTML = `
    <div class="container">
      <h2>Vote Now</h2>
      <div id="voteList"></div>
      <button onclick="submitVote()">Submit Vote</button>
    </div>
  `;

  loadVoteList();
}

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

  document.getElementById("voteList").innerHTML = html;
}

window.submitVote = async function () {
  const inputs = document.querySelectorAll("input[type=radio]:checked");

  for (let i = 0; i < inputs.length; i++) {
    const candidateRef = doc(db, "candidates", inputs[i].value);
    const cSnap = await getDoc(candidateRef);

    await updateDoc(candidateRef, {
      votes: cSnap.data().votes + 1
    });
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    voted: true
  });

  alert("Vote submitted successfully!");
  studentDashboard();
};

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

    document.getElementById("results").innerHTML = html;
  });
}

/* ---------------- LOGOUT ---------------- */

window.logout = function () {
  signOut(auth);
  loginPage();
};

/* ---------------- INIT ---------------- */

onAuthStateChanged(auth, async (user) => {
  if (!user) loginPage();
  else {
    currentUser = user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    role = userDoc.data().role;
    route();
  }
});