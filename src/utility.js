// constants
const WIDTH = 1280;
const HEIGHT = 640;

const AGENT_RADIUS = 7;
const NODE_RADIUS = 10;

const NODE_TYPES = ["junc", "ride", "entrance"];

let editMode = false;

// display information parameters
const DISPLAY_HEIGHT = 175;
const DISPLAY_WIDTH = 150;
const HOVER_RADIUS = 30;

const MAX_RIDE_SAMPLES = 100; // keep up to this amount of queue-data
const RIDE_SAMPLE_UPDATE_FREQ = 0.1 // update the graph every x seconds

const RG_X_START = 20;
const RG_X_END = 120;
const RG_Y_START = 135;
const RG_Y_END = 185;

// global stats parameters
const STATS_WIDTH = 400;
const STATS_HEIGHT = 200;

const MAX_AGT_SAMPLES = 200; // keep up to this amount of agent-data
const AGT_SAMPLE_UPDATE_FREQ = 0.5  // update the graphs every x seconds

const GG_HEIGHT = 50;
const GG_WIDTH = 100;

// simulation parameters
const ARRIVAL_PROB = 0.2;

// Pengunjung nyaris TIDAK MUNGKIN pulang di gerbang (karena sudah beli tiket mahal)
const CROWD_TURNAWAY_PROB = 0; // Ubah dari 0.9 menjadi 2%

// 2. Peluang pulang karena ramai: Sangat kecil (karena sayang tiket mahal)
const CROWD_DEPARTURE_PROB = 0.02;

// 3. Peluang pulang setelah puas: Dikecilkan agar mereka terus main sampai capek/tutup
const SATISFIED_DEPARTURE_PROB = 0.1;

// 1. Target kepuasan: Pengunjung ingin menaiki minimal 80% dari total wahana!
const RIDES_FOR_SATISFACTION = 0.8;

// 4. Peluang pulang acak tanpa alasan (Kunci utama mengapa mereka cepat pulang!)
const DEPARTURE_PROB = 0.00; // WAJIB DI-NOL-KAN! Pantang pulang tanpa alasan.

const PRIORITY_PROB = 0.1; // x of all visitors are priority
const GRP_PROB = 0.6 + PRIORITY_PROB; // x of all visitors are groups

const MOVE_SPEED = 100; // moves x units per second

// resources and images
const ICON_WIDTH = 40;
const ICON_HEIGHT = 40;

const RIDE_IMG_PATH = "res/roller-coaster.png";
const ENTRANCE_IMG_PATH = "res/gate.jpg";

// creator mode constants
const SELECT_RADIUS = 13;

const TEXT_PADDING_TOP = 15;
const TEXT_PADDING_RIGHT = 10;

// application constants
const FRAME_RATE = 30;
let frameRunning = 0;

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
}

// change the stuff below as you see fit
// returns an even number uniformly from 6 - 12
function getRandomCapacity() {
  return 2 * (Math.floor(Math.random() * 4) + 3);
}

// returns a number uniformly from 1 to 5
function getRandomRuntime() {
  return Math.floor(Math.random() * 5) + 1;
}

// returns a number uniformly from 1 to 5
function getRandomTurnover() {
  return Math.floor(Math.random() * 5) + 1;
}

