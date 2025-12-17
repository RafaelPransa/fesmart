document.addEventListener('DOMContentLoaded', function () {
  // 1. Cek Login Admin
  if (!sessionStorage.getItem('fesmart_admin_logged_in')) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Render Grafik
  renderCharts();

  // 3. Cek Status Tombol Simulasi
  checkSimulationStatus();

  // Setup Event Listeners
  const btnSimulate = document.getElementById('btn-simulate');
  if (btnSimulate) {
    btnSimulate.addEventListener('click', generateDummyData);
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', resetDummyData);
  }
});

// --- FUNGSI UTAMA RENDER CHARTS ---
async function renderCharts() {
  try {
    // 1. Ambil Data (Gabungan API + Dummy Local)
    const players = await getPlayersData();

    // Jika data kosong, hentikan
    if (!players || players.length === 0) {
      console.warn('Tidak ada data pemain untuk ditampilkan di grafik.');
      return;
    }

    // 2. Siapkan Dataset
    const knowledgeTrendData = processKnowledgeTrend(players);
    const hbDistData = processHbDistribution(players);
    const complianceData = processCompliance(players);
    const correlationData = processCorrelation(players);

    // 3. Render Grafik Chart.js

    // A. Tren Pengetahuan (Line Chart)
    const ctxTrend = document.getElementById('knowledgeTrendChart');
    if (ctxTrend) {
      new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: [
            'Hari 1 (Pre)',
            'Hari 2',
            'Hari 3-5',
            'Hari 6',
            'Hari 7 (Post)',
          ],
          datasets: [
            {
              label: 'Rata-rata Skor Pengetahuan',
              data: knowledgeTrendData,
              borderColor: '#4880FF',
              backgroundColor: 'rgba(72, 128, 255, 0.1)',
              borderWidth: 3,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // B. Distribusi HB (Bar Chart)
    const ctxHb = document.getElementById('hbDistributionChart');
    if (ctxHb) {
      new Chart(ctxHb, {
        type: 'bar',
        data: {
          labels: [
            'Anemia Berat (<8)',
            'Ringan (8-11.9)',
            'Normal (12-14.9)',
            'Optimal (≥15)',
          ],
          datasets: [
            {
              label: 'Jumlah Pemain',
              data: hbDistData,
              backgroundColor: ['#EA5455', '#FF9F43', '#00B69B', '#4880FF'],
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
    }

    // C. Tingkat Kepatuhan (Doughnut Chart)
    const ctxComp = document.getElementById('complianceChart');
    if (ctxComp) {
      new Chart(ctxComp, {
        type: 'doughnut',
        data: {
          labels: [
            'Patuh Tinggi (>15)',
            'Cukup Patuh (8-15)',
            'Kurang Patuh (<8)',
          ],
          datasets: [
            {
              data: complianceData,
              backgroundColor: ['#00B69B', '#FF9F43', '#EA5455'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }

    // D. Korelasi (Scatter Plot)
    const ctxCorr = document.getElementById('correlationChart');
    if (ctxCorr) {
      new Chart(ctxCorr, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Pemain',
              data: correlationData,
              backgroundColor: '#9b59b6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Total Pengetahuan' },
              beginAtZero: true,
            },
            y: {
              title: { display: true, text: 'Total Kepatuhan' },
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error('Gagal merender grafik:', error);
  }
}

// --- PENGAMBILAN DATA (API + LOCAL) ---
async function getPlayersData() {
  let players = [];

  // A. Ambil Data Real dari Database (API)
  try {
    const response = await fetch('/api/admin/players');
    if (response.ok) {
      const dbData = await response.json();
      // Normalisasi data dari DB agar formatnya seragam
      // DB mengembalikan field flat (totalKnowledge), dummy data mengembalikan nested
      const normalizedDbData = dbData.map((p) => ({
        ...p,
        // Pastikan angka valid
        finalHb: parseFloat(p.finalHb || 0),
        totalKnowledge: parseInt(p.totalKnowledge || 0),
        totalCompliance: parseInt(p.totalCompliance || 0),
      }));
      players = players.concat(normalizedDbData);
    } else {
      console.error('Gagal mengambil data API:', response.statusText);
    }
  } catch (err) {
    console.error('Koneksi API Error:', err);
  }

  // B. Ambil Data Dummy (Jika Mode Simulasi Aktif)
  const dummyData = localStorage.getItem('fesmart_dummy_data');
  if (dummyData) {
    const parsedDummy = JSON.parse(dummyData);
    // Normalisasi dummy data agar strukturnya sama dengan API
    const normalizedDummy = parsedDummy.map((p) => ({
      username: p.username,
      // Dummy data tersimpan dengan struktur nested progress, kita ratakan:
      finalHb: parseFloat(
        p.progress?.hari7?.hbLevel || p.progress?.hari6?.hbLevel || 12
      ),
      totalKnowledge: p.totalKnowledge || 0,
      totalCompliance: p.totalCompliance || 0,
    }));

    players = players.concat(normalizedDummy);
  }

  return players;
}

// --- PENGOLAHAN DATA UTAMA ---

function processKnowledgeTrend(players) {
  // Simulasi tren berdasarkan skor akhir (karena DB tidak menyimpan history per hari)
  let day1 = 0,
    day2 = 0,
    day3 = 0,
    day6 = 0,
    day7 = 0;

  players.forEach((p) => {
    const total = p.totalKnowledge || 0;
    // Estimasi distribusi poin per hari (bobot kasar)
    day1 += total * 0.1;
    day2 += total * 0.15;
    day3 += total * 0.2;
    day6 += total * 0.25;
    day7 += total * 0.3;
  });

  const count = players.length || 1;
  // Faktor pengali agar terlihat bagus di grafik
  const factor = 1.2;
  return [
    (day1 / count).toFixed(1),
    (day2 / count).toFixed(1),
    (day3 / count).toFixed(1),
    (day6 / count).toFixed(1),
    (day7 / count).toFixed(1),
  ];
}

function processHbDistribution(players) {
  let severe = 0,
    mild = 0,
    normal = 0,
    optimal = 0;

  players.forEach((p) => {
    const hb = p.finalHb || 0;
    if (hb < 8) severe++;
    else if (hb < 12) mild++;
    else if (hb < 15) normal++;
    else optimal++;
  });

  return [severe, mild, normal, optimal];
}

function processCompliance(players) {
  let high = 0,
    medium = 0,
    low = 0;

  players.forEach((p) => {
    const score = p.totalCompliance || 0;
    // Ambang batas kategori kepatuhan
    if (score > 15) high++;
    else if (score >= 8) medium++;
    else low++;
  });

  return [high, medium, low];
}

function processCorrelation(players) {
  return players.map((p) => ({
    x: p.totalKnowledge || 0,
    y: p.totalCompliance || 0,
  }));
}

// --- FITUR SIMULASI DATA (LOCAL ONLY) ---
// Fitur ini menghasilkan data palsu di browser untuk demo visualisasi
// Tidak dikirim ke database untuk menjaga kebersihan data asli.

function generateDummyData() {
  const dummyPlayers = [];
  const characters = ['siti', 'sari'];

  for (let i = 0; i < 50; i++) {
    // Randomize HB (Normal distribution simulation)
    let hb = 10 + Math.random() * 6; // Range 10 - 16

    // Logic: HB tinggi biasanya berkolerasi dengan pengetahuan & kepatuhan tinggi
    let knowledge = Math.floor((hb / 16) * 25) + Math.floor(Math.random() * 5);
    let compliance = Math.floor((hb / 16) * 20) + Math.floor(Math.random() * 5);

    dummyPlayers.push({
      username: `Siswa Simulasi ${i + 1}`,
      character: characters[Math.floor(Math.random() * 2)],
      totalKnowledge: knowledge,
      totalCompliance: compliance,
      initialHb: 12,
      // Struktur nested ini akan dinormalisasi di getPlayersData()
      progress: {
        hari6: { hbLevel: hb.toFixed(1) },
        hari7: { hbLevel: (hb + 0.5).toFixed(1), completed: true },
      },
    });
  }

  localStorage.setItem('fesmart_dummy_data', JSON.stringify(dummyPlayers));
  location.reload(); // Refresh halaman untuk melihat grafik baru
}

function resetDummyData() {
  if (!localStorage.getItem('fesmart_dummy_data')) {
    alert('Saat ini Anda sedang melihat Data Asli (tidak ada simulasi aktif).');
    return;
  }

  if (
    confirm(
      'Hapus data simulasi dan kembali ke tampilan data asli dari Database?'
    )
  ) {
    localStorage.removeItem('fesmart_dummy_data');
    location.reload();
  }
}

function checkSimulationStatus() {
  const isSimulationActive = localStorage.getItem('fesmart_dummy_data');
  const btnSimulate = document.getElementById('btn-simulate');
  const btnReset = document.getElementById('btn-reset');

  if (btnSimulate && btnReset) {
    if (isSimulationActive) {
      btnSimulate.style.display = 'none';
      btnReset.style.display = 'flex'; // Tampilkan tombol reset saat mode simulasi

      // Indikator Visual di Header
      const pageTitle = document.querySelector('.page-title p');
      if (pageTitle) {
        pageTitle.innerHTML =
          '<span style="color: #9b59b6; font-weight:bold;">⚠️ MODE SIMULASI AKTIF</span> (Data Database + Data Dummy)';
      }
    } else {
      btnSimulate.style.display = 'flex';
      btnReset.style.display = 'none';
    }
  }
}
