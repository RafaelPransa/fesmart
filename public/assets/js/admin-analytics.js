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
    const prePostData = processPrePostComparison(players);
    const hbDistData = processHbDistribution(players);
    const completionData = processCompletionStatus(players);
    const correlationData = processCorrelation(players);

    // 3. Render Grafik Chart.js

    // A. Perbandingan Pre-test vs Post-test (Bar Chart)
    const ctxPrePost = document.getElementById('prePostComparisonChart');
    if (ctxPrePost) {
      new Chart(ctxPrePost, {
        type: 'bar',
        data: {
          labels: ['Skor Pengetahuan (Rata-rata)'],
          datasets: [
            {
              label: 'Pre-test',
              data: [prePostData.avgPre],
              backgroundColor: 'rgba(72, 128, 255, 0.7)',
              borderColor: '#4880FF',
              borderWidth: 1,
            },
            {
              label: 'Post-test',
              data: [prePostData.avgPost],
              backgroundColor: 'rgba(0, 182, 155, 0.7)',
              borderColor: '#00B69B',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 15, // Asumsi max score sekitar 10-15
              title: { display: true, text: 'Poin' },
            },
          },
          plugins: {
            legend: { position: 'top' },
          },
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
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              title: { display: true, text: 'Jumlah Pemain' },
            },
          },
        },
      });
    }

    // C. Status Penyelesaian (Doughnut Chart)
    const ctxComp = document.getElementById('completionChart');
    if (ctxComp) {
      new Chart(ctxComp, {
        type: 'doughnut',
        data: {
          labels: ['Selesai (Tamat)', 'Masih Berproses'],
          datasets: [
            {
              data: completionData,
              backgroundColor: ['#00B69B', '#FF9F43'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
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
              backgroundColor: 'rgba(155, 89, 182, 0.6)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Skor Pre-test' },
              beginAtZero: true,
              max: 20,
            },
            y: {
              title: { display: true, text: 'Skor Post-test' },
              beginAtZero: true,
              max: 20,
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `Pre: ${context.parsed.x}, Post: ${context.parsed.y}`;
                },
              },
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
      const normalizedDbData = dbData.map((p) => ({
        ...p,
        finalHb: parseFloat(p.finalHb || 0),
        totalKnowledge: parseInt(p.totalKnowledge || 0), // Pre-test
        totalCompliance: parseInt(p.totalCompliance || 0), // Post-test
        isCompleted: p.is_completed === true || p.isCompleted === true,
      }));
      players = players.concat(normalizedDbData);
    }
  } catch (err) {
    console.error('Koneksi API Error:', err);
  }

  // B. Ambil Data Dummy (Jika Mode Simulasi Aktif)
  const dummyData = localStorage.getItem('fesmart_dummy_data');
  if (dummyData) {
    const parsedDummy = JSON.parse(dummyData);
    const normalizedDummy = parsedDummy.map((p) => ({
      username: p.username,
      finalHb: parseFloat(p.finalHb || 12),
      totalKnowledge: p.totalKnowledge || 0,
      totalCompliance: p.totalCompliance || 0,
      isCompleted: p.isCompleted || false,
    }));

    players = players.concat(normalizedDummy);
  }

  return players;
}

// --- PENGOLAHAN DATA UTAMA ---

function processPrePostComparison(players) {
  let totalPre = 0;
  let totalPost = 0;
  let count = players.length || 1;

  players.forEach((p) => {
    totalPre += p.totalKnowledge || 0;
    totalPost += p.totalCompliance || 0;
  });

  return {
    avgPre: (totalPre / count).toFixed(1),
    avgPost: (totalPost / count).toFixed(1),
  };
}

function processHbDistribution(players) {
  let severe = 0,
    mild = 0,
    normal = 0,
    optimal = 0;

  players.forEach((p) => {
    const hb = p.finalHb || 0;
    if (hb > 0) {
      if (hb < 8) severe++;
      else if (hb < 12) mild++;
      else if (hb < 15) normal++;
      else optimal++;
    }
  });

  return [severe, mild, normal, optimal];
}

function processCompletionStatus(players) {
  let completed = 0;
  let inProgress = 0;

  players.forEach((p) => {
    if (p.isCompleted) completed++;
    else inProgress++;
  });

  return [completed, inProgress];
}

function processCorrelation(players) {
  return players.map((p) => ({
    x: p.totalKnowledge || 0,
    y: p.totalCompliance || 0,
  }));
}

// --- FITUR SIMULASI DATA (LOCAL ONLY) ---

function generateDummyData() {
  const dummyPlayers = [];
  const characters = ['siti', 'sari', 'clara'];

  for (let i = 0; i < 50; i++) {
    // Randomize HB
    let hb = 9 + Math.random() * 7; // Range 9 - 16

    // Logic: Pre-test biasanya lebih rendah dari Post-test
    let preTest = Math.floor(Math.random() * 6) + 5; // 5-10
    let postTest = preTest + Math.floor(Math.random() * 6); // preTest + 0-5

    // Bonus dari game
    let bonus = Math.random() > 0.5 ? 5 : 2;
    let finalKnowledge = preTest + bonus;

    let completed = Math.random() > 0.3;

    dummyPlayers.push({
      username: `Siswa Simulasi ${i + 1}`,
      character: characters[Math.floor(Math.random() * 3)],
      totalKnowledge: finalKnowledge,
      totalCompliance: postTest,
      finalHb: hb.toFixed(1),
      isCompleted: completed,
    });
  }

  localStorage.setItem('fesmart_dummy_data', JSON.stringify(dummyPlayers));
  location.reload();
}

function resetDummyData() {
  if (!localStorage.getItem('fesmart_dummy_data')) {
    alert('Saat ini Anda sedang melihat Data Asli.');
    return;
  }

  if (confirm('Hapus data simulasi dan kembali ke tampilan data asli?')) {
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
      btnReset.style.display = 'flex';
      const pageTitle = document.querySelector('.page-title p');
      if (pageTitle) {
        pageTitle.innerHTML =
          '<span style="color: #9b59b6; font-weight:bold;">⚠️ MODE SIMULASI AKTIF</span>';
      }
    } else {
      btnSimulate.style.display = 'flex';
      btnReset.style.display = 'none';
    }
  }
}
