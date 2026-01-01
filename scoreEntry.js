const API_KEY = "AIzaSyAWZlLZeGhEGjiVx29SH4wJpL9qZoiBRf0";
const SHEET_ID = "11sgLVqsMiHLXE61TU6iLbGDh7IPUWuOJE3shXQARshQ";
const PLAYER_RANGE = "Players!B2:H9";
const formURL =
  "https://docs.google.com/forms/d/e/1FAIpQLScRzQH2sh_bSoJ-yLdxH9VmQSllrOVhyssJmzVtrqtC4tP9JQ/formResponse";

let players = [];
let currentGroup = "1";

const CONTEST_MAP = {
  Mons: "Mons Venus",
  Pledge: "Pledge Pat",
  Snake: "Silver Snake",
  Frew: "Mike Frew"
};

/* ---------- FETCH PLAYERS ---------- */
function loadPlayers() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    PLAYER_RANGE
  )}?key=${API_KEY}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      players = data.values.map(r => ({
        name: r[0],
        group: r[4],
        team: r[5],
        course: r[6]
      }));

      initGroups();
      saveScoreEntryState();
      renderGroup();
    })
    .catch(err => console.error(err));
}

/* ---------- GROUP SELECT ---------- */
function initGroups() {
  const groups = [...new Set(players.map(p => p.group))];
  const select = document.getElementById("groupSelect");

  select.innerHTML = "";
  groups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = `Foursome ${g}`;
    select.appendChild(opt);
  });

  select.value = currentGroup;
  select.onchange = () => {
    currentGroup = select.value;
    renderGroup();
  };
}

/* ---------- RENDER PLAYERS ---------- 
function renderGroup() {
  const container = document.getElementById("players");
  container.innerHTML = "";

  const groupPlayers = players.filter(p => p.group === currentGroup);
  const course =
  groupPlayers.length > 0 && groupPlayers[0].course
    ? groupPlayers[0].course
    : "";


  document.getElementById("courseHeader").innerText =
    `${course} – Foursome ${currentGroup}`;

  groupPlayers.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${p.name} (${p.team})</h3>
      <div class="row">
        <input type="number" id="score-${p.name}" placeholder="Score">
      </div>
      <div class="row">
        ${contestCheckboxes(p.name)}
      </div>
    `;

    container.appendChild(card);
  });
} OLD*/

