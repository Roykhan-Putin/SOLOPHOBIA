# 🎢 DUFAN — Theme Park Queue Simulation

> Simulasi antrian pengunjung taman hiburan DUFAN Ancol menggunakan pendekatan **Agent-Based Simulation** dengan model antrian **M/M/1**, membandingkan dua strategi routing pengunjung.

**🌐 Live Demo:** [dufan-simulation.vercel.app](https://dufan-simulation.vercel.app)  
**📊 Dashboard Visualisasi:** [sayang-lomba-sayang.streamlit.app](https://sayang-lomba-sayang.streamlit.app)

---

## 📌 Deskripsi Project

Project ini adalah simulasi berbasis agen (*agent-based simulation*) yang memodelkan perilaku pengunjung taman hiburan DUFAN Ancol. Setiap pengunjung direpresentasikan sebagai **agen independen** yang berpindah antar wahana, mengantri, dan membuat keputusan berdasarkan strategi routing yang berbeda.

Simulasi ini dirancang untuk **membandingkan dua strategi pemilihan wahana** — satu terencana dan efisien, satu spontan dan acak — dan menganalisis dampaknya terhadap panjang antrian, utilisasi wahana, dan kepuasan pengunjung menggunakan **teori antrian M/M/1**.

Project ini merupakan bagian dari ekosistem DUFAN bersama [Web Platform](https://projectdufan.vercel.app) dan [Ticketing System](https://ticketingproject.vercel.app), dikerjakan oleh **Tim Sayang Lomba Sayangg — UNAIR**.

---

## ✨ Fitur Utama

### 🗺️ SIM-01 — Hierarchical Routing
- Pengunjung menggunakan strategi navigasi berbasis **hierarki zona**
- Prioritas wahana ditentukan dari zona terdekat, lalu dioptimasi berdasarkan **jarak + panjang antrian**
- Menggunakan algoritma **PWT (Priority Weighted Travel)**
- Mendukung Fast Track — pengunjung Fast Track mendapat prioritas antrian
- **Balking behavior**: pengunjung meninggalkan antrian jika terlalu panjang
- Mencerminkan perilaku pengunjung yang **terencana dan efisien**

### 🎲 SIM-02 — No Hierarchical Routing
- Pengunjung memilih wahana berikutnya secara **acak berbobot** (*roulette wheel selection*)
- Bobot dihitung dari normalisasi jarak dan panjang antrian — tanpa pembagian zona
- Tidak ada balking — pengunjung "pasrah" mengantri berapapun panjangnya
- Berfungsi sebagai **simulasi baseline / referensi** perbandingan
- Mencerminkan perilaku pengunjung yang **spontan dan tidak terencana**

### 📊 VIZ-03 — Dashboard Visualisasi (Streamlit)
- Upload hasil export **CSV** dari kedua simulasi
- Perbandingan interaktif antrian, utilisasi wahana (ρ), dan perilaku pengunjung
- Kalkulasi dan visualisasi metrik **M/M/1**: λ (arrival rate), μ (service rate), ρ (utilization), Lq, Wq
- Perbandingan head-to-head **Hierarchical vs No Hierarchical** dalam satu dashboard terpadu
- Dibangun dengan **Python + Streamlit**

---

## 🧮 Model Teori Antrian

Simulasi ini menggunakan model **M/M/1** — single server queue dengan:

| Notasi | Deskripsi |
|---|---|
| **λ** (lambda) | Tingkat kedatangan pengunjung ke wahana (arrival rate) |
| **μ** (mu) | Tingkat pelayanan wahana (service rate = 1 / durasi) |
| **ρ = λ/μ** | Utilisasi server (wahana) |
| **Lq = ρ²/(1−ρ)** | Rata-rata jumlah pengunjung dalam antrian |
| **Wq = Lq/λ** | Rata-rata waktu tunggu dalam antrian |

> Asumsi: setiap wahana dimodelkan sebagai server independen dengan distribusi kedatangan Poisson dan waktu pelayanan eksponensial.

---

## ⚖️ Perbandingan Strategi

| Aspek | Hierarchical Routing | No Hierarchical Routing |
|---|---|---|
| Strategi Pemilihan Wahana | Zona → Jarak → Antrian | Weighted Random (Roulette Wheel) |
| Pembagian Zona | ✅ Ada | ❌ Tidak Ada |
| Prioritas Fast Track | ✅ Didukung | ✅ Didukung |
| Balking (Tinggalkan Antrian) | ✅ Ada | ❌ Tidak Ada |
| Perilaku Pengunjung | Terencana & Efisien | Spontan & Acak |
| Cocok Untuk | Analisis optimasi taman | Simulasi baseline / referensi |

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Simulasi (Frontend)** | HTML5, CSS3, JavaScript (ES6+) |
| **Rendering Simulasi** | HTML Canvas API |
| **Dashboard Visualisasi** | Python, Streamlit |
| **Analisis Data** | Pandas, Matplotlib / Plotly |
| **Deployment Simulasi** | Vercel |
| **Deployment Dashboard** | Streamlit Community Cloud |

---

## 📁 Struktur Project

```
dufan-simulation/
├── index.html                      # Landing page — pilih mode simulasi
├── hierarchicalRouting.html        # SIM-01: simulasi hierarchical routing
├── noHierarchicalRouting.html      # SIM-02: simulasi no hierarchical routing
│
├── res/                            # Aset gambar (foto tim, dll.)
│   ├── gedank.jpeg
│   ├── roykhan.jpg
│   └── aprilia.jpg
│
├── js/
│   ├── hierarchical.js             # Logika agent + zona routing
│   ├── noHierarchical.js           # Logika agent + roulette wheel
│   └── shared.js                   # Data wahana, layout peta, M/M/1 utils
│
└── streamlit/                      # Dashboard visualisasi Python
    ├── app.py                      # Main Streamlit app
    └── requirements.txt
```

---

## 🚀 Cara Menjalankan Lokal

### Simulasi (JavaScript)
1. Clone repository:
   ```bash
   git clone https://github.com/username/dufan-simulation.git
   cd dufan-simulation
   ```

2. Jalankan dengan live server:
   ```bash
   npx serve .
   ```

3. Buka `http://localhost:3000`

### Dashboard Visualisasi (Python / Streamlit)
1. Masuk ke folder streamlit:
   ```bash
   cd streamlit
   pip install -r requirements.txt
   ```

2. Jalankan Streamlit:
   ```bash
   streamlit run app.py
   ```

3. Buka `http://localhost:8501`, lalu upload file CSV hasil export simulasi.

---

## 🔗 Ekosistem Project

| Repository | URL | Deskripsi |
|---|---|---|
| **Simulation** | [dufan-simulation.vercel.app](https://dufan-simulation.vercel.app) | Repo ini — simulasi & analisis antrian |
| **Web Platform** | [projectdufan.vercel.app](https://projectdufan.vercel.app) | Frontend pengunjung — beli tiket & dashboard |
| **Ticketing System** | [ticketingproject.vercel.app](https://ticketingproject.vercel.app) | Admin & staff tools — generate & scan tiket |

---

## 👥 Tim Pengembang

**Tim Sayang Lomba Sayangg — Universitas Airlangga (UNAIR)**

| | Nama | Role | Jurusan |
|---|---|---|---|
| 01 | **Gading Wisnu Kusuma** | Developer | Matematika — UNAIR |
| 02 | **Achmad Roykhan Sabiq** | Developer | Matematika — UNAIR |
| 03 | **Aprilia Cristy Rajagukguk** | Developer | Matematika — UNAIR |

---

© 2026 Theme Park Sim · Tim Sayang Lomba Sayangg · UNAIR · All rights reserved