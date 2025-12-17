// Variabel global untuk menyimpan data pemain
let allPlayersData = [];
let playerToDeleteId = null;

document.addEventListener('DOMContentLoaded', function () {
  // 1. Cek Sesi Login Admin
  if (!sessionStorage.getItem('fesmart_admin_logged_in')) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Load Data Awal dari Server
  loadDashboardData();

  // 3. Setup Event Listener untuk Pencarian
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', function (e) {
      filterSearch(e.target.value);
    });
  }

  // 4. Setup Event Listener untuk Filter (Sorting)
  const knowFilter = document.getElementById('filter-knowledge');
  const compFilter = document.getElementById('filter-compliance');
  const hbFilter = document.getElementById('filter-hb');

  if (knowFilter) knowFilter.addEventListener('change', applyFilters);
  if (compFilter) compFilter.addEventListener('change', applyFilters);
  if (hbFilter) hbFilter.addEventListener('change', applyFilters);

  // 5. Setup Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.removeItem('fesmart_admin_logged_in');
      window.location.href = 'admin-login.html';
    });
  }

  // 6. Setup Modal Hapus & Hapus Semua
  setupDeleteModal();
  setupClearAllData();
});

// --- FUNGSI UTAMA: AMBIL DATA DARI API ---
async function loadDashboardData() {
  const tableBody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');

  tableBody.innerHTML =
    '<tr><td colspan="8" style="text-align:center; padding:30px;">⏳ Mengambil data...</td></tr>';

  try {
    const response = await fetch('/api/admin/players');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const players = await response.json();
    allPlayersData = players; // Simpan ke variabel global

    if (!players || players.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      updateStats([]);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Render tabel pertama kali
    renderTable(allPlayersData);
    updateStats(players);
  } catch (error) {
    console.error('Gagal memuat data:', error);
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding:20px;">❌ Gagal terhubung ke Backend.</td></tr>`;
  }
}

// --- FUNGSI EKSPOR CSV ---
window.exportData = function () {
  if (allPlayersData.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  // 1. Tentukan Header CSV
  const headers = [
    'Nama Pemain',
    'Karakter',
    'Progres Terakhir',
    'Total Pengetahuan',
    'Total Kepatuhan',
    'HB Akhir (g/dL)',
    'Status',
  ];

  // 2. Map data dari allPlayersData ke format baris CSV
  const csvRows = allPlayersData.map((user) => {
    return [
      `"${user.username || 'Anonymous'}"`,
      'Petualang',
      `"${user.lastPlayedDay || 'Hari 1'}"`,
      user.totalKnowledge || 0,
      user.totalCompliance || 0,
      parseFloat(user.finalHb || 0).toFixed(1),
      user.is_completed ? 'Selesai' : 'Proses',
    ].join(',');
  });

  // 3. Gabungkan header dan baris dengan baris baru (\n)
  const csvContent = [headers.join(','), ...csvRows].join('\n');

  // 4. Proses Download File
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Penamaan file otomatis dengan tanggal
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `Data_Pemain_FeSmart_${date}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- FUNGSI RENDER TABEL (Penting untuk Filter) ---
function renderTable(players) {
  const tableBody = document.getElementById('table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  players.forEach((user) => {
    const row = document.createElement('tr');

    const statusBadge = user.is_completed
      ? '<span class="status-badge status-completed">Selesai</span>'
      : '<span class="status-badge status-progress">Proses</span>';

    const finalHb = parseFloat(user.finalHb || 0);
    const hbClass = finalHb >= 12 ? 'hb-good' : 'hb-low';

    row.innerHTML = `
            <td>
                <div style="font-weight: 600;">${
                  user.username || 'Tanpa Nama'
                }</div>
                <div style="font-size: 12px; color: #888;">${
                  user.role || 'Siswa'
                }</div>
            </td>
            <td>Petualang</td>
            <td>${user.lastPlayedDay || 'Hari 1'}</td>
            <td>${user.totalKnowledge || 0}</td>
            <td>${user.totalCompliance || 0}</td>
            <td><span class="hb-badge ${hbClass}">${finalHb.toFixed(
      1
    )} g/dL</span></td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-detail" onclick="viewDetail('${
                      user.id
                    }')">
                        <i class="ph ph-eye"></i> Detail
                    </button>
                    <button class="btn-action btn-delete" onclick="openDeleteModal('${
                      user.id
                    }', '${user.username}')">
                        <i class="ph ph-trash"></i> Hapus
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// --- LOGIKA FILTER & SORTING ---
function applyFilters() {
  let filteredData = [...allPlayersData];
  const kVal = document.getElementById('filter-knowledge').value;
  const cVal = document.getElementById('filter-compliance').value;
  const hVal = document.getElementById('filter-hb')
    ? document.getElementById('filter-hb').value
    : 'none';

  // Reset dropdown lain agar tidak tumpang tindih
  if (this.id === 'filter-knowledge') {
    document.getElementById('filter-compliance').value = 'none';
    if (document.getElementById('filter-hb'))
      document.getElementById('filter-hb').value = 'none';
  } else if (this.id === 'filter-compliance') {
    document.getElementById('filter-knowledge').value = 'none';
    if (document.getElementById('filter-hb'))
      document.getElementById('filter-hb').value = 'none';
  } else if (this.id === 'filter-hb') {
    document.getElementById('filter-knowledge').value = 'none';
    document.getElementById('filter-compliance').value = 'none';
  }

  // Eksekusi Sorting
  if (kVal !== 'none') {
    filteredData.sort((a, b) =>
      kVal === 'high'
        ? b.totalKnowledge - a.totalKnowledge
        : a.totalKnowledge - b.totalKnowledge
    );
  } else if (cVal !== 'none') {
    filteredData.sort((a, b) =>
      cVal === 'high'
        ? b.totalCompliance - a.totalCompliance
        : a.totalCompliance - b.totalCompliance
    );
  } else if (hVal !== 'none') {
    filteredData.sort((a, b) =>
      hVal === 'high'
        ? parseFloat(b.finalHb) - parseFloat(a.finalHb)
        : parseFloat(a.finalHb) - parseFloat(b.finalHb)
    );
  }

  renderTable(filteredData);
}

// --- LOGIKA PENCARIAN (SEARCH) ---
function filterSearch(query) {
  const filter = query.toLowerCase();
  const filtered = allPlayersData.filter((user) =>
    user.username.toLowerCase().includes(filter)
  );
  renderTable(filtered);
}

// --- FUNGSI HAPUS SATUAN (MODAL) ---
function setupDeleteModal() {
  const modal = document.getElementById('deleteModal');
  const btnCancel = document.getElementById('btn-cancel-delete');
  const btnConfirm = document.getElementById('btn-confirm-delete');

  if (btnCancel) {
    btnCancel.onclick = () => modal.classList.remove('show');
  }

  if (btnConfirm) {
    btnConfirm.onclick = async () => {
      if (!playerToDeleteId) return;
      try {
        // PERBAIKAN: Tambahkan "/" setelah players
        const response = await fetch(`/api/admin/players/${playerToDeleteId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          modal.classList.remove('show');
          loadDashboardData();
        } else {
          alert('Gagal menghapus data dari server.');
        }
      } catch (err) {
        alert('Terjadi kesalahan koneksi.');
      }
    };
  }
}

window.openDeleteModal = function (id, name) {
  playerToDeleteId = id;
  const nameSpan = document.getElementById('delete-player-name');
  if (nameSpan) nameSpan.textContent = name;
  document.getElementById('deleteModal').classList.add('show');
};

// --- FUNGSI HAPUS SEMUA DATA ---
function setupClearAllData() {
  const btnTrigger = document.getElementById('btn-clear-data');
  const modal = document.getElementById('clearAllModal');
  const btnCancel = document.getElementById('btn-cancel-clear');
  const btnConfirm = document.getElementById('btn-confirm-clear');

  if (btnTrigger) {
    btnTrigger.onclick = () => modal.classList.add('show');
  }

  if (btnCancel) {
    btnCancel.onclick = () => modal.classList.remove('show');
  }

  if (btnConfirm) {
    btnConfirm.onclick = async function () {
      const originalText = this.textContent;
      this.textContent = 'Sedang Mereset...';
      this.disabled = true;

      try {
        // PERBAIKAN: Sesuaikan dengan endpoint reset-all di backend
        const response = await fetch('/api/admin/reset-all', {
          method: 'DELETE',
        });

        if (response.ok) {
          modal.classList.remove('show');
          alert('Berhasil! Seluruh data database telah dikosongkan.');
          loadDashboardData();
        } else {
          alert('Gagal mereset data.');
        }
      } catch (err) {
        alert('Gagal mereset data. Periksa koneksi backend.');
      } finally {
        this.textContent = originalText;
        this.disabled = false;
      }
    };
  }
}

// --- FUNGSI NAVIGASI DETAIL ---
window.viewDetail = function (userId) {
  window.location.href = `detail-progres.html?id=${userId}`;
};

// --- FUNGSI UPDATE STATS (WIDGET ATAS) ---
function updateStats(players) {
  const totalPlayers = players.length;
  const completedCount = players.filter((p) => p.is_completed).length;
  let totalHb = 0,
    totalKnow = 0,
    hbCount = 0;

  players.forEach((p) => {
    const hb = parseFloat(p.finalHb || 0);
    if (hb > 0) {
      totalHb += hb;
      hbCount++;
    }
    totalKnow += p.totalKnowledge || 0;
  });

  const avgHb = hbCount > 0 ? (totalHb / hbCount).toFixed(1) : 0;
  const avgKnow = totalPlayers > 0 ? Math.round(totalKnow / totalPlayers) : 0;

  const elTotal = document.getElementById('total-players');
  const elComplete = document.getElementById('completed-players');
  const elHb = document.getElementById('avg-hb');
  const elKnow = document.getElementById('avg-knowledge');

  if (elTotal) elTotal.textContent = totalPlayers;
  if (elComplete) elComplete.textContent = completedCount;
  if (elHb) elHb.textContent = `${avgHb} g/dL`;
  if (elKnow) elKnow.textContent = `${avgKnow} Poin`;
}
