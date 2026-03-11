// Tambahkan ini di bagian global
let secondsInSim   = 0;
let currentHour    = 10; 
let currentMinute  = 0;
let parkOpenHour   = 10;
let parkCloseHour  = 20;
let gateCloseHour  = 18; // <-- Tambahkan jam tutup gerbang
let rideID = 0;
let rideEditor = null;
let TOTAL_N = 500; // Default awal
let arrivalSchedule = []; // Tempat menyimpan menit kedatangan setiap agen

let globalAgentIDCounter = 0; 
let agentExportData = []; // Array untuk menyimpan buku harian semua pengunjung yang pulang

let globalRhoHistory = [];


let inputOpenH, inputOpenM;
let inputCloseH, inputCloseM;
let inputCap, inputRuntime;
let inputPopular;
let saveBtn, cancelBtn;

const TIME_ACCELERATION = 60; 

// global vars
let simMap;
let nodes = [];
let connections = [];
let entrance;
let rides;
let agents = [];
let isRunning = false;
let showStats = true;

// statistics
let time = 0;
let timeHist = [];

let maxRidesRecord = 0;
let minRidesRecord = Infinity;

let totalVisitors = 0;
let totalVisitorsHist = [];

let totalTimeSpent = 0;
let timeSpentHist = [];

let totalTimeQueue = 0;
let timeQueueHist = [];

let totalRides = 0;
let rideHist = [];

let totalAgtsLeft = 0;
let agtsLeftHist = [];
let numExitedAgents = 0;

let averageQueueTime = 0;
let avgQueueTimeHist = [];
let minQueueTimeHist = [];

// creator mode
let creatorMode = false;
let selected = false;
let selectedNodeIndex = -1;
let selecting = false;

function setup() {
  // === INJEKSI CSS UNTUK SLIDER PANEL (GLASSMORPHISM) ===
  const style = createElement('style', `
    .side-panel {
      position: fixed;
      top: 0;
      left: -320px; /* Sembunyikan di luar layar saat awal */
      width: 300px;
      height: 100vh;
      background: rgba(20, 22, 28, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-right: 1px solid rgba(255,255,255,0.1);
      transition: left 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      z-index: 1000;
      padding: 20px;
      box-sizing: border-box;
      color: #fff;
      font-family: sans-serif;
      overflow-y: auto;
      box-shadow: 4px 0 25px rgba(0,0,0,0.5);
    }
    .side-panel.open {
      left: 0; /* Geser ke dalam layar */
    }
    /* === TOPBAR === */
    .sim-topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      background: rgba(6, 14, 30, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(56,189,248,0.18);
      box-shadow: 0 2px 24px rgba(0,0,0,0.5);
    }
    .sim-back-btn {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 2px;
      color: rgba(56,189,248,0.75);
      text-decoration: none;
      padding: 6px 16px;
      border: 1px solid rgba(56,189,248,0.25);
      border-radius: 20px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .sim-back-btn:hover {
      background: rgba(56,189,248,0.1);
      border-color: rgba(56,189,248,0.55);
      color: #38bdf8;
    }
    .sim-topbar-center {
      position: absolute;
      left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 10px;
      pointer-events: none;
    }
    .sim-topbar-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e; box-shadow: 0 0 8px #22c55e;
      animation: tbBlink 2s ease-in-out infinite;
    }
    @keyframes tbBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    .sim-topbar-title {
      font-family: 'Orbitron', 'Share Tech Mono', monospace;
      font-size: 13px; font-weight: 700;
      color: #e2e8f0; letter-spacing: 1px; white-space: nowrap;
    }
    .sim-topbar-title span {
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sim-topbar-right {
      display: flex; align-items: center; gap: 8px;
    }
    /* Controls button — sekarang di topbar kanan */
    .panel-toggle-btn {
      position: static !important;
      background: rgba(56,189,248,0.12) !important;
      color: #38bdf8 !important;
      border: 1px solid rgba(56,189,248,0.3) !important;
      padding: 7px 18px !important;
      border-radius: 20px !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 11px !important;
      font-weight: normal !important;
      letter-spacing: 1.5px !important;
      cursor: pointer;
      box-shadow: none !important;
      backdrop-filter: none !important;
      transition: all 0.2s !important;
      white-space: nowrap;
    }
    .panel-toggle-btn:hover {
      background: rgba(56,189,248,0.22) !important;
      border-color: rgba(56,189,248,0.6) !important;
      transform: none !important;
    }
    /* Push app content below topbar */
    .app-container { padding-top: 52px; }
    .main-title    { display: none !important; }
    .close-panel-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 28px;
      cursor: pointer;
      line-height: 1;
      transition: color 0.2s;
    }
    .close-panel-btn:hover {
      color: #fff;
    }
    .sp-section-title {
      font-size: 13px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 25px 0 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    }
    .sp-input-group {
      margin-bottom: 15px;
    }
    .sp-input-group label {
      display: block;
      font-size: 13px;
      margin-bottom: 6px;
      color: #cbd5e1;
    }
    .sp-btn {
      width: 100%;
      margin-bottom: 10px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      transition: all 0.2s;
    }
    .sp-btn:hover { 
      background: rgba(255,255,255,0.15); 
      transform: translateY(-1px);
    }
    .sp-btn.success { background: #22c55e; color: #000; border: none; }
    .sp-btn.success:hover { background: #16a34a; }
    .sp-btn.danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); }
    .sp-btn.danger:hover { background: #ef4444; color: #fff; }
    .sp-input {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.4);
      color: white;
      box-sizing: border-box;
      font-family: monospace;
      font-size: 14px;
    }
    .sp-input:focus {
      outline: none;
      border-color: #38bdf8;
    }
  `);
  style.parent(document.head);

  // === MAIN CONTAINER ===
  const app = createDiv();
  app.class("app-container");

  // ===== TOPBAR (fixed, full-width) =====
  const topbarEl = document.createElement('div');
  topbarEl.className = 'sim-topbar';
  topbarEl.innerHTML = `
    <a href="index.html" class="sim-back-btn">← HOME</a>
    <div class="sim-topbar-center">
      <div class="sim-topbar-dot"></div>
      <div class="sim-topbar-title">🎢 DUFAN &nbsp;<span>HIERARCHICAL</span></div>
    </div>
    <div class="sim-topbar-right" id="topbar-right-slot"></div>
  `;
  document.body.appendChild(topbarEl);

  // ===== TOMBOL BUKA PANEL — ditempatkan di slot topbar kanan =====
  const toggleBtnEl = document.createElement('button');
  toggleBtnEl.className = 'panel-toggle-btn';
  toggleBtnEl.textContent = '☰ Controls';
  document.getElementById('topbar-right-slot').appendChild(toggleBtnEl);

  // ===== SIDE PANEL CONTAINER — langsung ke body agar z-index & event benar =====
  const panel = createDiv();
  panel.class("side-panel");
  panel.parent(document.body);

  // Tombol close — native DOM agar tidak bergantung pada p5 parent chain
  const closeBtnEl = document.createElement('button');
  closeBtnEl.className = 'close-panel-btn';
  closeBtnEl.textContent = '×';
  panel.elt.appendChild(closeBtnEl);

  // Logika Buka/Tutup — semua native addEventListener
  function openPanel() {
    panel.addClass("open");
    toggleBtnEl.textContent = "✕ Controls";
    toggleBtnEl.style.background = "rgba(239,68,68,0.15)";
    toggleBtnEl.style.borderColor = "rgba(239,68,68,0.4)";
    toggleBtnEl.style.color = "#ef4444";
  }
  function closePanel() {
    panel.removeClass("open");
    toggleBtnEl.textContent = "☰ Controls";
    toggleBtnEl.style.background = "";
    toggleBtnEl.style.borderColor = "";
    toggleBtnEl.style.color = "";
  }
  function togglePanel() {
    panel.elt.classList.contains("open") ? closePanel() : openPanel();
  }
  toggleBtnEl.addEventListener('click', togglePanel);
  closeBtnEl.addEventListener('click', closePanel);

  // p5 wrapper agar sisa kode yang pakai closeBtn.mouseClicked tidak error
  const closeBtn = { mouseClicked: (fn) => closeBtnEl.addEventListener('click', fn) };

  // ===== ISI PANEL KONTROL =====
  const panelTitle = createDiv("⚙️ Control Panel");
  panelTitle.style("font-size", "22px");
  panelTitle.style("font-weight", "bold");
  panelTitle.style("margin-bottom", "20px");
  panelTitle.parent(panel);

  // --- SECTION: SETTINGS ---
  const setSec = createDiv("General Settings");
  setSec.class("sp-section-title");
  setSec.parent(panel);

  const inputGroup = createDiv();
  inputGroup.class("sp-input-group");
  inputGroup.parent(panel);
  
  const nLabel = createElement("label", "Total Visitors (N):");
  nLabel.parent(inputGroup);
  
  const nInput = createInput('500', 'number');
  nInput.class("sp-input");
  nInput.parent(inputGroup);
  nInput.input(() => { TOTAL_N = int(nInput.value()); 
    if (!isRunning){
      generateArrivalSchedule(TOTAL_N);
    }
  });

  // --- SECTION: SIMULATION ---
  const simSec = createDiv("Simulation");
  simSec.class("sp-section-title");
  simSec.parent(panel);

  const startSimBtn = createButton("▶ Start / Pause");
  startSimBtn.class("sp-btn success");
  startSimBtn.parent(panel);
  startSimBtn.mouseClicked(toggleSim);

  const resetSimBtn = createButton("⟲ Reset Simulation");
  resetSimBtn.class("sp-btn danger");
  resetSimBtn.parent(panel);
  resetSimBtn.mouseClicked(resetSim);

  const statsPanelBtn = createButton("📊 Toggle Stats");
  statsPanelBtn.class("sp-btn");
  statsPanelBtn.parent(panel);
  statsPanelBtn.mouseClicked(toggleStats);

  const exportBtn = createButton("⬇ Export CSV");
  exportBtn.class("sp-btn");
  exportBtn.parent(panel);
  exportBtn.mouseClicked(exportCSV);

  // --- SECTION: MAP CONTROL ---
  const mapSec = createDiv("Map Control");
  mapSec.class("sp-section-title");
  mapSec.parent(panel);

  const editRideBtn = createButton("⚙ Edit Ride");
  editRideBtn.class("sp-btn");
  editRideBtn.parent(panel);
  editRideBtn.mouseClicked(toggleEditMode);

  const creatorBtn = createButton("✏ Creator Mode");
  creatorBtn.class("sp-btn");
  creatorBtn.parent(panel);
  creatorBtn.mouseClicked(toggleCreate);

  const defaultMapButton = createButton("📌 Default Map");
  defaultMapButton.class("sp-btn");
  defaultMapButton.parent(panel);
  defaultMapButton.mouseClicked(defaultMap);

  const clearMapBtn = createButton("🗑 Clear Map");
  clearMapBtn.class("sp-btn danger");
  clearMapBtn.parent(panel);
  clearMapBtn.mouseClicked(resetMap);

  // ===== MAIN TITLE hidden — replaced by topbar =====
  // (judul sekarang di topbar, tidak perlu elemen terpisah)

  // === CANVAS WRAPPER ===
  const canvasWrapper = createDiv();
  canvasWrapper.class("canvas-wrapper");
  canvasWrapper.parent(app);

  let cnv = createCanvas(WIDTH, HEIGHT);
  cnv.parent(canvasWrapper);

  // ===== RIDE DASHBOARD =====
  buildRideDashboard(app);

  // ===== FOOTER =====
  buildFooter(app);

  frameRate(FRAME_RATE);
  createMap();
  resetSim();
}