const PQtop = 0;
const PQparent = i => ((i + 1) >>> 1) - 1;
const PQleft = i => (i << 1) + 1;
const PQright = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
    this.howmany = 0
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[PQtop];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > PQtop) {
      this._swap(PQtop, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[PQtop] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > PQtop && this._greater(node, PQparent(node))) {
      this._swap(node, PQparent(node));
      node = PQparent(node);
    }
  }
  _siftDown() {
    let node = PQtop;
    while (
      (PQleft(node) < this.size() && this._greater(PQleft(node), node)) ||
      (PQright(node) < this.size() && this._greater(PQright(node), node))
    ) {
      let maxChild = (PQright(node) < this.size() && this._greater(PQright(node), PQleft(node))) ? PQright(node) : PQleft(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

// --- METRIK KEPUASAN (DIMINISHING MARGINAL UTILITY) ---
const K_RIDES = 0.3;      // Konstanta saturasi jumlah wahana
const GAMMA_WAIT = 0.011; // Konstanta penalti waktu tunggu (dalam menit)
const LAMBDA = 0.6;       // Bobot prioritas (60% jumlah wahana, 40% waktu antre)

function calculateSatisfaction(avgRides, avgWaitTime) {
    // SYARAT BATAS: Jika belum ada wahana yang berhasil dinaiki, kepuasan mutlak 0%
    if (avgRides === 0) return "0.00";

    // 1. Hitung utilitas jumlah wahana (0 to 1)
    let Sn = 1 - Math.exp(-K_RIDES * avgRides);
    
    // 2. Hitung penalti waktu tunggu (1 to 0)
    let Sw = Math.exp(-GAMMA_WAIT * avgWaitTime);
    
    // 3. Gabungkan dengan fungsi utilitas berbobot
    let totalSatisfaction = (LAMBDA * Sn) + ((1 - LAMBDA) * Sw);
    
    // Kembalikan dalam bentuk persentase (0 - 100%)
    return (totalSatisfaction * 100).toFixed(2); 
}


function getQueueMetrics(ride) {
  if (!ride || ride.type !== "ride" || ride.capacity <= 0) {
    return { rho: 0, L: 0, Lq: 0, W: 0, S: 0, status: "N/A", stable: true };
  }

  // Service rate μ (orang per menit)
  const cycleTime = (ride.runtime || 5) + (ride.turnover || 2);
  const mu = ride.capacity / cycleTime;

  // Arrival rate λ (dari moving average yang sudah di-track di MapNode)
  const lambda = ride.lambda || 0;

  // ρ = λ/μ — TIDAK di-cap, biarkan > 1 agar bisa dideteksi dan ditampilkan apa adanya
  const rho = lambda / mu;

  // Untuk rumus M/M/1, L/Lq/W/S hanya valid saat ρ < 1 (steady-state).
  // Saat ρ >= 1, sistem secara teori tidak steady-state, tapi dalam praktik
  // kedatangan acak bisa membuat sistem sempat kosong (stabil sementara).
  // Kita gunakan rho_capped HANYA untuk kalkulasi rumus agar tidak infinity,
  // tapi rho asli tetap ditampilkan dan digunakan untuk status.
  const rho_calc = Math.min(rho, 0.999);

  const Lq = (rho_calc * rho_calc) / (1 - rho_calc);
  const L  = rho_calc / (1 - rho_calc);
  const W  = lambda > 0 ? (Lq / lambda) : 0; 
  const S  = W + (1 / mu);

  // ===== STATUS PERFORMA =====
  // Performa sistem antrian dinilai dari EMPAT metrik sekaligus:
  // ρ (stabilitas), Lq (panjang antrian), W (waktu tunggu), S (total waktu di sistem)
  // ρ >= 1 BUKAN berarti langsung kolaps — kedatangan acak bisa menciptakan
  // periode kosong yang mengistirahatkan server (stabil sementara).

  const stable = rho < 1; // true = steady-state terjamin secara teoritis

  let status;
  if (rho < 0.65 && Lq <= 5  && W <= 10) {
    status = "🟢 Optimal";           // semua metrik bagus
  } else if (rho < 0.85 && Lq <= 15 && W <= 25) {
    status = "🟡 Moderat";           // masih dalam batas wajar
  } else if (rho < 1.0  && Lq <= 30 && W <= 40) {
    status = "🟠 Sibuk";             // ρ < 1 tapi antrian mulai panjang
  } else if (rho >= 1.0 && Lq <= 30 && W <= 40) {
    status = "🔴 ρ≥1 (Stabil Sementara)"; // ρ > 1 tapi mungkin masih oke karena kedatangan acak
  } else {
    status = "🔴 Kritis";            // semua metrik buruk
  }

  return { rho, L, Lq, W, S, status, stable };
}

// Helper warna & teks untuk ρ
// ρ < 1  → steady-state terjamin (sistem pasti kosongkan diri dalam jangka panjang)
// ρ >= 1 → tidak ada jaminan steady-state TAPI kedatangan acak bisa ciptakan
//           periode tanpa pelanggan, sehingga server sempat mengosongkan sistem
function getRhoStatus(rho) {
  if (rho < 0.65) return { color: "#22c55e", text: "🟢 Stabil"   };
  if (rho < 0.85) return { color: "#eab308", text: "🟡 Moderat"  };
  if (rho < 1.0)  return { color: "#f97316", text: "🟠 Sibuk"    };
  return           { color: "#ef4444", text: "🔴 ρ≥1 (Stabil Sementara)" };
}

// =====================================================================
// METRIK JARINGAN ANTREAN GLOBAL (MACRO QUEUEING NETWORK)
// Menghitung performa seluruh taman hiburan sebagai satu sistem besar
// =====================================================================
function getGlobalQueueMetrics(mapData) {
    if (!mapData || !mapData.rides) return null;

    let totalLambda = 0; // Total laju kedatangan di seluruh wahana
    let totalMu = 0;     // Total daya tampung/servis di seluruh wahana
    let totalLq = 0;     // Rata-rata populasi pengunjung yang sedang antre (Global)
    let totalL = 0;      // Rata-rata populasi pengunjung di dalam sistem wahana (Antre + Main)

    for (let ride of mapData.rides) {
        if (!ride.isOpen() || ride.capacity <= 0) continue;

        // 1. Hitung Mu (Kapasitas per menit)
        let cycleTime = (ride.runtime || 5) + (ride.turnover || 2);
        let mu = ride.capacity / cycleTime;
        
        // 2. Hitung Lambda (Kedatangan per menit)
        let lambda = ride.lambda || 0;

        totalLambda += lambda;
        totalMu += mu;

        // 3. Ambil L dan Lq dari kalkulasi M/M/1 tiap wahana
        let rideMetrics = getQueueMetrics(ride);
        totalLq += rideMetrics.Lq;
        totalL += rideMetrics.L;
    }

    // 4. Hitung Utilisasi Global (Global Rho)
    // Jika Total Kedatangan > Total Kursi Taman, maka rho > 1
    let globalRho = totalMu > 0 ? (totalLambda / totalMu) : 0;

    // 5. Hukum Little (Little's Law) untuk Jaringan (W = Lq / λ)
    let globalW = totalLambda > 0 ? (totalLq / totalLambda) : 0;
    
    // 6. Total waktu dihabiskan per wahana (S = L / λ)
    let globalS = totalLambda > 0 ? (totalL / totalLambda) : 0;

    // 7. Evaluasi Status Performa Dufan Secara Makro
    let status;
    if (globalRho < 0.70 && globalW <= 15) {
        status = "🟢 TAMAN LANCAR"; 
    } else if (globalRho < 0.90 && globalW <= 30) {
        status = "🟡 TAMAN SIBUK"; 
    } else if (globalRho < 1.05 && globalW <= 50) {
        status = "🟠 TAMAN PADAT (STABIL SEMENTARA)"; 
    } else {
        status = "🔴 OVERCAPACITY (KRITIS)"; 
    }

    return {
        globalRho: globalRho,
        globalL: totalL,
        globalLq: totalLq,
        globalW: globalW,
        globalS: globalS,
        status: status
    };
}