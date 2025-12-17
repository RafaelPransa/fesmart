document.addEventListener('DOMContentLoaded', function () {
  // 1. Ambil ID dari URL (?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  if (!userId) {
    alert('ID Pemain tidak ditemukan.');
    window.location.href = 'index.html';
    return;
  }

  // 2. Fetch Data Pemain Spesifik
  loadPlayerDetail(userId);
});

async function loadPlayerDetail(id) {
  try {
    // --- FETCH KE BACKEND ---
    // Pastikan route backend: GET /api/admin/players/:id tersedia.
    // Jika tidak, kita bisa fetch all dan filter (opsional).

    // Asumsi: Backend sudah support GET by ID, atau kita gunakan fetch all & find (Fallback aman)
    let playerData = null;

    try {
      const response = await fetch(
        `/api/admin/players/${id}`
      );
      if (response.ok) {
        playerData = await response.json();
      } else {
        // Fallback: Fetch all dan cari manual jika route by ID belum dibuat backend
        const resAll = await fetch('/api/admin/players');
        const all = await resAll.json();
        playerData = all.find((p) => p.id == id);
      }
    } catch (e) {
      console.warn('Mencoba fallback fetch...', e);
    }

    if (!playerData) throw new Error('Data pemain tidak ditemukan di server.');

    // --- RENDER DATA ---
    renderProfile(playerData);
    renderTimeline(playerData);
    renderAnalysis(playerData);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('detail-content').innerHTML = `
        <div style="text-align:center; padding:50px; color:red;">
            <h3>❌ Gagal memuat data</h3>
            <p>${error.message}</p>
            <a href="index.html">Kembali</a>
        </div>`;
  }
}

// --- RENDER PROFIL & STATS ---
function renderProfile(user) {
  // Avatar
  const char = user.character || 'siti';
  document.getElementById(
    'p-avatar'
  ).src = `../assets/images/characters/${char}-normal.png`;

  // Info Dasar
  document.getElementById('p-name').textContent = user.username;
  // Format Tanggal (jika ada created_at dari DB, kalau tidak pakai default)
  const dateStr = user.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID')
    : 'Baru bergabung';
  document.getElementById(
    'p-date'
  ).innerHTML = `<i class="ph ph-calendar-blank"></i> ${dateStr}`;

  // Status Badge
  const badge = document.getElementById('p-status-badge');
  if (user.is_completed) {
    badge.textContent = 'Selesai (Tamat)';
    badge.className = 'status-badge status-completed';
  } else {
    badge.textContent = `Proses (${user.lastPlayedDay || 'Hari 1'})`;
    badge.className = 'status-badge status-progress';
  }

  // HB Meter
  const hb = parseFloat(user.finalHb || 0);
  document.getElementById('p-hb-val').textContent = `${hb.toFixed(1)} g/dL`;

  // Logika lebar bar HB (Max 18 g/dL)
  const hbPercent = Math.min((hb / 16) * 100, 100);
  document.getElementById('p-hb-fill').style.width = `${hbPercent}%`;

  // Warna Bar HB
  if (hb < 10)
    document.getElementById('p-hb-fill').style.background = '#ea5455'; // Merah
  else if (hb < 12)
    document.getElementById('p-hb-fill').style.background = '#ff9f43'; // Kuning
  else document.getElementById('p-hb-fill').style.background = '#00b69b'; // Hijau

  // Statistik Angka
  document.getElementById('score-knowledge').textContent =
    user.totalKnowledge || 0;
  document.getElementById('score-compliance').textContent =
    user.totalCompliance || 0;
  document.getElementById('last-day').textContent =
    user.lastPlayedDay || 'Hari 1';
}