function draw() {
  // ===== PARK BACKGROUND =====
  drawParkBackground();

  // ===== NIGHT OVERLAY =====
  if (currentHour >= 18 || currentHour < 6) {
    push();
    noStroke();
    fill(0, 0, 40, 140);
    rect(0, 0, width, height);
    pop();
  }

  // ===== MAP =====
  if (simMap) {
    simMap.drawMap(creatorMode);
  }

  // ===== EDIT MODE INDICATOR =====
  if (editMode) {
    push();
    fill(255, 60, 60);
    textSize(18);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    text("⚙ EDIT MODE", 20, 20);
    pop();
  }

  // ===== MAIN SIMULATION =====
  if (!creatorMode) {
    if (isRunning) {
      frameRunning++;
      time += deltaTime / 1000;

      secondsInSim += deltaTime / 1000 * TIME_ACCELERATION;
      currentMinute = Math.floor(secondsInSim / 60) % 60;
      currentHour = parkOpenHour + Math.floor(secondsInSim / 3600);

      // Simulasi berhenti HANYA JIKA sudah lewat jam tutup DAN taman sudah kosong
      if (currentHour >= parkCloseHour && agents.length === 0) {
        isRunning = false;
      }

      updateLoop();
    }

    // ===== DRAW AGENTS — LOD + HEATMAP =====
    drawAgentsLOD();

    // ===== DIGITAL CLOCK UI (Glassmorphism Pill) =====
    push();
    const clockTxt = `${currentHour.toString().padStart(2,'0')}:${currentMinute.toString().padStart(2,'0')} WIB`;
    textSize(18);
    textStyle(BOLD);
    const tw = textWidth(clockTxt);
    
    fill(18, 18, 22, 220);
    stroke(255, 255, 255, 40);
    strokeWeight(1);
    rect(WIDTH - tw - 40, 15, tw + 25, 36, 18);

    textAlign(CENTER, CENTER);
    fill("#38bdf8");
    noStroke();
    text(clockTxt, WIDTH - tw/2 - 27, 33);
    pop();

    // ===== RUNNING INDICATOR =====
    drawRunning();

    drawDisplay();

    // Rekam Global Rho untuk rata-rata harian (ambil tiap frame kelipatan 60 agar tidak terlalu berat)
    if (frameCount % 60 === 0 && currentHour < parkCloseHour) {
        
        // 🔥 PERBAIKAN: Cegah Dilusi Data! 
        // Hanya rekam nilai Rho jika ada orang di taman, ATAU masih ada jadwal kedatangan pengunjung.
        if (agents.length > 0 || arrivalSchedule.length > 0) {
            let macroMetrics = getGlobalQueueMetrics(simMap);
            if (macroMetrics) {
                globalRhoHistory.push(macroMetrics.globalRho);
            }
        }
        
    }

    if (showStats) {
      drawStats();
    }

    // Update HTML dashboard
    updateRideDashboard();



    } else {
    // ===== CREATOR MODE =====
    push();
    fill(255);
    textSize(18);
    textAlign(RIGHT, TOP);
    text("🗺 CREATOR MODE", WIDTH - 20, 20);
    pop();

    let flag = false;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (dist(node.x, node.y, mouseX, mouseY) < SELECT_RADIUS) {
        noStroke();
        fill(255, 255, 255, 120);
        circle(node.x, node.y, 2 * SELECT_RADIUS);
        flag = true;

        if (!selected && mouseIsPressed) {
          selectedNodeIndex = i;
          selected = true;
        } 
        else if (selected && !mouseIsPressed) {
          let valid = true;
          for (let connection of connections) {
            if (
              (connection[0] == i && connection[1] == selectedNodeIndex) ||
              (connection[0] == selectedNodeIndex && connection[1] == i)
            ) {
              valid = false;
            }
          }
          if (valid) {
            connections.push([selectedNodeIndex, i]);
            simMap.connectNode(selectedNodeIndex, i);
          }
        }
      }
    }

    selecting = flag;

    if (selected) {
      const node = nodes[selectedNodeIndex];
      stroke("#f97316");
      strokeWeight(2);
      line(node.x, node.y, mouseX, mouseY);

      if (!mouseIsPressed) {
        selected = false;
        if (dist(node.x, node.y, mouseX, mouseY) < SELECT_RADIUS) {
          node.toggleType();
        }
      }
    }
  }
}

function drawParkBackground() {
  // ===== BLUEPRINT BASE =====
  background(8, 18, 38); // deep navy blueprint

  // ===== GRID MAJOR (every 80px) =====
  stroke(30, 80, 160, 60);
  strokeWeight(1);
  for (let x = 0; x < width; x += 80) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 80) {
    line(0, y, width, y);
  }

  // ===== GRID MINOR (every 20px) =====
  stroke(20, 55, 120, 28);
  strokeWeight(0.5);
  for (let x = 0; x < width; x += 20) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 20) {
    line(0, y, width, y);
  }

  // ===== CROSS-HAIR CORNER MARKS =====
  stroke(56, 140, 255, 50);
  strokeWeight(1);
  const mark = 12;
  // corners
  [[20,20],[width-20,20],[20,height-20],[width-20,height-20]].forEach(([cx,cy]) => {
    line(cx-mark, cy, cx+mark, cy);
    line(cx, cy-mark, cx, cy+mark);
  });

  // ===== SCALE BAR bottom right =====
  push();
  stroke(56, 140, 255, 60);
  strokeWeight(1);
  fill(56, 140, 255, 60);
  textSize(8);
  textAlign(CENTER, BOTTOM);
  let sbX = width - 100, sbY = height - 18, sbW = 80;
  line(sbX, sbY, sbX + sbW, sbY);
  line(sbX, sbY - 4, sbX, sbY + 4);
  line(sbX + sbW, sbY - 4, sbX + sbW, sbY + 4);
  text("~400m", sbX + sbW/2, sbY - 2);
  pop();
}

function mouseClicked() {
  if(rideEditor){
    if (mouseX > width/2 - 100 && mouseX < width/2 - 20 &&
      mouseY > height/2 + 120 && mouseY < height/2 + 160) {
        applyRideEdit();
      }
      if (mouseX > width/2 + 20 && mouseX < width/2 + 100 &&
        mouseY > height/2 + 120 && mouseY < height/2 + 160) {
          rideEditor = null;
        }
  return;
  }

  if (editMode) {
    for (let node of nodes) {
      if (
        node.type === "ride" &&
        dist(node.x, node.y, mouseX, mouseY) < SELECT_RADIUS
      ) {
        editRideSettings(node);
        break;
      }
    }

    return;
  }
  if (creatorMode && !selecting && mouseX > 0 && mouseY > 0 && mouseX < WIDTH && mouseY < HEIGHT) {
    const node = new MapNode("ride", mouseX / WIDTH, mouseY / HEIGHT);
    nodes.push(node);
    if (simMap == null) {
      simMap = new SimMap(nodes, connections);
    }
  }
}

let rideEditorPanel;

function editRideSettings(node) {
  rideEditor = node;
  rideEditorPanel = createDiv();
  rideEditorPanel.class("ride-editor");
  rideEditorPanel.parent(document.body);

  rideEditorPanel.html(`
    <h2>Edit Ride Settings</h2>

    <label>Kategori Wahana</label>
    <select id="rideCategory">
      <option value="umum" ${node.rideCategory === "umum" ? "selected" : ""}>Umum</option>
      <option value="dewasa" ${node.rideCategory === "dewasa" ? "selected" : ""}>Dewasa</option>
      <option value="anak-anak" ${node.rideCategory === "anak-anak" ? "selected" : ""}>Anak-anak</option>
    </select>

    <label>Tipe Antrean</label>
    <select id="isContinuous">
      <option value="false" ${!node.isContinuous ? "selected" : ""}>Standar (Pakai Antrean)</option>
      <option value="true" ${node.isContinuous ? "selected" : ""}>Walk-through (Tanpa Antre)</option>
    </select>

    <label>Jalur Fast Track</label>
    <select id="fastTrack">
      <option value="true" ${node.hasFastTrack ? "selected" : ""}>Ada (Prioritas Didahulukan)</option>
      <option value="false" ${!node.hasFastTrack ? "selected" : ""}>Tidak Ada</option>
    </select>

    <label>Minimal Tinggi Badan (cm)</label>
    <input id="minHeight" type="number" min="0" value="${node.minHeight || 0}">

    <label>Open Time</label>
    <div class="row">
      <input id="openH" type="number" min="0" max="23" value="${node.openHour}">
      <span>:</span>
      <input id="openM" type="number" min="0" max="59" value="${node.openMinute}">
    </div>

    <label>Close Time</label>
    <div class="row">
      <input id="closeH" type="number" min="0" max="23" value="${node.closeHour}">
      <span>:</span>
      <input id="closeM" type="number" min="0" max="59" value="${node.closeMinute}">
    </div>

    <label>Capacity</label>
    <input id="cap" type="number" min="1" value="${node.capacity}">

    <label>Minimum Capacity (To Start)</label>
    <input id="minCap" type="number" min="0" value="${node.minCapacity || 0}">

    <label>Runtime / Max Play Time (min)</label>
    <input id="runtime" type="number" min="1" value="${node.runtime}">

    <label>Max Wait Time (minutes)</label>
    <input id="waitLimit" type="number" min="1" value="${node.waitLimit || 1}">

    <div class="btn-row">
      <button id="saveRide">Save</button>
      <button id="cancelRide">Cancel</button>
    </div>
  `);

  select("#saveRide").mousePressed(applyRideEdit);
  select("#cancelRide").mousePressed(closeRideEditor);
}

function closeRideEditor(){
  if (rideEditorPanel) {
    rideEditorPanel.remove();
  }
  rideEditor = null;
}

function drawRideEditor() {

  push();

  // background blur effect
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  // panel
  fill(30);
  stroke(255);
  strokeWeight(2);
  rect(width/2 - 200, height/2 - 180, 400, 360, 15);

  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(18);
  text("EDIT RIDE SETTINGS", width/2, height/2 - 140);

  textSize(14);
  textAlign(LEFT);

  let x = width/2 - 160;
  let y = height/2 - 110;

  text(`Open: ${rideEditor.openHour}:${rideEditor.openMinute}`, x, y);
  text(`Close: ${rideEditor.closeHour}:${rideEditor.closeMinute}`, x, y+30);
  text(`Capacity: ${rideEditor.capacity}`, x, y+60);
  text(`Runtime: ${rideEditor.runtime} min`, x, y+90);
  text(`Popular: ${rideEditor.isPopular}`, x, y+120);

  // buttons
  drawButton(width/2 - 100, height/2 + 120, 80, 40, "SAVE");
  drawButton(width/2 + 20, height/2 + 120, 80, 40, "CANCEL");

  pop();
}

function drawButton(x,y,w,h,label) {
  fill(70);
  stroke(255);
  rect(x,y,w,h,8);
  fill(255);
  noStroke();
  textAlign(CENTER,CENTER);
  text(label, x+w/2, y+h/2);
}

function applyRideEdit() {
  let n = rideEditor;
  n.rideCategory = select("#rideCategory").value();
  n.isContinuous = select("#isContinuous").value() === "true"; 
  n.hasFastTrack = select("#fastTrack").value() === "true"; 
  n.minHeight = int(select("#minHeight").value()); 

  n.openHour   = int(select("#openH").value());
  n.openMinute = int(select("#openM").value());
  n.closeHour  = int(select("#closeH").value());
  n.closeMinute= int(select("#closeM").value());
  n.capacity   = int(select("#cap").value());
  n.runtime    = int(select("#runtime").value());
  n.waitLimit  = int(select("#waitLimit").value());
  n.minCapacity = int(select("#minCap").value()); 

  n.turnover = Math.max(5, Math.round(n.runtime * 0.3));

  closeRideEditor();
  showNotification("✅ Ride updated successfully!");
}

function showNotification(message) {

  const notif = createDiv(message);
  notif.class("ride-toast");
  notif.parent(document.body);

  // auto remove setelah 2.5 detik
  setTimeout(() => {
    notif.remove();
  }, 2500);
}

function drawRideOverlay(node) {
  const queueTime = node.getQueueTime();
  const maxBarWidth = 40;
  const barHeight = 6;

  let ratio = constrain(queueTime / 60, 0, 1);
  let barWidth = maxBarWidth * ratio;

  let x = node.x - maxBarWidth / 2;
  let y = node.y + 8;

  // Background queue bar
  noStroke();
  fill(0, 0, 0, 120);
  rect(x, y, maxBarWidth, barHeight, 4);

  // Isi bar
  if (!node.isOpen()) {
    fill(120);
  } else if (queueTime < 15) {
    fill("#22c55e");
  } else if (queueTime < 30) {
    fill("#facc15");
  } else {
    fill("#ef4444");
  }
  rect(x, y, barWidth, barHeight, 4);

  // Closed indicator
  if (!node.isOpen()) {
    fill(255, 0, 0);
    textSize(10);
    textAlign(CENTER);
    text("CLOSED", node.x, node.y - ICON_HEIGHT - 5);
  }

}