function renderGroup() {
  const container = document.getElementById("players");
  container.innerHTML = "";

  const groupPlayers = players.filter(p => p.group === currentGroup);
  const course = groupPlayers[0]?.course || "";

  document.getElementById("courseHeader").innerText =
    `${course}`;

  groupPlayers.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="player-row">
        <div class="player-name">
          ${p.name} (${p.team})
        </div>

        <input
          type="number"
          class="score-input"
          id="score-${p.name}"
          placeholder="Score"
          min="-12"
          max="12"
        >
      </div>       
      <div class="contest-row">
        ${contestCheckboxes(p.name)}
      </div>
    `;

    container.appendChild(card);
  });
}


/*Toggle Groups */

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function updateHoleDisplay() {
  document.getElementById("holeDisplay").innerText =
    document.getElementById("holeNumber").value;
}

function nextHole() {
  let h = parseInt(document.getElementById("holeNumber").value, 10);
  h = h === 18 ? 1 : h + 1;
  document.getElementById("holeNumber").value = h;
  updateHoleDisplay();
  saveScoreEntryState();

}

function prevHole() {
  let h = parseInt(document.getElementById("holeNumber").value, 10);
  h = h === 1 ? 18 : h - 1;
  document.getElementById("holeNumber").value = h;
  updateHoleDisplay();
  updateHoleDisplay();
  saveScoreEntryState();
}



/* ---------- CONTEST CHECKBOXES ---------- */
function contestCheckboxes(player) {
  const contests = [
    "Mons",
    "Pledge",
    "Snake",
    "Frew"
  ];

  return contests.map(c => `
    <label style="font-size:14px;">
      <input type="checkbox" id="${player}-${c}">
      ${c}
    </label>
  `).join("&nbsp;&nbsp;");
}

document.querySelectorAll('.contest-row').forEach(row => {
  row.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;

    const checked = row.querySelectorAll('input:checked');
    if (checked.length > 1) {
      e.target.checked = false;
      alert("Only one contest per player per hole");
    }
  });
});

/*document.querySelector('.score-input')?.focus();*/

/* ---------- Uses a Google Form to Send ---------- */
function postScore(player, hole, score, contests, course) {
  const data = new URLSearchParams();

  data.append("entry.1796458477", player); // Player
  data.append("entry.1218878937", hole);   // Hole
  data.append("entry.1338702967", score);  // Score
  data.append("entry.434165808", course);  // Course

  if (contests && contests.length) {
    data.append("entry.1606068626", contests.join(", "));
  }

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: data
  });
}

/* ---------- Show Toast When Finished ---------- */
function showToast(msg, duration = 1200) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

/* ---------- Save Group for when come back ---------- */
function saveScoreEntryState() {
  localStorage.setItem("lastGroup", currentGroup);
  localStorage.setItem("lastHole", document.getElementById("holeNumber").value);
}


/* ---------- Keeps Track of the Group You are Working from ---------- */
function restoreScoreEntryState() {
  const savedGroup = localStorage.getItem("lastGroup");
  const savedHole = localStorage.getItem("lastHole");

  if (savedGroup) currentGroup = savedGroup;
  if (savedHole) {
    document.getElementById("holeNumber").value = savedHole;
    updateHoleDisplay();
  }
}


/* ---------- SUBMIT ---------- */
function submitHole() {
  const hole = parseInt(document.getElementById("holeNumber").value, 10);

  if (!hole || hole < 1 || hole > 18) {
    alert("Hole must be 1–18");
    return;
  }

  const groupPlayers = players.filter(p => p.group === currentGroup);
  if (!groupPlayers.length) {
    alert("No players in this group");
    return;
  }

  const course = groupPlayers[0].course || "";
  let submitted = false;

  groupPlayers.forEach(p => {
    const scoreEl = document.getElementById(`score-${p.name}`);
    if (!scoreEl || !scoreEl.value) return;

   // Trigger browser validation (min / max / type)
    if (!scoreEl.checkValidity()) {
       scoreEl.reportValidity();
    return;
}


  const contests = Object.keys(CONTEST_MAP)
  .filter(c => document.getElementById(`${p.name}-${c}`)?.checked)
  .map(c => CONTEST_MAP[c]);   // 🔁 convert to long names


    postScore(
      p.name,
      hole,
      scoreEl.value,
      contests,
      course
    );

    // Clear inputs
    scoreEl.value = "";
    [
      "Mons",
      "Pledge",
      "Snake",
      "Frew"
    ].forEach(c => {
      const cb = document.getElementById(`${p.name}-${c}`);
      if (cb) cb.checked = false;
    });

    submitted = true;
    showToast("Scores submitted ✓");
  });

  if (!submitted) {
    alert("No scores entered");
    return;
  }

  // Advance hole (wrap)
  const next = hole === 18 ? 1 : hole + 1;
  document.getElementById("holeNumber").value = next;
  updateHoleDisplay();
  saveScoreEntryState();


  console.log(`Submitted hole ${hole}`);
}
/* ---------- ONE CONTEST PER PLAYER (AUTO DISABLE OTHERS) ---------- */
document.addEventListener("change", function (e) {
  if (e.target.type !== "checkbox") return;

  // checkbox id format: Player-Contest
  const [player] = e.target.id.split("-");

  // Find all contest checkboxes for this player
  const boxes = Object.keys(CONTEST_MAP).map(c =>
    document.getElementById(`${player}-${c}`)
  );

  // If one is checked, uncheck all others
  if (e.target.checked) {
    boxes.forEach(cb => {
      if (cb && cb !== e.target) cb.checked = false;
    });
  }
});



/* 🔑 MAKE FUNCTIONS VISIBLE TO HTML */
window.nextHole = nextHole;
window.prevHole = prevHole;
window.toggleMenu = toggleMenu;
window.submitHole = submitHole;


/* ---------- INIT ---------- */
/* document.addEventListener("DOMContentLoaded", loadPlayers); */

document.addEventListener("DOMContentLoaded", () => {
  restoreScoreEntryState();
  loadPlayers();
});