// --- RENDER TIMELINE (VERSI LENGKAP 7 HARI) ---
function renderTimeline(user) {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  container.innerHTML = '';

  const events = [];
  const lastPlayed = user.lastPlayedDay || 'Hari 1';

  // Logika penentuan angka hari saat ini
  const dayParts = lastPlayed.split(' ');
  let currentDayNum = 1;
  if (lastPlayed.includes('Tamat')) {
    currentDayNum = 7;
  } else if (dayParts.length > 1) {
    currentDayNum = parseInt(dayParts[1]);
  }

  // --- DEFINISI SEMUA HARI (1-7) ---

  // Hari 1
  events.push({
    day: 'Hari 1',
    desc: 'Memulai petualangan, belajar gejala anemia, dan melakukan Pre-Test.',
    score: user.totalKnowledge > 0 ? 'Selesai' : '-',
    status: user.totalKnowledge > 0 ? 'good' : 'bad',
  });

  // Hari 2
  if (currentDayNum >= 2) {
    const isPatuh = user.totalCompliance >= 10;
    events.push({
      day: 'Hari 2',
      desc: isPatuh
        ? 'Patuh mengonsumsi Tablet Tambah Darah (TTD) tepat waktu.'
        : 'Melewatkan jadwal konsumsi Tablet Tambah Darah (TTD).',
      score: isPatuh ? 'Selesai' : '-',
      status: isPatuh ? 'good' : 'bad',
    });
  }

  // Hari 3
  if (currentDayNum >= 3) {
    events.push({
      day: 'Hari 3',
      desc: 'Tantangan memilah menu makanan kaya zat besi dan faktor penghambatnya.',
      score: 'Selesai',
      status: 'good',
    });
  }

  // Hari 4
  if (currentDayNum >= 4) {
    events.push({
      day: 'Hari 4',
      desc: 'Simulasi manajemen energi tubuh dan pemilihan nutrisi saat beraktivitas.',
      score: 'Selesai',
      status: 'good',
    });
  }

  // Hari 5
  if (currentDayNum >= 5) {
    events.push({
      day: 'Hari 5',
      desc: 'Mengerjakan kuis harian untuk menguji pemahaman pencegahan anemia.',
      score: 'Selesai',
      status: 'good',
    });
  }

  // Hari 6
  if (currentDayNum >= 6) {
    events.push({
      day: 'Hari 6',
      desc: 'Melakukan evaluasi kesehatan virtual dan mengikuti anjuran Guru UKS.',
      score: 'Selesai',
      status: 'good',
    });
  }

  // Hari 7 (Final)
  if (user.is_completed || currentDayNum >= 7) {
    const hbValue = parseFloat(user.finalHb || 0);
    events.push({
      day: 'Hari 7 (Final)',
      desc: `Menyelesaikan game puzzle Iron Match. HB Akhir: <strong>${hbValue.toFixed(
        1
      )} g/dL</strong>`,
      score: 'Selesai',
      status: hbValue >= 12 ? 'good' : 'bad',
    });
  }

  // Render ke HTML (Menggunakan style original yang Anda sukai)
  events.forEach((ev) => {
    container.innerHTML += `
      <div class="timeline-item">
        <div class="t-icon"></div>
        <div class="t-content">
          <div class="t-header">
            <span class="t-day">${ev.day}</span>
            <span class="t-score ${ev.status}">${ev.score}</span>
          </div>
          <p class="t-detail">${ev.desc}</p>
        </div>
      </div>`;
  });
}

// --- RENDER ANALISIS & REKOMENDASI ---
function renderAnalysis(user) {
  const hb = parseFloat(user.finalHb || 0);
  const know = parseInt(user.totalKnowledge || 0);
  const comp = parseInt(user.totalCompliance || 0);

  // 1. Analisis HB
  const hbEl = document.getElementById('analysis-hb');
  if (hb >= 12) {
    hbEl.innerHTML = `<span style="color:#00b69b">✅ Normal.</span> Kadar HB siswa dalam batas aman. Terus pertahankan pola makan.`;
  } else if (hb >= 10) {
    hbEl.innerHTML = `<span style="color:#ff9f43">⚠️ Ringan.</span> Sedikit di bawah normal. Perlu perhatian pada asupan Fe.`;
  } else {
    hbEl.innerHTML = `<span style="color:#ea5455">🚨 Anemia.</span> HB rendah. Sangat disarankan konsultasi ke UKS/Puskesmas.`;
  }

  // 2. Analisis Kebiasaan
  const habitEl = document.getElementById('analysis-habit');
  if (know > 60 && comp < 40) {
    habitEl.textContent =
      'Siswa MEMAHAMI teori (skor pengetahuan tinggi) tetapi SULIT menerapkan (skor kepatuhan rendah).';
  } else if (know < 40 && comp > 60) {
    habitEl.textContent =
      'Siswa PATUH minum TTD, namun pemahaman gizi dasarnya masih perlu ditingkatkan.';
  } else if (know > 60 && comp > 60) {
    habitEl.textContent =
      'Siswa memiliki keseimbangan yang baik antara pengetahuan dan perilaku.';
  } else {
    habitEl.textContent =
      'Siswa membutuhkan bimbingan intensif baik dalam edukasi maupun pengawasan minum TTD.';
  }

  // 3. Rekomendasi
  const recList = document.getElementById('recommendation-list');
  recList.innerHTML = '';

  const recs = [];
  if (hb < 12) recs.push('Pantau konsumsi Tablet Tambah Darah mingguan.');
  if (comp < 50)
    recs.push('Ingatkan untuk tidak minum teh/kopi setelah makan.');
  if (know < 50)
    recs.push('Berikan materi tambahan tentang sumber makanan zat besi.');
  if (recs.length === 0)
    recs.push('Pertahankan prestasi! Jadikan Duta Anti-Anemia sebaya.');

  recs.forEach((r) => {
    recList.innerHTML += `<li>${r}</li>`;
  });
}