function toggleEditMode() {

  if (!editMode) {
    resetSim();       
    editMode = true;
    creatorMode = true;
  } else {
    editMode = false;
    creatorMode = false;
  }

}

function checkMap() {
  if (simMap == null || !simMap.checkMap()) {
    alert("Invalid map");
    creatorMode = true;
  } else {
    creatorMode = false;
  }
}

function toggleSim() {
  checkMap();
  isRunning = !isRunning;
}

function resetSim() {
  // reset the frame count
  frameRunning = 0;
  // ===== RESET WAKTU =====
  secondsInSim = 0;
  currentHour = parkOpenHour;
  currentMinute = 0;

  maxRidesRecord = 0;
  minRidesRecord = Infinity;

  isRunning = false;
  agents = [];

  // reset statistics as well
  time = 0;
  timeHist = [];

  totalVisitors = 0;
  totalVisitorsHist = [];

  totalTimeSpent = 0;
  timeSpentHist = [];

  totalTimeQueue = 0;
  timeQueueHist = [];

  totalRides = 0;
  rideHist = [];

  totalAgtsLeft = 0;
  agtsLeftHist = [];
  numExitedAgents = 0;

  averageQueueTime = 0;
  avgQueueTimeHist = [];
  minQueueTimeHist = [];

  globalAgentIDCounter = 0;
  agentExportData = [];


  for (const node of nodes) {
    node.reset();
  }

  generateArrivalSchedule(TOTAL_N);
  
  isRunning = false;
}

function generateArrivalSchedule(n) {
  arrivalSchedule = [];
  let durationHours = gateCloseHour - parkOpenHour; // Misal 18.00 - 10.00 = 8 jam
  
  // Kita ambil sampel dari distribusi gamma
  // t dalam jam (0 sampai durationHours)
  for (let i = 0; i < n; i++) {
    let found = false;
    while (!found) {
      let t = random(0, durationHours);
      let prob = gammaArrival(t); 
      
      // Acceptance-Rejection Sampling yang sudah dioptimasi
      if (random(0, 1) < prob) { 
        arrivalSchedule.push(t * 3600); // Simpan dalam satuan detik simulasi
        found = true;
      }
    }
  }
  
  // Urutkan jadwal kedatangan dari yang paling awal sampai akhir
  arrivalSchedule.sort((a, b) => a - b);
}

function defaultMap() {
  if (creatorMode) createMap();
}

function resetMap() {
  if (creatorMode) {
    rideID = 0;
    simMap = null;
    nodes = [];
    connections = [];
  }
}

function toggleCreate() {
  resetSim();
  creatorMode = !creatorMode;

  if (!creatorMode) checkMap();
}

function toggleStats() {
  showStats = !showStats;
}

// ========================================================
// 🔥 EXPORT CSV (MENGUNDUH 3 FILE DENGAN REKAP HISTORIS) 🔥
// ========================================================
function exportCSV() {
  isRunning = false;

  // ==========================================
  // 1. HITUNG STATISTIK GLOBAL (META DATA)
  // ==========================================
  const exitedVisitors = max(1, numExitedAgents);
  const rawAvgRides = totalRides / exitedVisitors;
  const rawAvgQueue = totalRides > 0 ? (totalTimeQueue / totalRides) : 0;
  const satisfactionScore = calculateSatisfaction(rawAvgRides, rawAvgQueue);

  let avgDailyRho = 0;
  if (globalRhoHistory.length > 0) {
      let sumRho = globalRhoHistory.reduce((a, b) => a + b, 0);
      avgDailyRho = sumRho / globalRhoHistory.length;
  }

  // ==========================================
  // FILE 1: DATA PENGUNJUNG
  // ==========================================
  let tableVisitor = new p5.Table();
  tableVisitor.addColumn("No Pengunjung");
  tableVisitor.addColumn("Jenis");
  tableVisitor.addColumn("Ukuran Grup");
  tableVisitor.addColumn("Min Tinggi (cm)");
  tableVisitor.addColumn("Total Naik");
  tableVisitor.addColumn("Avg Antre Individu (m)"); 
  tableVisitor.addColumn("Durasi Kunjungan (m)"); 
  tableVisitor.addColumn("Jam Masuk");
  tableVisitor.addColumn("Jam Keluar");
  tableVisitor.addColumn("Urutan Wahana (Jam Naik)");
  tableVisitor.addColumn("Waktu Antre Tiap Wahana");

  for (let data of agentExportData) {
      let row = tableVisitor.addRow();
      row.set("No Pengunjung", data.id);
      row.set("Jenis", data.type);
      row.set("Ukuran Grup", data.size);
      row.set("Min Tinggi (cm)", data.minHeight);
      row.set("Total Naik", data.totalRides);
      row.set("Avg Antre Individu (m)", data.individualAvgQueue);
      
      let inParts = data.entryTime.split(':');
      let outParts = data.exitTime.split(':');
      let inMins = (parseInt(inParts[0]) * 60) + parseInt(inParts[1]);
      let outMins = (parseInt(outParts[0]) * 60) + parseInt(outParts[1]);
      row.set("Durasi Kunjungan (m)", outMins - inMins);

      row.set("Jam Masuk", data.entryTime);
      row.set("Jam Keluar", data.exitTime);
      row.set("Urutan Wahana (Jam Naik)", data.rideList);
      row.set("Waktu Antre Tiap Wahana", data.queueList);
  }

  // ==========================================
  // 2. REKAPITULASI HISTORIS UNTUK WAHANA
  // ==========================================
  let rideDailyStats = {};
  for (let ride of simMap.rides) {
      let rName = ride.rideName || ride.name;
      rideDailyStats[rName] = { totalNaik: 0, sumQueue: 0, maxQueue: 0 };
  }

  // Membaca buku harian setiap agen untuk mencari tahu jumlah riil per wahana
  for (let data of agentExportData) {
      let qStr = data.queueList;
      if (!qStr || qStr === "-") continue;
      
      let groupSize = data.size || 1;
      let ridesTaken = qStr.split(" | ");
      
      for (let item of ridesTaken) {
          let parts = item.split(":");
          if (parts.length === 2) {
              let rName = parts[0].trim();
              let qMins = parseFloat(parts[1].replace("m", "").trim());
              
              if (rideDailyStats[rName]) {
                  rideDailyStats[rName].totalNaik += groupSize;
                  rideDailyStats[rName].sumQueue += (qMins * groupSize);
                  if (qMins > rideDailyStats[rName].maxQueue) {
                      rideDailyStats[rName].maxQueue = qMins;
                  }
              }
          }
      }
  }

  // ==========================================
  // FILE 2: DATA WAHANA (AKURAT HARIAN)
  // ==========================================
  let tableRide = new p5.Table();
  tableRide.addColumn("Nama Wahana");
  tableRide.addColumn("Zona");
  tableRide.addColumn("Kategori");
  tableRide.addColumn("Kapasitas");
  tableRide.addColumn("Runtime (m)");
  tableRide.addColumn("Has FastTrack");
  tableRide.addColumn("Total Pengunjung Naik");
  tableRide.addColumn("Avg Antre (m)");
  tableRide.addColumn("Max Antre (m)");
  tableRide.addColumn("rho");
  tableRide.addColumn("Lq");
  tableRide.addColumn("W (m)");
  tableRide.addColumn("Status");

  for (let ride of simMap.rides) {
      let rName = ride.rideName || ride.name;
      let stats = rideDailyStats[rName];
      let row = tableRide.addRow();

      let totalNaik = stats.totalNaik;
      let avgQ = totalNaik > 0 ? (stats.sumQueue / totalNaik) : 0;
      let maxQ = stats.maxQueue;

      // Hitung Lama Waktu Operasional Wahana (dalam menit)
      let openMins = (ride.openHour || 10) * 60 + (ride.openMinute || 0);
      let closeMins = (ride.closeHour || 18) * 60 + (ride.closeMinute || 45);
      let opMins = Math.max(1, closeMins - openMins);

      // Kalkulasi M/M/1 Rata-Rata Harian
      let lambda = totalNaik / opMins; // Kedatangan per menit
      let cycleTime = (ride.runtime || 5) + (ride.turnover || 2);
      let mu = ride.capacity / cycleTime; // Pelayanan per menit
      
      if (ride.isContinuous) {
          mu = ride.capacity / (ride.interval || 1); // Penyesuaian untuk sistem kontinyu
      }

      let rho = mu > 0 ? (lambda / mu) : 0;
      let wTime = avgQ; // Waktu tunggu rata-rata harian yang nyata dialami agen
      let Lq = lambda * wTime; // Menggunakan Hukum Little: Lq = lambda * W

      // Penentuan Status
      let status = "Optimal";
      if (rho >= 1.0) status = "Kritis";
      else if (rho >= 0.85) status = "Sibuk";
      else if (rho >= 0.65) status = "Moderat";

      row.set("Nama Wahana", rName);
      row.set("Zona", ride.zone || 0);
      row.set("Kategori", ride.rideCategory || "umum");
      row.set("Kapasitas", ride.capacity);
      row.set("Runtime (m)", ride.runtime);
      row.set("Has FastTrack", ride.hasFastTrack ? "Ya" : "Tidak");
      
      // Matriks Hasil Ekstraksi
      row.set("Total Pengunjung Naik", totalNaik);
      row.set("Avg Antre (m)", avgQ.toFixed(2));
      row.set("Max Antre (m)", maxQ.toFixed(2));
      row.set("rho", rho.toFixed(3));
      row.set("Lq", Lq.toFixed(2));
      row.set("W (m)", wTime.toFixed(2));
      row.set("Status", status);
  }

  // ==========================================
  // FILE 3: DATA META (Untuk KPI Header)
  // ==========================================
  // Hitung Avg Lq, Lq Maks, Avg Wq dari data wahana
  let sumLq = 0, maxLq = 0, sumWq = 0, rideCount = 0;
  for (let ride of simMap.rides) {
      let rName = ride.rideName || ride.name;
      let stats = rideDailyStats[rName];
      if (!stats) continue;
      let totalNaik = stats.totalNaik || 0;
      let openMins = (ride.openHour || 10) * 60 + (ride.openMinute || 0);
      let closeMins = (ride.closeHour || 18) * 60 + (ride.closeMinute || 45);
      let opMins = Math.max(1, closeMins - openMins);
      let lambda = totalNaik / opMins;
      let avgQ = totalNaik > 0 ? (stats.sumQueue / totalNaik) : 0;
      let lq = lambda * avgQ;
      sumLq += lq;
      if (lq > maxLq) maxLq = lq;
      sumWq += avgQ;
      rideCount++;
  }
  let avgLq = rideCount > 0 ? sumLq / rideCount : 0;
  let avgWq = rideCount > 0 ? sumWq / rideCount : 0;

  let tableMeta = new p5.Table();
  tableMeta.addColumn("Total Pengunjung");
  tableMeta.addColumn("Avg Rides");
  tableMeta.addColumn("Avg Queue Global (m)");
  tableMeta.addColumn("Avg Wq (m)");
  tableMeta.addColumn("Avg Lq");
  tableMeta.addColumn("Lq Maks");
  tableMeta.addColumn("Satisfaction Score (%)");
  tableMeta.addColumn("Global Rho");
  tableMeta.addColumn("Total Batal Masuk");

  let rowMeta = tableMeta.addRow();
  rowMeta.set("Total Pengunjung", totalVisitors);
  rowMeta.set("Avg Rides", rawAvgRides.toFixed(2));
  rowMeta.set("Avg Queue Global (m)", rawAvgQueue.toFixed(2));
  rowMeta.set("Avg Wq (m)", avgWq.toFixed(3));
  rowMeta.set("Avg Lq", avgLq.toFixed(3));
  rowMeta.set("Lq Maks", maxLq.toFixed(3));
  rowMeta.set("Satisfaction Score (%)", satisfactionScore);
  rowMeta.set("Global Rho", avgDailyRho.toFixed(3));
  rowMeta.set("Total Batal Masuk", totalAgtsLeft);

  // ==========================================
  // UNDUH KE-3 FILE SECARA OTOMATIS
  // ==========================================
  let ts = Math.floor(Date.now() / 1000);
  
  save(tableVisitor, `Data_Pengunjung_Dufan_${ts}.csv`);
  
  setTimeout(() => {
      save(tableRide, `Data_Wahana_Dufan_${ts}.csv`);
  }, 500); 
  
  setTimeout(() => {
      save(tableMeta, `Data_Meta_Dufan_${ts}.csv`);
  }, 1000); 
}

function drawDisplay() {
  for (let node of nodes) {
    if (dist(node.x, node.y, mouseX, mouseY) < HOVER_RADIUS && node.type === "ride") {
      const padding = 16;
      const info = node.getDisplayInfo();
      
      textSize(12);
      textLeading(18);
      const lines = info.split("\n").length;
      const textHeight = lines * 18;

      // Dimensi dari utility.js (RG_X_END - RG_X_START)
      const graphW = 100;
      const graphH = 50; 
      
      const headerHeight = 35;
      const w = 270;
      const h = headerHeight + textHeight + graphH + padding * 2 + 10;

      // 🔥 KUNCI POSISI DI POJOK KIRI ATAS (Di bawah tombol Toggle Panel)
      const x = 20;
      const y = 70;

      push();
      // ===== SHADOW =====
      noStroke();
      fill(0, 0, 0, 120);
      rect(x + 5, y + 5, w, h, 12);

      // ===== GLASS PANEL =====
      fill(20, 22, 28, 240);
      stroke(255, 255, 255, 30);
      strokeWeight(1);
      rect(x, y, w, h, 12);

      // ===== HEADER =====
      const isOpen = node.isOpen();
      const accent = isOpen ? color(34, 197, 94) : color(239, 68, 68);

      fill(red(accent), green(accent), blue(accent), 40);
      noStroke();
      rect(x, y, w, headerHeight, 12, 12, 0, 0);

      fill(255);
      textSize(13);
      textStyle(BOLD);
      textAlign(LEFT, CENTER);
      text(node.rideName || node.name, x + padding, y + headerHeight/2);

      textSize(11);
      textAlign(RIGHT, CENTER);
      fill(accent);
      text(isOpen ? "● OPEN" : "● CLOSED", x + w - padding, y + headerHeight/2);

      // ===== BODY TEXT =====
      textAlign(LEFT, TOP);
      fill(220);
      textSize(12);
      textStyle(NORMAL);
      text(info, x + padding, y + headerHeight + 10);

      // ===== GRAPH SECTION =====
      const graphX = x + (w - graphW) / 2; 
      const graphY = y + headerHeight + textHeight + 15;
      
      fill(15, 15, 20, 150);
      noStroke();
      rect(graphX - 10, graphY - 10, graphW + 20, graphH + 20, 8);

      push();
      translate(graphX - RG_X_START, graphY - RG_Y_START); 
      node.drawGraph();
      pop();

      pop();
      break;
    }
  }
}

function drawRunning() {
  strokeWeight(0.5);
  stroke(0);
  if (isRunning) {
    fill("#2a1");
    triangle(10, 7.5, 20, 15, 10, 22.5);
  } else {
    fill("#f08205");
    rect(8, 7.5, 5, 15);
    rect(16, 7.5, 5, 15);
  }
}

function drawStats() {
  const panelW = 1240;
  const panelH = 215;
  const panelX = (WIDTH - panelW) / 2;
  const panelY = HEIGHT - panelH - 2;

  // ===== DATA CALCULATIONS =====
  // currentVisitors = orang yang benar-benar ada di dalam taman saat ini
  // Exclude: ENTERING (belum masuk), LEFT (batal), EXITED (sudah keluar), isSplitPart (pecahan grup, sudah dihitung dari induk)
  let currentVisitors = 0;
  for (let agt of agents) {
    if (
      !agt.isSplitPart &&
      agt.agentState !== AgentStates.LEFT &&
      agt.agentState !== AgentStates.EXITED &&
      agt.agentState !== AgentStates.ENTERING
    ) {
      currentVisitors += (agt.size || 0);
    }
  }
  const exitedVisitors = max(1, numExitedAgents);
  const rawAvgRides = totalRides / exitedVisitors;
  const rawAvgQueue = totalRides > 0 ? (totalTimeQueue / totalRides) : 0;
  const avgRides = rawAvgRides.toFixed(2);
  const avgQueue = rawAvgQueue.toFixed(2);
  const satisfactionScore = calculateSatisfaction(rawAvgRides, rawAvgQueue);
  const displayMinRides = minRidesRecord === Infinity ? 0 : minRidesRecord;

  // ==========================================================
  // 🔥 PERHITUNGAN RHO GLOBAL UNTUK DITAMPILKAN DI KARTU 🔥
  // ==========================================================
  let currentGlobalRho = 0;
  let avgDailyRho = 0;
  
  // 1. Ambil Rho Real-Time saat ini
  let macroMetrics = getGlobalQueueMetrics(simMap);
  if (macroMetrics) {
      currentGlobalRho = macroMetrics.globalRho;
  }
  
  // 2. Ambil Rata-rata Rho Harian (Kumulatif)
  if (globalRhoHistory.length > 0) {
      let sumRho = globalRhoHistory.reduce((a, b) => a + b, 0);
      avgDailyRho = sumRho / globalRhoHistory.length;
  }
  // ==========================================================

  push();

  // ===== PANEL BASE =====
  // Outer glow
  noStroke();
  fill(30, 100, 200, 18);
  rect(panelX - 4, panelY - 4, panelW + 8, panelH + 8, 22);

  // Main panel bg
  fill(5, 10, 22, 235);
  stroke(56, 140, 255, 50);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 18);

  // Blueprint grid inside panel (subtle)
  stroke(30, 70, 160, 22);
  strokeWeight(0.5);
  for (let gx = panelX + 20; gx < panelX + panelW; gx += 20) {
    line(gx, panelY, gx, panelY + panelH);
  }
  for (let gy = panelY + 10; gy < panelY + panelH; gy += 20) {
    line(panelX, gy, panelX + panelW, gy);
  }

  // Top accent bar with gradient feel
  noStroke();
  fill(56, 140, 255, 60);
  rect(panelX, panelY, panelW, 3, 18, 18, 0, 0);

  // Corner brackets (blueprint style)
  stroke(56, 189, 248, 80);
  strokeWeight(1.5);
  noFill();
  const bk = 12; // bracket size
  // top-left
  line(panelX + 1, panelY + bk + 3, panelX + 1, panelY + 3);
  line(panelX + 1, panelY + 3, panelX + bk + 1, panelY + 3);
  // top-right
  line(panelX + panelW - bk - 1, panelY + 3, panelX + panelW - 1, panelY + 3);
  line(panelX + panelW - 1, panelY + 3, panelX + panelW - 1, panelY + bk + 3);
  // bottom-left
  line(panelX + 1, panelY + panelH - bk - 3, panelX + 1, panelY + panelH - 3);
  line(panelX + 1, panelY + panelH - 3, panelX + bk + 1, panelY + panelH - 3);
  // bottom-right
  line(panelX + panelW - bk - 1, panelY + panelH - 3, panelX + panelW - 1, panelY + panelH - 3);
  line(panelX + panelW - 1, panelY + panelH - 3, panelX + panelW - 1, panelY + panelH - bk - 3);

  // ===== HEADER LABEL =====
  noStroke();
  fill(56, 189, 248, 200);
  textAlign(LEFT, TOP);
  textSize(8);
  textStyle(BOLD);
  text("▸ PARK GLOBAL STATISTICS", panelX + 18, panelY + 10);

  // Vertical separator line between cards and graphs
  const sepX = panelX + panelW - 400;
  stroke(56, 140, 255, 35);
  strokeWeight(1);
  drawingContext.setLineDash([4, 4]);
  line(sepX, panelY + 18, sepX, panelY + panelH - 10);
  drawingContext.setLineDash([]);

  pop();

  // ===== STAT CARDS =====
  const cardW = 120;
  const cardH = 160;
  const gapX = 10;
  const totalCardsW = cardW * 8 + gapX * 7;
  const cardsAreaW = panelW - 420;
  const startX = panelX + 14;
  const cardY = panelY + 24;

  // Cards use fixed spacing to fit 8 across left zone
  const compactW = floor((cardsAreaW - gapX * 7) / 8);

  let liveRhoText = `(LIVE: ${(currentGlobalRho*100).toFixed(0)}%)`;

  drawStatCard("TOTAL\nVISITORS",  totalVisitors,             "👥", color(56,189,248),   startX + (compactW+gapX)*0, cardY, compactW, cardH);
  drawStatCard("IN\nPARK NOW",     currentVisitors,           "🏃", color(34,197,94),    startX + (compactW+gapX)*1, cardY, compactW, cardH);
  drawStatCard(`AVG RHO\n${liveRhoText}`, (avgDailyRho*100).toFixed(1) + "%", "📈", color(245, 158, 11), startX + (compactW+gapX)*2, cardY, compactW, cardH);
  drawStatCard("MIN\nRIDES",       displayMinRides,           "🔽", color(148,163,184),  startX + (compactW+gapX)*3, cardY, compactW, cardH);
  drawStatCard("AVG\nRIDES",       avgRides,                  "🎢", color(56,189,248),   startX + (compactW+gapX)*4, cardY, compactW, cardH);
  drawStatCard("MAX\nRIDES",       maxRidesRecord,            "🔝", color(250,204,21),   startX + (compactW+gapX)*5, cardY, compactW, cardH);
  drawStatCard("AVG QUEUE\n(min)", avgQueue,                  "⏱", color(249,115,22),   startX + (compactW+gapX)*6, cardY, compactW, cardH);
  drawStatCard("SATISFACTION",     satisfactionScore + "%",   "⭐", color(34,197,94),    startX + (compactW+gapX)*7, cardY, compactW, cardH);

  // ===== GRAPHS (right zone) =====
  const graphZoneX = sepX + 16;
  const graphZoneW = panelX + panelW - graphZoneX - 16;
  const graphW3 = floor((graphZoneW - 30) / 3);
  const graphBaseY = panelY + panelH - 16;

  drawGraphModern("Time in Park",   timeSpentHist,   graphZoneX,                    graphBaseY, 30,  graphW3, 60);
  drawGraphModern("Missed Frac.",   agtsLeftHist,    graphZoneX + graphW3 + 15,     graphBaseY, 1,   graphW3, 60);
  drawGraphModern("Avg Queue (m)",  avgQueueTimeHist, graphZoneX + (graphW3+15)*2,   graphBaseY, 10, graphW3, 60);
}

function drawStatCard(title, value, icon, accentCol, x, y, w, h) {
  push();

  // Shadow
  noStroke();
  fill(0, 0, 0, 80);
  rect(x + 3, y + 3, w, h, 10);

  // Card background
  fill(8, 16, 34, 230);
  stroke(red(accentCol), green(accentCol), blue(accentCol), 45);
  strokeWeight(1);
  rect(x, y, w, h, 10);

  // Top accent line
  noStroke();
  fill(red(accentCol), green(accentCol), blue(accentCol), 160);
  rect(x, y, w, 2, 10, 10, 0, 0);

  // Subtle inner glow at top
  fill(red(accentCol), green(accentCol), blue(accentCol), 12);
  noStroke();
  rect(x, y, w, h * 0.45, 10, 10, 0, 0);

  // Icon
  textAlign(CENTER, TOP);
  textStyle(NORMAL);
  textSize(18);
  noStroke();
  fill(255);
  text(icon, x + w / 2, y + 10);

  // Title (multi-line friendly with \n)
  fill(red(accentCol), green(accentCol), blue(accentCol), 180);
  textSize(8);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  textLeading(10);
  // Replace \n with actual newline
  text(title, x + w / 2, y + 32);

  // Value
  noStroke();
  fill(230, 240, 255);
  textStyle(BOLD);
  textSize(str(value).length > 5 ? 16 : 20);
  textAlign(CENTER, BOTTOM);
  text(value, x + w / 2, y + h - 8);

  pop();
}

function drawGraphModern(title, data, x, y, defMax, gW = GG_WIDTH, gH = GG_HEIGHT) {
  const maxHist = max(defMax, int(ceil(max(data.length > 0 ? data : [defMax]))));
  const minHist = 0;

  push();

  // Background box
  noStroke();
  fill(4, 10, 24, 200);
  stroke(56, 140, 255, 30);
  strokeWeight(1);
  rect(x - 8, y - gH - 22, gW + 16, gH + 30, 8);

  // Blueprint grid inside graph
  stroke(30, 70, 160, 30);
  strokeWeight(0.5);
  for (let i = 1; i <= 3; i++) {
    let gy = y - (gH / 4) * i;
    drawingContext.setLineDash([3, 3]);
    line(x, gy, x + gW, gy);
  }
  drawingContext.setLineDash([]);

  // Axes
  stroke(56, 140, 255, 60);
  strokeWeight(1);
  line(x, y, x, y - gH);
  line(x, y, x + gW, y);

  // Y-axis max label
  noStroke();
  fill(56, 189, 248, 120);
  textSize(7);
  textAlign(RIGHT, CENTER);
  text(maxHist, x - 3, y - gH);

  // Zero label
  fill(56, 189, 248, 80);
  text("0", x - 3, y);

  // Area fill under graph line
  if (data.length > 1) {
    noStroke();
    fill(56, 189, 248, 18);
    beginShape();
    vertex(x, y);
    for (let cnt = 0; cnt < MAX_AGT_SAMPLES; cnt++) {
      let i = cnt + max(data.length - MAX_AGT_SAMPLES, 0);
      if (i < data.length) {
        const xtick = (gW / MAX_AGT_SAMPLES) * cnt + x;
        const ytick = y - (gH / max(maxHist - minHist, 0.001)) * (data[i] - minHist);
        vertex(xtick, ytick);
      }
    }
    vertex(x + gW, y);
    endShape(CLOSE);

    // Graph line — glowing style
    noFill();
    // glow pass
    stroke(56, 189, 248, 40);
    strokeWeight(4);
    beginShape();
    for (let cnt = 0; cnt < MAX_AGT_SAMPLES; cnt++) {
      let i = cnt + max(data.length - MAX_AGT_SAMPLES, 0);
      if (i < data.length) {
        const xtick = (gW / MAX_AGT_SAMPLES) * cnt + x;
        const ytick = y - (gH / max(maxHist - minHist, 0.001)) * (data[i] - minHist);
        vertex(xtick, ytick);
      }
    }
    endShape();
    // sharp line
    stroke(100, 200, 255, 220);
    strokeWeight(1.5);
    beginShape();
    for (let cnt = 0; cnt < MAX_AGT_SAMPLES; cnt++) {
      let i = cnt + max(data.length - MAX_AGT_SAMPLES, 0);
      if (i < data.length) {
        const xtick = (gW / MAX_AGT_SAMPLES) * cnt + x;
        const ytick = y - (gH / max(maxHist - minHist, 0.001)) * (data[i] - minHist);
        vertex(xtick, ytick);
      }
    }
    endShape();
  }

  // Title
  noStroke();
  fill(56, 189, 248, 190);
  textSize(8);
  textStyle(BOLD);
  textAlign(CENTER, BOTTOM);
  text(title.toUpperCase(), x + gW / 2, y - gH - 8);

  pop();
}

function createMap() {
  // reset the rideID
  rideID = 0;

  // Generated using Multidimensional Scaling (MDS) from CORRECTED distance matrix
  let e = new MapNode("entrance", 0.134, 0.894);
  let n1 = new MapNode("ride", 0.366, 0.899); // Kereta Misteri
  let n2 = new MapNode("ride", 0.351, 0.826); // Turangga-Rangga
  let n3 = new MapNode("ride", 0.619, 0.224); // Pontang Pontang
  let n4 = new MapNode("ride", 0.050, 0.458); // Paralayang
  let n5 = new MapNode("ride", 0.060, 0.428); // Karavel
  let n6 = new MapNode("ride", 0.134, 0.331); // Kolibri
  let n7 = new MapNode("ride", 0.384, 0.561); // Ice Age
  let n8 = new MapNode("ride", 0.116, 0.334); // Turbo Drop
  let n9 = new MapNode("ride", 0.183, 0.272); // Baling-Baling
  let n10 = new MapNode("ride", 0.387, 0.588); // Kontiki
  let n11 = new MapNode("ride", 0.172, 0.355); // Zig Zag
  let n12 = new MapNode("ride", 0.373, 0.564); // Dream Playground
  let n13 = new MapNode("ride", 0.369, 0.430); // Galactica
  let n14 = new MapNode("ride", 0.109, 0.593); // Ontang Anting
  let n15 = new MapNode("junc", 0.406, 0.571); // Pintu Masuk Dream Playground
  let n16 = new MapNode("ride", 0.578, 0.264); // Mowgli's Jungle Race
  let n17 = new MapNode("ride", 0.383, 0.208); // Arung jeram
  let n18 = new MapNode("ride", 0.507, 0.143); // Burung Tempur
  let n19 = new MapNode("ride", 0.609, 0.050); // Halilintar
  let n20 = new MapNode("ride", 0.619, 0.278); // Ombang Ombang
  let n21 = new MapNode("ride", 0.775, 0.199); // Baku Toki
  let n22 = new MapNode("ride", 0.742, 0.308); // Gajah Bledug
  let n23 = new MapNode("ride", 0.777, 0.368); // Kora-Kora
  let n24 = new MapNode("ride", 0.766, 0.451); // Hysteria
  let n25 = new MapNode("ride", 0.424, 0.691); // Happy Family The Ride
  let n26 = new MapNode("ride", 0.774, 0.522); // Biang Lala
  n26.name = "Biang Lala";
  let n27 = new MapNode("ride", 0.751, 0.756); // Alap-Alap
  let n28 = new MapNode("ride", 0.716, 0.789); // Tornado
  let n29 = new MapNode("ride", 0.517, 0.891); // Rumah Riana
  let n30 = new MapNode("ride", 0.546, 0.950); // Niagara-Gara
  let n31 = new MapNode("ride", 0.908, 0.921); // Rumah Miring
  let n32 = new MapNode("ride", 0.822, 0.826); // Poci-Poci
  let n33 = new MapNode("ride", 0.950, 0.801); // Istana Boneka

  // ==============================================================
  // KONFIGURASI PARAMETER WAHANA BERDASARKAN DATA EXCEL (DEFAULT)
  // ==============================================================
  
  // ZONA 1 (Area Depan & Kiri Bawah)
  n1.zone = 1; n1.rideCategory = "dewasa"; n1.isContinuous = false; n1.hasFastTrack = false; n1.minHeight = 125;
  n1.openHour = 10; n1.openMinute = 0; n1.closeHour = 18; n1.closeMinute = 45;
  n1.capacity = 16; n1.minCapacity = 8; n1.runtime = 4.0; n1.isPopular = true;
  n1.turnover = Math.max(5, Math.round(n1.runtime * 0.3));

  n2.zone = 1; n2.rideCategory = "umum"; n2.isContinuous = false; n2.hasFastTrack = true; n2.minHeight = 0;
  n2.openHour = 10; n2.openMinute = 0; n2.closeHour = 18; n2.closeMinute = 45;
  n2.capacity = 40; n2.minCapacity = 10; n2.runtime = 5.0; n2.isPopular = false;
  n2.turnover = Math.max(5, Math.round(n2.runtime * 0.3));

  n4.zone = 1; n4.rideCategory = "dewasa"; n4.isContinuous = false; n4.hasFastTrack = false; n4.minHeight = 100;
  n4.openHour = 10; n4.openMinute = 0; n4.closeHour = 18; n4.closeMinute = 45;
  n4.capacity = 16; n4.minCapacity = 8; n4.runtime = 5.0; n4.isPopular = false;
  n4.turnover = Math.max(5, Math.round(n4.runtime * 0.3));

  n5.zone = 1; n5.rideCategory = "anak-anak"; n5.isContinuous = false; n5.hasFastTrack = false; n5.minHeight = 100;
  n5.openHour = 10; n5.openMinute = 0; n5.closeHour = 18; n5.closeMinute = 45;
  n5.capacity = 24; n5.minCapacity = 6; n5.runtime = 5.0; n5.isPopular = false;
  n5.turnover = Math.max(5, Math.round(n5.runtime * 0.3));

  n6.zone = 1; n6.rideCategory = "anak-anak"; n6.isContinuous = false; n6.hasFastTrack = false; n6.minHeight = 100;
  n6.openHour = 10; n6.openMinute = 0; n6.closeHour = 18; n6.closeMinute = 45;
  n6.capacity = 28; n6.minCapacity = 7; n6.runtime = 4.5; n6.isPopular = false;
  n6.turnover = Math.max(5, Math.round(n6.runtime * 0.3));

  n8.zone = 1; n8.rideCategory = "anak-anak"; n8.isContinuous = false; n8.hasFastTrack = false; n8.minHeight = 100;
  n8.openHour = 10; n8.openMinute = 0; n8.closeHour = 18; n8.closeMinute = 45;
  n8.capacity = 8; n8.minCapacity = 4; n8.runtime = 2.0; n8.isPopular = false;
  n8.turnover = Math.max(5, Math.round(n8.runtime * 0.3));

  n9.zone = 1; n9.rideCategory = "dewasa"; n9.isContinuous = false; n9.hasFastTrack = true; n9.minHeight = 145;
  n9.openHour = 10; n9.openMinute = 0; n9.closeHour = 18; n9.closeMinute = 45;
  n9.capacity = 30; n9.minCapacity = 15; n9.runtime = 3.0; n9.isPopular = true;
  n9.turnover = Math.max(5, Math.round(n9.runtime * 0.3));

  n11.zone = 1; n11.rideCategory = "dewasa"; n11.isContinuous = false; n11.hasFastTrack = true; n11.minHeight = 125;
  n11.openHour = 10; n11.openMinute = 0; n11.closeHour = 18; n11.closeMinute = 45;
  n11.capacity = 32; n11.minCapacity = 8; n11.runtime = 2.0; n11.isPopular = true;
  n11.turnover = Math.max(5, Math.round(n11.runtime * 0.3));

  n14.zone = 1; n14.rideCategory = "dewasa"; n14.isContinuous = false; n14.hasFastTrack = true; n14.minHeight = 100;
  n14.openHour = 10; n14.openMinute = 0; n14.closeHour = 18; n14.closeMinute = 45;
  n14.capacity = 56; n14.minCapacity = 28; n14.runtime = 2.0; n14.isPopular = true;
  n14.turnover = Math.max(5, Math.round(n14.runtime * 0.3));

  // ZONA 2 (Area Kiri Atas & Tengah)
  n7.zone = 2; n7.rideCategory = "dewasa"; n7.isContinuous = false; n7.hasFastTrack = true; n7.minHeight = 110;
  n7.openHour = 12; n7.openMinute = 0; n7.closeHour = 18; n7.closeMinute = 45;
  n7.capacity = 20; n7.minCapacity = 10; n7.runtime = 15.0; n7.isPopular = true;
  n7.turnover = Math.max(5, Math.round(n7.runtime * 0.3));

  n10.zone = 2; n10.rideCategory = "dewasa"; n10.isContinuous = false; n10.hasFastTrack = false; n10.minHeight = 100;
  n10.openHour = 10; n10.openMinute = 0; n10.closeHour = 18; n10.closeMinute = 45;
  n10.capacity = 18; n10.minCapacity = 9; n10.runtime = 1.5; n10.isPopular = false;
  n10.turnover = Math.max(5, Math.round(n10.runtime * 0.3));

  n12.zone = 2; n12.rideCategory = "anak-anak"; n12.isContinuous = true; n12.hasFastTrack = false; n12.minHeight = 125;
  n12.openHour = 10; n12.openMinute = 0; n12.closeHour = 18; n12.closeMinute = 45;
  n12.capacity = 250; n12.minCapacity = 1; n12.runtime = 60.0; n12.isPopular = false;
  n12.turnover = Math.max(5, Math.round(n12.runtime * 0.3));

  n13.zone = 2; n13.rideCategory = "dewasa"; n13.isContinuous = false; n13.hasFastTrack = false; n13.minHeight = 100;
  n13.openHour = 10; n13.openMinute = 0; n13.closeHour = 18; n13.closeMinute = 45;
  n13.capacity = 8; n13.minCapacity = 2; n13.runtime = 6.0; n13.isPopular = false;
  n13.turnover = Math.max(5, Math.round(n13.runtime * 0.3));

  // n15 (Pintu Masuk Dream Playground) adalah persimpangan (Junction), dilewati.

  n25.zone = 2; n25.rideCategory = "umum"; n25.isContinuous = false; n25.hasFastTrack = false; n25.minHeight = 100;
  n25.openHour = 11; n25.openMinute = 0; n25.closeHour = 18; n25.closeMinute = 45;
  n25.capacity = 40; n25.minCapacity = 10; n25.runtime = 4.0; n25.isPopular = false;
  n25.turnover = Math.max(5, Math.round(n25.runtime * 0.3));

  n29.zone = 2; n29.rideCategory = "dewasa"; n29.isContinuous = false; n29.hasFastTrack = false; n29.minHeight = 110;
  n29.openHour = 11; n29.openMinute = 0; n29.closeHour = 18; n29.closeMinute = 45;
  n29.capacity = 6; n29.minCapacity = 4; n29.runtime = 15.0; n29.isPopular = false;
  n29.turnover = Math.max(5, Math.round(n29.runtime * 0.3));

  n30.zone = 2; n30.rideCategory = "dewasa"; n30.isContinuous = false; n30.hasFastTrack = true; n30.minHeight = 125;
  n30.openHour = 10; n30.openMinute = 0; n30.closeHour = 18; n30.closeMinute = 45;
  n30.capacity = 4; n30.minCapacity = 3; n30.runtime = 4.5; n30.isPopular = true;
  n30.turnover = Math.max(5, Math.round(n30.runtime * 0.3));

  // ZONA 3 (Area Kanan Atas & Pinggir)
  n24.zone = 3; n24.rideCategory = "dewasa"; n24.isContinuous = false; n24.hasFastTrack = true; n24.minHeight = 145;
  n24.openHour = 10; n24.openMinute = 0; n24.closeHour = 18; n24.closeMinute = 45;
  n24.capacity = 12; n24.minCapacity = 6; n24.runtime = 1.0; n24.isPopular = true;
  n24.turnover = Math.max(5, Math.round(n24.runtime * 0.3));

  n26.zone = 3; n26.rideCategory = "dewasa"; n26.isContinuous = false; n26.hasFastTrack = true; n26.minHeight = 0;
  n26.openHour = 10; n26.openMinute = 0; n26.closeHour = 18; n26.closeMinute = 45;
  n26.capacity = 4; n26.minCapacity = 4; n26.runtime = 20.0; n26.isPopular = true;
  n26.turnover = Math.max(5, Math.round(n26.runtime * 0.3));

  n27.zone = 3; n27.rideCategory = "dewasa"; n27.isContinuous = false; n27.hasFastTrack = true; n27.minHeight = 100;
  n27.openHour = 10; n27.openMinute = 0; n27.closeHour = 18; n27.closeMinute = 45;
  n27.capacity = 28; n27.minCapacity = 14; n27.runtime = 1.5; n27.isPopular = true;
  n27.turnover = Math.max(5, Math.round(n27.runtime * 0.3));

  n28.zone = 3; n28.rideCategory = "dewasa"; n28.isContinuous = false; n28.hasFastTrack = true; n28.minHeight = 145;
  n28.openHour = 10; n28.openMinute = 0; n28.closeHour = 18; n28.closeMinute = 45;
  n28.capacity = 40; n28.minCapacity = 20; n28.runtime = 3.0; n28.isPopular = true;
  n28.turnover = Math.max(5, Math.round(n28.runtime * 0.3));

  n31.zone = 3; n31.rideCategory = "umum"; n31.isContinuous = true; n31.hasFastTrack = false; n31.minHeight = 0;
  n31.openHour = 10; n31.openMinute = 0; n31.closeHour = 18; n31.closeMinute = 45;
  n31.capacity = 4; n31.minCapacity = 1; n31.runtime = 2.0; n31.isPopular = false;
  n31.turnover = Math.max(5, Math.round(n31.runtime * 0.3));

  n32.zone = 3; n32.rideCategory = "anak-anak"; n32.isContinuous = false; n32.hasFastTrack = false; n32.minHeight = 100;
  n32.openHour = 10; n32.openMinute = 0; n32.closeHour = 18; n32.closeMinute = 45;
  n32.capacity = 36; n32.minCapacity = 9; n32.runtime = 3.0; n32.isPopular = false;
  n32.turnover = Math.max(5, Math.round(n32.runtime * 0.3));

  n33.zone = 3; n33.rideCategory = "umum"; n33.isContinuous = false; n33.hasFastTrack = true; n33.minHeight = 0;
  n33.openHour = 10; n33.openMinute = 0; n33.closeHour = 18; n33.closeMinute = 45;
  n33.capacity = 60; n33.minCapacity = 6; n33.runtime = 20.0; n33.isPopular = true;
  n33.turnover = Math.max(5, Math.round(n33.runtime * 0.3));

  // ZONA 4 (Area Kanan Bawah)
  n3.zone = 4; n3.rideCategory = "anak-anak"; n3.isContinuous = false; n3.hasFastTrack = false; n3.minHeight = 125;
  n3.openHour = 10; n3.openMinute = 0; n3.closeHour = 18; n3.closeMinute = 45;
  n3.capacity = 24; n3.minCapacity = 6; n3.runtime = 7.0; n3.isPopular = false;
  n3.turnover = Math.max(5, Math.round(n3.runtime * 0.3));

  n16.zone = 4; n16.rideCategory = "umum"; n16.isContinuous = false; n16.hasFastTrack = false; n16.minHeight = 100;
  n16.openHour = 12; n16.openMinute = 0; n16.closeHour = 20; n16.closeMinute = 0;
  n16.capacity = 40; n16.minCapacity = 10; n16.runtime = 3.0; n16.isPopular = false;
  n16.turnover = Math.max(5, Math.round(n16.runtime * 0.3));

  n17.zone = 4; n17.rideCategory = "dewasa"; n17.isContinuous = false; n17.hasFastTrack = true; n17.minHeight = 110;
  n17.openHour = 10; n17.openMinute = 0; n17.closeHour = 18; n17.closeMinute = 45;
  n17.capacity = 8; n17.minCapacity = 6; n17.runtime = 2.0; n17.isPopular = true;
  n17.turnover = Math.max(5, Math.round(n17.runtime * 0.3));

  n18.zone = 4; n18.rideCategory = "anak-anak"; n18.isContinuous = false; n18.hasFastTrack = false; n18.minHeight = 100;
  n18.openHour = 10; n18.openMinute = 0; n18.closeHour = 18; n18.closeMinute = 45;
  n18.capacity = 28; n18.minCapacity = 7; n18.runtime = 4.0; n18.isPopular = false;
  n18.turnover = Math.max(5, Math.round(n18.runtime * 0.3));

  n19.zone = 4; n19.rideCategory = "dewasa"; n19.isContinuous = false; n19.hasFastTrack = true; n19.minHeight = 125;
  n19.openHour = 10; n19.openMinute = 0; n19.closeHour = 18; n19.closeMinute = 45;
  n19.capacity = 24; n19.minCapacity = 12; n19.runtime = 2.0; n19.isPopular = true;
  n19.turnover = Math.max(5, Math.round(n19.runtime * 0.3));

  n20.zone = 4; n20.rideCategory = "dewasa"; n20.isContinuous = false; n20.hasFastTrack = false; n20.minHeight = 100;
  n20.openHour = 10; n20.openMinute = 0; n20.closeHour = 18; n20.closeMinute = 45;
  n20.capacity = 40; n20.minCapacity = 10; n20.runtime = 4.5; n20.isPopular = false;
  n20.turnover = Math.max(5, Math.round(n20.runtime * 0.3));

  n21.zone = 4; n21.rideCategory = "anak-anak"; n21.isContinuous = false; n21.hasFastTrack = false; n21.minHeight = 100;
  n21.openHour = 10; n21.openMinute = 0; n21.closeHour = 18; n21.closeMinute = 45;
  n21.capacity = 16; n21.minCapacity = 4; n21.runtime = 3.0; n21.isPopular = false;
  n21.turnover = Math.max(5, Math.round(n21.runtime * 0.3));

  n22.zone = 4; n22.rideCategory = "anak-anak"; n22.isContinuous = false; n22.hasFastTrack = false; n22.minHeight = 0; // Tidak ada syarat minimum
  n22.openHour = 10; n22.openMinute = 0; n22.closeHour = 18; n22.closeMinute = 45;
  n22.capacity = 48; n22.minCapacity = 12; n22.runtime = 4.0; n22.isPopular = false;
  n22.turnover = Math.max(5, Math.round(n22.runtime * 0.3));

  n23.zone = 4; n23.rideCategory = "dewasa"; n23.isContinuous = false; n23.hasFastTrack = true; n23.minHeight = 125;
  n23.openHour = 10; n23.openMinute = 0; n23.closeHour = 18; n23.closeMinute = 45;
  n23.capacity = 36; n23.minCapacity = 18; n23.runtime = 3.0; n23.isPopular = true;
  n23.turnover = Math.max(5, Math.round(n23.runtime * 0.3));

  // set the global vars
  nodes = [e, n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, n13, n14, n15, n16, n17, n18, n19, n20, n21, n22, n23, n24, n25, n26, n27, n28, n29, n30, n31, n32, n33];
  connections = [[0, 1], [6, 8], [6, 11], [8, 11], [3, 19], [3, 20], [3, 16], [0, 2], [1, 2], [0, 4], [4, 5], [5, 6], [8, 4], [7, 10], [10, 12], [5, 8], [6,9], [9, 11], [11, 14], [8, 14], [11, 13], [13, 14], [13, 15], [14, 15], [12, 15], [10, 15], [7, 15], [7, 12], [13, 16], [16, 17], [11, 17], [13, 17], [9, 17], [17, 18], [16, 18], [18, 19], [16, 19], [16, 20], [16, 21], [20, 21], [21, 22], [20, 22], [22, 23], [21, 23], [23, 24], [20, 24], [15, 25], [1, 25], [2, 25], [2, 15], [2, 14], [25, 26], [23, 26], [24, 26], [26, 27], [24, 27], [27, 28], [26, 28], [28, 29], [25, 29], [1, 29], [29, 30], [28, 30], [27, 30], [1, 30], [30, 31], [27, 31], [27, 32], [24, 33], [32, 33], [31, 33]];
  
  simMap = new SimMap(nodes, connections);
}

function updateLoop() {
  addAgents();

  for (let agent of agents) {
    agent.update();
  }

  simMap.updateRides();

  removeAgents();

  // calculate averageQueueTime (because there's nowhere else to calculate this)
  averageQueueTime = simMap.getAverageQueueTime();

  // update the histories with the calculated data
  const exitedVisitors = max(1, numExitedAgents);
  if (frameRunning % Math.floor(AGT_SAMPLE_UPDATE_FREQ * FRAME_RATE) == 0) {
    timeHist.push(time);

    totalVisitorsHist.push(totalVisitors);

    timeSpentHist.push(totalTimeSpent / exitedVisitors);
    timeQueueHist.push(totalTimeQueue / exitedVisitors);
    rideHist.push(totalRides / exitedVisitors);

    agtsLeftHist.push(totalAgtsLeft / totalVisitors);

    avgQueueTimeHist.push(averageQueueTime);
    minQueueTimeHist.push(simMap.getMinQueueTime());
  }

}

function gammaArrival(t) {
  // 🔥 PERBAIKAN: Syarat waktu diletakkan di sini, bukan di generateArrivalSchedule!
  // Jika waktu t sudah lewat dari batas tutup gerbang (misal 8 jam) atau negatif, peluang = 0
  let durationHours = gateCloseHour - parkOpenHour;
  if (t >= durationHours || t <= 0) return 0;

  const k = 2.0;      // Bentuk kurva (alpha)
  const lambda = 2.0; // Kecepatan kurva turun (rate)
  
  // Nilai probabilitas paling tinggi pada kurva Gamma(2.0, 1.5)
  // Mode (puncak) = (k - 1) / lambda
  const mode = (k - 1) / lambda;
  const maxProb = Math.pow(lambda, k) * Math.pow(mode, k - 1) * Math.exp(-lambda * mode); 

  // Hitung pembilang dari rumus PDF Distribusi Gamma
  const numerator = Math.pow(lambda, k) * Math.pow(t, k - 1) * Math.exp(-lambda * t);
  
  // Membagi dengan maxProb memastikan kurva menyentuh batas mutlak 1.0
  return numerator / maxProb;
}

function addAgents() {
  if (!isRunning || currentHour >= gateCloseHour) return;

  while (arrivalSchedule.length > 0 && secondsInSim >= arrivalSchedule[0]) {
    const typeRNG = Math.random();
    
    let type = "SOLO";
    let size = 1;
    let numAdults = 1;
    let numChildren = 0;
    let isPriority = false;

    // PROBABILITAS TIPE PENGUNJUNG
    // 5% Solo Priority | 10% Group Priority | 20% Solo Biasa | 35% Group Biasa | 30% Family
    if (typeRNG < 0.05) {
      type = "SOLO";
      isPriority = true;
    } else if (typeRNG < 0.15) {
      type = "GROUP";
      isPriority = true;
      size = Math.ceil(Math.random() * 4) + 1; // 2-5 orang
    } else if (typeRNG < 0.35) {
      type = "SOLO";
    } else if (typeRNG < 0.70) {
      type = "GROUP";
      size = Math.ceil(Math.random() * 4) + 1; // 2-5 orang
    } else {
      type = "GROUP_FAMILY";
      size = Math.floor(Math.random() * 3) + 2; // 2, 3, atau 4 orang
      
      if (size === 2) {
        numAdults = 1; numChildren = 1;
      } else if (size === 3) {
        numAdults = Math.random() < 0.5 ? 1 : 2;
        numChildren = 3 - numAdults;
      } else {
        numAdults = Math.random() < 0.5 ? 1 : 2;
        numChildren = 4 - numAdults;
      }
    }

    // ✅ FIX: Clamp size agar tidak melebihi sisa slot arrivalSchedule
    // Ini memastikan totalVisitors tepat = N tanpa kelebihan
    const remainingSlots = arrivalSchedule.length;
    if (remainingSlots <= 0) break;
    if (size > remainingSlots) {
      size = remainingSlots;
      if (type === "GROUP_FAMILY") {
        numAdults = Math.max(1, Math.min(numAdults, size - 1));
        numChildren = size - numAdults;
      } else {
        numAdults = size;
        numChildren = 0;
      }
    }

    // Hapus slot jadwal sesuai total size
    for (let i = 0; i < size; i++) {
      if (arrivalSchedule.length > 0) arrivalSchedule.shift();
    }

    // Buat agen dan tambahkan
    agents.push(new Agent(simMap, type, isPriority, size, numAdults, numChildren));
    totalVisitors += size;
  }
}

function removeAgents() {
  // 1. Hitung agen batal masuk (LEFT)
  let leftAgents = agents.filter((agt) => agt.agentState == AgentStates.LEFT);
  for (let agt of leftAgents) {
    if (!agt.isSplitPart) { 
      totalAgtsLeft += (agt.groupSize || agt.size || 1); 
    }
  }

  // 🔥 FITUR BARU: MENGAMBIL DATA UNTUK EXPORT CSV SEBELUM DIHAPUS 🔥
  for (let agt of agents) {
      if ((agt.agentState == AgentStates.EXITED || agt.agentState == AgentStates.LEFT) && !agt.isSplitPart) {
          
          let h = Math.floor(currentHour).toString().padStart(2, '0');
          let m = Math.floor(currentMinute).toString().padStart(2, '0');
          let exitTimeStr = `${h}:${m}`;
          
          // Format daftar wahana dan antrean
          let rideSequence = agt.rideHistoryLog.map(r => `${r.name} (${r.time})`).join(" -> ");
          let queueSequence = agt.rideHistoryLog.map(r => `${r.name}: ${r.queue}m`).join(" | ");
          
          // 🔥 HITUNG RATA-RATA ANTREAN INDIVIDU PENGUNJUNG INI 🔥
          let totalQueueMins = agt.rideHistoryLog.reduce((sum, r) => sum + r.queue, 0);
          let individualAvgQueue = agt.rideHistoryLog.length > 0 ? (totalQueueMins / agt.rideHistoryLog.length).toFixed(2) : 0;
          
          let fullType = agt.type;
          if (agt.priority) fullType += " (FastTrack)";
          
          agentExportData.push({
              id: agt.id,
              type: fullType,
              size: agt.size,
              minHeight: agt.minHeightGroup,
              totalRides: agt.rideHistoryLog.length,
              individualAvgQueue: individualAvgQueue, // Data baru masuk!
              entryTime: agt.entryTimeStr,
              exitTime: exitTimeStr,
              rideList: rideSequence || "Tidak naik apa-apa",
              queueList: queueSequence || "-"
          });
      }
  }

  // 2. Bersihkan agen yang sudah keluar dari memori simulasi
  let exitedAgents = agents.filter((agt) => agt.agentState == AgentStates.EXITED);
  agents = agents.filter((agt) => (agt.agentState != AgentStates.EXITED && agt.agentState != AgentStates.LEFT));

  // 3. Proses statistik agregat yang 100% Akurat secara Matematis
  for (let agt of exitedAgents) {
    if (agt.isSplitPart) {
        // Abaikan pecahan grup, karena buku harian (rideHistoryLog) milik agen induk 
        // sudah mencatat semua wahana yang dinaiki oleh seluruh anggota keluarganya!
        continue; 
    }
    
    let groupSize = agt.size || 1;
    let groupRides = agt.rideHistoryLog.length || 0;
    
    // Total orang-wahana (Weighted by group size)
    totalRides += (groupRides * groupSize);
    
    // Tarik total antrean riil dari buku harian agar tidak ada duplikasi pecahan grup
    let totalQueueMins = agt.rideHistoryLog.reduce((sum, r) => sum + r.queue, 0);
    
    // Total orang-menit antrean
    totalTimeQueue += (totalQueueMins * groupSize);
    
    totalTimeSpent += ((frameRunning - agt.enteredTime) / FRAME_RATE) * groupSize;
    numExitedAgents += groupSize; 
    
    if (groupRides > 0 || agt.agentState === AgentStates.EXITED) {
       if (groupRides > maxRidesRecord) maxRidesRecord = groupRides;
       if (groupRides < minRidesRecord) minRidesRecord = groupRides;
    }
  }
}
// ========================================================
// 🎢 RIDE DASHBOARD — HTML-based live panel below canvas
// ========================================================

let dashboardContainer = null;
let dashboardCards = {};
let lastDashboardUpdate = 0;
const DASHBOARD_UPDATE_INTERVAL = 0.5;

function buildRideDashboard(parentEl) {
  const dash = createDiv();
  dash.class("ride-dashboard");
  dash.parent(parentEl);
  dashboardContainer = dash;

  const header = createDiv();
  header.class("dashboard-header");
  header.parent(dash);

  const title = createDiv("⚡ Live Ride Intelligence Board");
  title.class("dashboard-title");
  title.parent(header);

  const grid = createDiv();
  grid.class("dashboard-grid");
  grid.id("dashboard-grid");
  grid.parent(dash);

  const footer = createDiv();
  footer.class("dashboard-summary-bar");
  footer.id("dashboard-footer");
  footer.parent(dash);
}

function updateRideDashboard() {
  if (!dashboardContainer || !simMap) return;
  if (time - lastDashboardUpdate < DASHBOARD_UPDATE_INTERVAL) return;
  lastDashboardUpdate = time;

  const grid = select("#dashboard-grid");
  const footer = select("#dashboard-footer");
  if (!grid || !footer) return;

  const rides = simMap.rides;
  if (!rides || rides.length === 0) return;

  if (Object.keys(dashboardCards).length !== rides.length) {
    grid.html("");
    dashboardCards = {};
    rides.forEach((ride, i) => {
      const card = createDiv();
      card.id("dcard-" + i);
      card.parent(grid);
      dashboardCards[i] = card;
    });
  }

  rides.forEach((ride, i) => {
    const card = dashboardCards[i];
    if (!card) return;
    renderRideCard(card, ride);
  });

  renderDashboardFooter(footer, rides);
}

function renderRideCard(cardEl, ride) {
  const m = ride.getQueueMetrics ? ride.getQueueMetrics() : { rho:0, Lq:0, W:0, L:0, S:0, status:"N/A" };
  const isOpen = ride.isOpen ? ride.isOpen() : true;
  const queueTime = ride.getQueueTime ? ride.getQueueTime() : 0;
  const rho = m.rho || 0;

  let qColor = "#22c55e";
  let barColor = "#22c55e";
  if (queueTime >= 30)       { qColor = "#ef4444"; barColor = "#ef4444"; }
  else if (queueTime >= 15)  { qColor = "#facc15"; barColor = "#facc15"; }

  let rhoColor = "#22c55e";
  if (rho >= 0.9)       rhoColor = "#ef4444";
  else if (rho >= 0.65) rhoColor = "#facc15";

  const barPct = Math.min(100, (queueTime / 60) * 100);
  const qDisplay = ride.isContinuous
    ? `${ride.getCurrentOccupancy ? ride.getCurrentOccupancy() : 0}/${ride.capacity}`
    : `${queueTime}m`;
  const qLabel = ride.isContinuous ? "OCCUPANCY" : "QUEUE TIME";

  const circumference = 2 * Math.PI * 12;
  const dashOffset = circumference * (1 - Math.min(rho, 1));
  const rhoRingSVG = `<svg width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>
    <circle cx="16" cy="16" r="12" fill="none" stroke="${rhoColor}" stroke-width="3"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 16 16)"/>
  </svg>`;

  const openStr = `${String(ride.openHour||10).padStart(2,'0')}:${String(ride.openMinute||0).padStart(2,'0')}`;
  const closeStr = `${String(ride.closeHour||19).padStart(2,'0')}:${String(ride.closeMinute||0).padStart(2,'0')}`;

  let cardClass = "ride-card";
  if (!isOpen) cardClass += " closed";
  else if (rho >= 0.9) cardClass += " overloaded";

  const rideName = ride.rideName || ride.name || "Ride";

  cardEl.elt.className = cardClass;
  cardEl.elt.innerHTML = `
    <div class="card-header">
      <div class="card-ride-name">${rideName}</div>
      <div class="card-status-badge ${isOpen ? 'badge-open' : 'badge-closed'}">${isOpen ? '● OPEN' : '● CLOSED'}</div>
    </div>
    <div class="card-meta">
      <span class="meta-tag tag-zone">Z${ride.zone || 0}</span>
      <span class="meta-tag tag-category">${(ride.rideCategory||'umum').toUpperCase()}</span>
      ${ride.hasFastTrack ? '<span class="meta-tag tag-fasttrack">⚡ FT</span>' : ''}
      ${ride.isContinuous ? '<span class="meta-tag tag-continuous">∞</span>' : ''}
    </div>
    <div class="queue-section">
      <div class="queue-label-row">
        <span class="queue-label">${qLabel}</span>
        <span class="queue-value" style="color:${qColor}">${qDisplay}</span>
      </div>
      <div class="queue-bar-track">
        <div class="queue-bar-fill" style="width:${barPct}%;background:${barColor}"></div>
      </div>
    </div>
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">ρ UTIL</div>
        <div class="metric-value" style="color:${rhoColor}">${(rho*100).toFixed(0)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Lq</div>
        <div class="metric-value" style="color:#94a3b8">${m.Lq.toFixed(1)}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">W(m)</div>
        <div class="metric-value" style="color:#94a3b8">${m.W.toFixed(1)}</div>
      </div>
    </div>
    <div class="card-footer">
      <div>
        <div class="footer-info">Capacity: <span>${ride.capacity}</span> &nbsp; RT: <span>${ride.runtime}m</span></div>
        <div class="footer-info">Hours: <span>${openStr}–${closeStr}</span></div>
        <div class="footer-info">Min Height: <span>${ride.minHeight > 0 ? ride.minHeight+'cm' : 'None'}</span></div>
      </div>
      <div class="rho-ring">
        ${rhoRingSVG}
        <div class="rho-ring-label" style="color:${rhoColor}">${(rho*100).toFixed(0)}</div>
      </div>
    </div>
  `;
}

function renderDashboardFooter(footerEl, rides) {
  const totalOpen = rides.filter(r => r.isOpen && r.isOpen()).length;
  const totalClosed = rides.length - totalOpen;
  let totalQ = 0, countQ = 0, maxQ = 0, maxQRide = null, busiest = null, busiestRho = 0;

  for (let ride of rides) {
    if (!ride.isOpen || !ride.isOpen()) continue;
    const q = ride.getQueueTime ? ride.getQueueTime() : 0;
    const m = ride.getQueueMetrics ? ride.getQueueMetrics() : { rho: 0 };
    totalQ += q; countQ++;
    if (q > maxQ) { maxQ = q; maxQRide = ride; }
    if (m.rho > busiestRho) { busiestRho = m.rho; busiest = ride; }
  }

  const avgQ = countQ > 0 ? (totalQ / countQ).toFixed(1) : "0.0";
  const busiestName = busiest ? (busiest.rideName || "—") : "—";
  const longestName = maxQRide ? (maxQRide.rideName || "—") : "—";

  footerEl.elt.innerHTML = `
    <div class="dsb-item"><div class="dsb-label">Rides Open</div><div class="dsb-value green">${totalOpen}</div></div>
    <div class="dsb-sep"></div>
    <div class="dsb-item"><div class="dsb-label">Rides Closed</div><div class="dsb-value red">${totalClosed}</div></div>
    <div class="dsb-sep"></div>
    <div class="dsb-item"><div class="dsb-label">Avg Queue</div><div class="dsb-value">${avgQ}m</div></div>
    <div class="dsb-sep"></div>
    <div class="dsb-item"><div class="dsb-label">Longest Queue</div><div class="dsb-value orange small">${longestName}&nbsp;<em>(${maxQ}m)</em></div></div>
    <div class="dsb-sep"></div>
    <div class="dsb-item"><div class="dsb-label">Busiest (ρ)</div><div class="dsb-value orange small">${busiestName}&nbsp;<em>(${(busiestRho*100).toFixed(0)}%)</em></div></div>
    <div class="dsb-sep"></div>
    <div class="dsb-item"><div class="dsb-label">Total Rides</div><div class="dsb-value">${rides.length}</div></div>
  `;
}

// ========================================================
// 🏁 PAGE FOOTER
// ========================================================
function buildFooter(parentEl) {
  const footer = createDiv();
  footer.class("page-footer");
  footer.parent(parentEl);

  footer.html(`
    <div class="pf-inner">
      <div class="pf-brand">
        <span class="pf-logo">🎢</span>
        <span class="pf-name">Theme Park Simulator</span>
      </div>
      <div class="pf-desc">
        Simulasi antrian pengunjung taman hiburan Dufan berbasis agen (Agent-Based Simulation)
        menggunakan model teori antrian M/M/1 dengan algoritma Hierarchical Routing &amp; PWT.
      </div>
      <div class="pf-credits">
        <div class="pf-team">
          <span class="pf-credit-label">Tim Pengembang</span>
          <span class="pf-credit-names">Teknik Industri — Simulasi Sistem 2025</span>
        </div>
        <div class="pf-copy">© 2025 Theme Park Sim. All rights reserved.</div>
      </div>
    </div>
  `);
}

// ================================================================
// 🎯 LOD + HEATMAP AGENT RENDERER
// Tier 1: < 1000  → Full detail (existing agent.draw())
// Tier 2: 1000–5000 → LOD: colored points, size by group
// Tier 3: > 5000  → Heatmap grid + sparse moving dots overlay
// ================================================================

const LOD_TIER2_THRESHOLD = 1000;
const LOD_TIER3_THRESHOLD = 5000;

// Heatmap config
const HM_CELL = 24;           // cell size in px
const HM_COLS = Math.ceil(1280 / HM_CELL);
const HM_ROWS = Math.ceil(640  / HM_CELL);

// Pre-allocate heatmap buffer (flat array, reused every frame)
let hmGrid = new Float32Array(HM_COLS * HM_ROWS);

// LOD mode label shown in corner
let lodModeLabel = "";

function drawAgentsLOD() {
  const n = agents.length;

  if (n === 0) return;

  if (n < LOD_TIER2_THRESHOLD) {
    // ── TIER 1: Full detail ──────────────────────────────────────
    lodModeLabel = "";
    for (let agent of agents) {
      agent.draw();
    }

  } else if (n < LOD_TIER3_THRESHOLD) {
    // ── TIER 2: LOD — fast point rendering ──────────────────────
    lodModeLabel = "LOD";
    drawAgentsTier2(agents);

  } else {
    // ── TIER 3: Heatmap + sparse overlay ─────────────────────────
    lodModeLabel = "HEATMAP";
    drawHeatmap(agents);
    drawAgentsTier2Sparse(agents); // ~10% sample as moving dots
  }

  // HUD badge showing current render mode
  if (lodModeLabel !== "") {
    drawLODModeBadge(n);
  }
}

// ── TIER 2: Render every agent as a small colored circle ────────
function drawAgentsTier2(agentList) {
  push();
  noStroke();
  for (let agt of agentList) {
    // Interpolate position like agent.draw() does
    let ax = agt.x, ay = agt.y;
    if ((agt.agentState === 101 || agt.agentState === 103) && agt.lerpT !== undefined) {
      ax = lerp(agt.initialX ?? agt.x, agt.targetX ?? agt.x, agt.lerpT);
      ay = lerp(agt.initialY ?? agt.y, agt.targetY ?? agt.y, agt.lerpT);
    }

    // Pick color by agent type/state
    const c = getLODColor(agt);
    fill(c);
    // Size: 1 person = r2, group = r4
    const r = agt.size > 1 ? 4 : 2.5;
    circle(ax, ay, r * 2);
  }
  pop();
}

// ── TIER 3 sparse overlay: sample ~8% of agents, draw as dots ──
function drawAgentsTier2Sparse(agentList) {
  push();
  noStroke();
  const step = Math.ceil(agentList.length / (agentList.length * 0.08));
  for (let i = 0; i < agentList.length; i += step) {
    const agt = agentList[i];
    let ax = agt.x, ay = agt.y;
    if ((agt.agentState === 101 || agt.agentState === 103) && agt.lerpT !== undefined) {
      ax = lerp(agt.initialX ?? agt.x, agt.targetX ?? agt.x, agt.lerpT);
      ay = lerp(agt.initialY ?? agt.y, agt.targetY ?? agt.y, agt.lerpT);
    }
    fill(getLODColor(agt));
    circle(ax, ay, 3);
  }
  pop();
}

// ── HEATMAP: aggregate agents into grid cells, draw heat ────────
function drawHeatmap(agentList) {
  // 1. Clear buffer
  hmGrid.fill(0);

  // 2. Accumulate
  for (let agt of agentList) {
    const ax = agt.x, ay = agt.y;
    const col = Math.floor(ax / HM_CELL);
    const row = Math.floor(ay / HM_CELL);
    if (col >= 0 && col < HM_COLS && row >= 0 && row < HM_ROWS) {
      hmGrid[row * HM_COLS + col] += (agt.size || 1);
    }
  }

  // 3. Find max for normalization (soft cap to avoid one outlier washing out everything)
  let maxVal = 0;
  for (let v of hmGrid) if (v > maxVal) maxVal = v;
  const softMax = Math.max(maxVal * 0.6, 1); // 60th percentile feel

  // 4. Draw cells
  push();
  noStroke();
  rectMode(CORNER);
  for (let row = 0; row < HM_ROWS; row++) {
    for (let col = 0; col < HM_COLS; col++) {
      const val = hmGrid[row * HM_COLS + col];
      if (val === 0) continue;

      const t = Math.min(val / softMax, 1); // normalized 0–1

      // Color ramp: deep blue → cyan → yellow → red (thermal style)
      let r, g, b, a;
      if (t < 0.25) {
        // blue → cyan
        const s = t / 0.25;
        r = 0;  g = Math.round(s * 200); b = 255; a = 60 + s * 80;
      } else if (t < 0.5) {
        // cyan → green
        const s = (t - 0.25) / 0.25;
        r = 0; g = 200; b = Math.round(255 * (1 - s)); a = 140 + s * 40;
      } else if (t < 0.75) {
        // green → yellow
        const s = (t - 0.5) / 0.25;
        r = Math.round(s * 255); g = 210; b = 0; a = 180 + s * 40;
      } else {
        // yellow → red
        const s = (t - 0.75) / 0.25;
        r = 255; g = Math.round(210 * (1 - s)); b = 0; a = 220;
      }

      fill(r, g, b, a);
      rect(col * HM_CELL, row * HM_CELL, HM_CELL, HM_CELL);
    }
  }
  pop();

  // 5. Draw heatmap colorbar legend (bottom-right corner, above stats panel)
  drawHeatmapLegend(agentList.length, maxVal);
}

// ── Colorbar legend ──────────────────────────────────────────────
function drawHeatmapLegend(totalAgents, maxDensity) {
  push();
  const lx = WIDTH - 160, ly = 50;
  const lw = 120, lh = 10;

  // Background pill
  fill(5, 10, 22, 200);
  stroke(56, 140, 255, 60);
  strokeWeight(1);
  rect(lx - 10, ly - 20, lw + 20, lh + 46, 8);

  // Gradient bar drawn as 40 thin rects
  noStroke();
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    let r, g, b;
    if (t < 0.25)      { const s=t/0.25;      r=0;   g=Math.round(s*200); b=255; }
    else if (t < 0.5)  { const s=(t-0.25)/0.25; r=0;   g=200; b=Math.round(255*(1-s)); }
    else if (t < 0.75) { const s=(t-0.5)/0.25;  r=Math.round(s*255); g=210; b=0; }
    else               { const s=(t-0.75)/0.25;  r=255; g=Math.round(210*(1-s)); b=0; }
    fill(r, g, b, 220);
    rect(lx + (lw / steps) * i, ly, lw / steps + 1, lh);
  }

  // Labels
  fill(180, 200, 255);
  textSize(8);
  textAlign(LEFT, TOP);
  text("0", lx, ly + lh + 3);
  textAlign(RIGHT, TOP);
  text(Math.round(maxDensity), lx + lw, ly + lh + 3);
  textAlign(CENTER, TOP);
  fill(56, 189, 248);
  text("density / cell", lx + lw/2, ly + lh + 3);

  // Title
  fill(56, 189, 248, 180);
  textSize(8);
  textStyle(BOLD);
  textAlign(CENTER, BOTTOM);
  text("HEATMAP MODE", lx + lw/2, ly - 4);

  pop();
}

// ── Color by agent type / state ──────────────────────────────────
function getLODColor(agt) {
  // QUEUING = green bright, RIDING = purple, EXITING = grey
  switch (agt.agentState) {
    case 102: return color(50, 245, 80, 220);   // QUEUING — bright green
    case 108: return color(160, 80, 255, 220);  // RIDING — purple
    case 103: return color(150, 150, 160, 180); // EXITING — grey
    default: break;
  }
  // By type
  if (agt.priority) return color(59, 130, 246, 220);    // priority — blue
  if (agt.type === "GROUP_FAMILY") return color(245, 158, 11, 220); // family — amber
  if (agt.size > 1) return color(236, 72, 153, 220);   // group — pink
  return color(187, 231, 14, 220);                      // solo — lime
}

// ── HUD badge: current LOD mode ──────────────────────────────────
function drawLODModeBadge(agentCount) {
  push();
  const isHeatmap = lodModeLabel === "HEATMAP";
  const badgeCol = isHeatmap ? color(249, 115, 22) : color(250, 204, 21);

  // Pill background
  noStroke();
  fill(5, 10, 22, 200);
  stroke(red(badgeCol), green(badgeCol), blue(badgeCol), 80);
  strokeWeight(1);
  rect(WIDTH - 230, 55, 210, 26, 13);

  // Dot
  noStroke();
  fill(badgeCol);
  circle(WIDTH - 218, 68, 6);

  // Text
  fill(red(badgeCol), green(badgeCol), blue(badgeCol), 230);
  textSize(9);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text(`${lodModeLabel} MODE  —  ${agentCount.toLocaleString()} agents`, WIDTH - 208, 68);

  pop();
}