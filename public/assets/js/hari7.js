document.addEventListener('DOMContentLoaded', function () {
  // --- 1. SETUP GLOBAL & DATA USER (INTEGRASI) ---
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  // KRITIS: Hentikan eksekusi jika tidak ada data user (mencegah eror null)
  if (!userData) {
    alert('Sesi tidak ditemukan. Silakan mulai dari halaman awal.');
    window.location.href = 'index.html';
    return;
  }

  // Load total score yang sudah terakumulasi dari hari-hari sebelumnya
  const totalKnowledge = userData.totalKnowledge || 0;
  const totalCompliance = userData.totalCompliance || 0;

  // Ambil HB terakhir yang tercatat dari Hari 6 (Data dari Database/LocalStorage)
  let currentHbLevel = parseFloat(
    userData.progress?.['hari6']?.hbLevel || userData.finalHb || 12
  );

  // DOM Elements
  const containerOpening = document.querySelector('.container-opening');
  const sceneOpening = document.querySelector('.scene-opening');
  const sceneGame = document.getElementById('scene-puzzle-game');
  const sceneDashboard = document.getElementById('scene-hasil-dashboard');
  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');

  const mainCharacter = {
    id: userData.character,
    name: userData.username || userData.characterName,
  };

  // --- 2. PUZZLE GAME STATE ---
  const GRID_SIZE = 4;
  const ITEMS = ['💊', '🥩', '🍊', '🍔']; // Fe, Makanan Fe, Vit C, Junk Food
  let gameGrid = [];
  let selectedTile = null;
  let score = 0;
  let movesLeft = 30;
  const HB_TARGET = 15.0;
  const HB_INCREMENT_PER_MATCH = 0.2;
  const HB_COMBO_BONUS = 0.6;
  const MATCH_SCORE = 10;
  const PENALTY_SCORE = 15;

  // Audio setup
  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');
  const soundMatchesPuzzle = document.getElementById('matches-puzzle');
  const soundNotMatchesPuzzle = document.getElementById('not-matches-puzzle');
  const soundGameFinish = document.getElementById('game-finish');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  // --- 3. HELPER FUNCTIONS (SOUND, IMAGE, TYPEWRITER) ---
  window.playClickSound = () => {
    if (isSoundOn && soundClick) soundClick.play();
  };
  window.playCoolClickSound = () => {
    if (isSoundOn && soundCoolClick) soundCoolClick.play();
  };
  window.playGameClickSound = () => {
    if (isSoundOn && soundGameClick) soundGameClick.play();
  };
  window.playSoundMathcesPuzzle = () => {
    if (isSoundOn && soundMatchesPuzzle) soundMatchesPuzzle.play();
  };
  window.playSoundNotMathcesPuzzle = () => {
    if (isSoundOn && soundNotMatchesPuzzle) soundNotMatchesPuzzle.play();
  };
  window.playSoundFinish = () => {
    if (isSoundOn && soundGameFinish) soundGameFinish.play();
  };

  window.playBackgroundMusic = function () {
    if (isSoundOn && bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch(() => {});
    }
  };

  window.toggleSound = () => {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');
    const soundBtn = document.querySelector(
      '.control-btn[onclick="toggleSound()"]'
    );
    if (soundBtn) soundBtn.innerHTML = isSoundOn ? '🔊 Sound' : '🔇 Sound';
    if (isSoundOn) playBackgroundMusic();
    else if (bgMusic) bgMusic.pause();
  };

  function getCharacterImage(characterId, emotion = 'normal') {
    const characterImages = {
      siti: {
        normal: 'assets/images/characters/siti-normal.png',
        murung: 'assets/images/characters/siti-murung.png',
        senang: 'assets/images/characters/siti-senang.png',
        berpikir: 'assets/images/characters/siti-berpikir.png',
      },
      sari: {
        normal: 'assets/images/characters/sari-normal.png',
        murung: 'assets/images/characters/sari-murung.png',
        senang: 'assets/images/characters/sari-senang.png',
        berpikir: 'assets/images/characters/sari-berpikir.png',
      },
    };
    return (
      characterImages[characterId]?.[emotion] ||
      characterImages[characterId]?.['normal']
    );
  }

  function typeWriterMultiple(lines, speed = 40, lineDelay = 800) {
    let lineIndex = 0;
    let charIndex = 0;
    teksOpening.innerHTML = '';
    function typeLine() {
      if (lineIndex < lines.length) {
        if (charIndex === 0 && lineIndex > 0) teksOpening.innerHTML += '<br>';
        if (charIndex < lines[lineIndex].length) {
          const currentChar = lines[lineIndex].charAt(charIndex);
          if (charIndex === 0) teksOpening.innerHTML += '<strong>';
          teksOpening.innerHTML += currentChar;
          if (currentChar === ':' && charIndex < 10)
            teksOpening.innerHTML += '</strong>';
          charIndex++;
          setTimeout(typeLine, speed);
        } else {
          lineIndex++;
          charIndex = 0;
          setTimeout(typeLine, lineDelay);
        }
      }
    }
    typeLine();
  }

  // --- 4. INITIALISATION ---
  initGame();

  function initGame() {
    document.getElementById('main-character-img').src = getCharacterImage(
      mainCharacter.id,
      'berpikir'
    );
    setTimeout(() => {
      containerOpening.style.transform = 'translateY(-100vh)';
      containerOpening.style.transition = 'transform 1.5s ease';
      setTimeout(() => {
        sceneOpening.style.opacity = '1';
        startOpeningScene();
        window.playBackgroundMusic();
      }, 1600);
    }, 2000);
  }

  function startOpeningScene() {
    document.getElementById('character-main').classList.add('slide-main');
    document.getElementById('character-guru').classList.add('slide-guru');
    const dialogLines = [
      'GURU UKS: "Selamat! Ini adalah tantangan terakhir FeSmart. Tujuanmu: pulihkan HB mu ke level optimal!"',
      `${mainCharacter.name.toUpperCase()}: "Saya siap, Bu! Saya akan gunakan semua pengetahuan Fe + Vitamin C saya!"`,
    ];
    typeWriterMultiple(dialogLines, 40, 800);
    setTimeout(() => {
      btnStart.classList.remove('btn-hidden');
      btnStart.style.opacity = '1';
    }, 9000);
  }

  // --- 5. PUZZLE GAME LOGIC ---
  btnStart.addEventListener('click', startPuzzleGame);

  function startPuzzleGame() {
    playGameClickSound();
    sceneOpening.style.opacity = '0';
    setTimeout(() => {
      sceneOpening.style.display = 'none';
      sceneGame.style.display = 'flex';

      // 1. Render Tampilan
      injectGameUI();

      // 2. Siapkan Grid
      initializeGrid();
      drawGrid();

      // 3. PASANG EVENT LISTENER TOMBOL ACAK (Di sini kuncinya)
      const btnShuffle = document.getElementById('btn-shuffle');
      if (btnShuffle) {
        btnShuffle.onclick = function () {
          // Efek suara & visual
          playCoolClickSound();
          const grid = document.getElementById('game-grid');

          // Animasi berputar sedikit
          this.style.transform = 'rotate(180deg)';
          setTimeout(() => {
            this.style.transform = 'rotate(0deg)';
          }, 300);

          // Animasi grid kedip
          grid.style.opacity = '0';

          setTimeout(() => {
            manualShuffle(); // Panggil fungsi pengacak manual
            grid.style.opacity = '1';
          }, 200);
        };
      }
    }, 800);
  }

  function injectGameUI() {
    sceneGame.innerHTML = `
      <div class="puzzle-container">
        <div class="puzzle-header">
          <h2>🧩 Iron Match: Pulihkan HB!</h2>
          <h3>Target: ${HB_TARGET.toFixed(1)} g/dL</h3>
        </div>
        
        <div class="puzzle-stats-container">
          <div class="stat-item">
            <span class="stat-label">HB Level:</span>
            <span class="stat-value hb-value" id="hb-level-display">${currentHbLevel.toFixed(
              1
            )}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">Gerakan:</span>
            <span class="stat-value" id="moves-left-display">${movesLeft}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Skor:</span>
            <span class="stat-value" id="score-display">0</span>
          </div>
          
          <div class="stat-item" style="flex-direction: column; gap: 5px;">
             <button id="btn-shuffle" class="btn-shuffle" title="Acak Ulang">🔀</button>
             <span class="stat-label" style="font-size: 0.8em;">Acak</span>
          </div>
        </div>

        <div class="game-grid" id="game-grid"></div>
        <p id="game-feedback" class="game-feedback"></p>
        <button id="btn-end-game" class="btn-primary btn-large" style="display:none; margin-top:20px;">Lihat Laporan Akhir</button>
      </div>
      <div class="character-game-puzzle">
        <img id="main-character-game-img" src="${getCharacterImage(
          mainCharacter.id,
          'berpikir'
        )}" alt="Karakter" />
      </div>`;
  }

  function initializeGrid() {
    do {
      gameGrid = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        gameGrid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          let newItem;
          do {
            newItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          } while (
            (r >= 2 &&
              gameGrid[r - 1][c] === newItem &&
              gameGrid[r - 2][c] === newItem) ||
            (c >= 2 &&
              gameGrid[r][c - 1] === newItem &&
              gameGrid[r][c - 2] === newItem)
          );
          gameGrid[r][c] = newItem;
        }
      }
    } while (!checkSolvable());
  }

  function checkSolvable() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (c < GRID_SIZE - 1) {
          // Swap horizontal
          [gameGrid[r][c], gameGrid[r][c + 1]] = [
            gameGrid[r][c + 1],
            gameGrid[r][c],
          ];
          if (checkMatchesTemp()) {
            [gameGrid[r][c], gameGrid[r][c + 1]] = [
              gameGrid[r][c + 1],
              gameGrid[r][c],
            ];
            return true;
          }
          [gameGrid[r][c], gameGrid[r][c + 1]] = [
            gameGrid[r][c + 1],
            gameGrid[r][c],
          ];
        }
        if (r < GRID_SIZE - 1) {
          // Swap vertikal
          [gameGrid[r][c], gameGrid[r + 1][c]] = [
            gameGrid[r + 1][c],
            gameGrid[r][c],
          ];
          if (checkMatchesTemp()) {
            [gameGrid[r][c], gameGrid[r + 1][c]] = [
              gameGrid[r + 1][c],
              gameGrid[r][c],
            ];
            return true;
          }
          [gameGrid[r][c], gameGrid[r + 1][c]] = [
            gameGrid[r + 1][c],
            gameGrid[r][c],
          ];
        }
      }
    }
    return false;
  }

  function checkMatchesTemp() {
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE - 2; c++)
        if (
          gameGrid[r][c] === gameGrid[r][c + 1] &&
          gameGrid[r][c] === gameGrid[r][c + 2]
        )
          return true;
    for (let c = 0; c < GRID_SIZE; c++)
      for (let r = 0; r < GRID_SIZE - 2; r++)
        if (
          gameGrid[r][c] === gameGrid[r + 1][c] &&
          gameGrid[r][c] === gameGrid[r + 2][c]
        )
          return true;
    return false;
  }

  function drawGrid() {
    const gridContainer = document.getElementById('game-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = document.createElement('div');
        tile.className = 'game-tile';
        tile.dataset.row = r;
        tile.dataset.col = c;
        tile.textContent = gameGrid[r][c];
        tile.onclick = handleTileClick;
        gridContainer.appendChild(tile);
      }
    }
    updateGameStats();
  }

  function updateGameStats() {
    document.getElementById(
      'hb-level-display'
    ).textContent = `${currentHbLevel.toFixed(1)} g/dL`;
    document.getElementById('moves-left-display').textContent = movesLeft;
    document.getElementById('score-display').textContent = score;
    if (currentHbLevel >= HB_TARGET) endGame(true, 'Target HB Tercapai!');
    else if (movesLeft <= 0) endGame(false, 'Gerakan Habis!');
  }

  // --- GANTI FUNGSI handleTileClick DENGAN INI ---
  function handleTileClick(e) {
    playClickSound();
    const tile = e.target; // Tile yang diklik (Tujuan)
    const r = parseInt(tile.dataset.row);
    const c = parseInt(tile.dataset.col);

    // Jika belum ada yang dipilih, pilih tile ini
    if (!selectedTile) {
      selectedTile = tile;
      selectedTile.classList.add('selected');
      return;
    }

    // Jika klik tile yang sama, batalkan pilihan
    if (selectedTile === tile) {
      selectedTile.classList.remove('selected');
      selectedTile = null;
      return;
    }

    const sR = parseInt(selectedTile.dataset.row);
    const sC = parseInt(selectedTile.dataset.col);

    // Cek apakah tile bersebelahan (atas/bawah/kiri/kanan)
    if (Math.abs(r - sR) + Math.abs(c - sC) === 1) {
      // --- LOGIKA ANIMASI SWAP ---

      // 1. Matikan pointer events agar user tidak klik-klik cepat saat animasi
      document.getElementById('game-grid').style.pointerEvents = 'none';

      // 2. Hitung jarak perpindahan (100% dari lebar/tinggi tile)
      const xDiff = (c - sC) * 100;
      const yDiff = (r - sR) * 100;

      // 3. Terapkan CSS Transform untuk menggeser visual
      selectedTile.style.transform = `translate(${xDiff}%, ${yDiff}%)`;
      tile.style.transform = `translate(${-xDiff}%, ${-yDiff}%)`;

      // Tambahkan class swapping untuk z-index
      selectedTile.classList.add('swapping');
      tile.classList.add('swapping');

      // 4. Tunggu animasi CSS selesai (300ms sesuai CSS)
      setTimeout(() => {
        // --- LOGIKA DATA SETELAH ANIMASI SELESAI ---

        // Tukar data di array Grid
        [gameGrid[r][c], gameGrid[sR][sC]] = [gameGrid[sR][sC], gameGrid[r][c]];

        // Cek apakah ada match
        let matches = checkMatches();

        if (matches.length > 0) {
          // JIKA MATCH:
          movesLeft--;
          processMatches(matches); // Ini akan memanggil drawGrid() nanti
        } else {
          // JIKA TIDAK MATCH:
          // Tukar kembali data array (karena swap tidak valid)
          [gameGrid[r][c], gameGrid[sR][sC]] = [
            gameGrid[sR][sC],
            gameGrid[r][c],
          ];

          playSoundNotMathcesPuzzle();

          // Animate Swap Back (Opsional: animasi balik, atau langsung redraw)
          // Di sini kita langsung redraw untuk "snap back" cepat agar responsif
          drawGrid();
        }

        // Reset state seleksi
        selectedTile = null;

        // Hidupkan kembali pointer events
        document.getElementById('game-grid').style.pointerEvents = 'auto';
      }, 300); // Waktu harus sama dengan transition di CSS (0.3s)
    } else {
      // Jika klik tile yang jauh (tidak bersebelahan), pindah seleksi
      selectedTile.classList.remove('selected');
      selectedTile = tile;
      selectedTile.classList.add('selected');
    }
  }

  function checkMatches() {
    let matches = [];
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE - 2; c++)
        if (
          gameGrid[r][c] &&
          gameGrid[r][c] === gameGrid[r][c + 1] &&
          gameGrid[r][c] === gameGrid[r][c + 2]
        )
          matches.push({ r, c, item: gameGrid[r][c], dir: 'H' });
    for (let c = 0; c < GRID_SIZE; c++)
      for (let r = 0; r < GRID_SIZE - 2; r++)
        if (
          gameGrid[r][c] &&
          gameGrid[r][c] === gameGrid[r + 1][c] &&
          gameGrid[r][c] === gameGrid[r + 2][c]
        )
          matches.push({ r, c, item: gameGrid[r][c], dir: 'V' });
    return matches;
  }

  // --- GANTI FUNGSI processMatches DENGAN INI ---
  function processMatches(matches) {
    // 1. Matikan klik selama proses animasi berlangsung
    document.getElementById('game-grid').style.pointerEvents = 'none';

    let tilesToRemove = new Set();
    let hbChange = 0;
    let comboCount = 0;

    // Hitung Skor & Efek Visual (Highlight)
    matches.forEach((m) => {
      // Tandai visual tile yang akan dihapus
      for (let i = 0; i < 3; i++) {
        const r = m.dir === 'H' ? m.r : m.r + i;
        const c = m.dir === 'H' ? m.c + i : m.c;
        tilesToRemove.add(`${r},${c}`);

        // Tambahkan efek visual CSS
        const tileEl = document.querySelector(
          `.game-tile[data-row="${r}"][data-col="${c}"]`
        );
        if (tileEl) tileEl.classList.add('matched-effect');
      }

      // Logika Skor
      score += MATCH_SCORE;
      const isFe = m.item === '💊' || m.item === '🥩';
      if (isFe || m.item === '🍊') {
        hbChange += HB_INCREMENT_PER_MATCH;
        comboCount++;
      } else if (m.item === '🍔') {
        score = Math.max(0, score - PENALTY_SCORE); // Jangan sampai minus
        hbChange -= HB_INCREMENT_PER_MATCH;
      }
    });

    if (comboCount > 1) hbChange += HB_COMBO_BONUS;
    currentHbLevel = Math.max(8, Math.min(16, currentHbLevel + hbChange));

    // Mainkan suara match
    playSoundMathcesPuzzle();

    // --- STEP 1: TUNGGU ANIMASI MENGHILANG (300ms) ---
    setTimeout(() => {
      // Hapus data dari array grid
      tilesToRemove.forEach((pos) => {
        const [r, c] = pos.split(',').map(Number);
        gameGrid[r][c] = null;
      });

      // Turunkan item (Gravity) & Isi yang kosong
      applyGravity();

      // Render ulang grid (User melihat item baru sudah mengisi tempat)
      drawGrid();

      // --- STEP 2: JEDA AGAR USER BISA LIHAT ITEM BARU (600ms) ---
      // Ini bagian yang Anda minta agar tidak terlalu cepat
      setTimeout(() => {
        // Cek lagi apakah item baru tersebut membuat match baru (Cascade)
        let cascade = checkMatches();

        if (cascade.length > 0) {
          // Jika ada match lagi, ulangi proses (Recursion)
          processMatches(cascade);
        } else {
          // Jika tidak ada match lagi, kembalikan kontrol ke user
          document.getElementById('game-grid').style.pointerEvents = 'auto';

          // Cek Deadlock
          if (!checkSolvable()) {
            // Jika macet, acak otomatis atau biarkan tombol acak manual
            // shuffleGrid(); // Opsional: Auto shuffle
            console.log('Deadlock detected');
          }
        }
      }, 600); // <-- JEDA 0.6 DETIK SEBELUM CEK MATCH BERIKUTNYA
    }, 300); // Waktu untuk animasi 'matched-effect'
  }

  function applyGravity() {
    for (let c = 0; c < GRID_SIZE; c++) {
      let writeRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--)
        if (gameGrid[r][c]) {
          [gameGrid[writeRow][c], gameGrid[r][c]] = [gameGrid[r][c], null];
          writeRow--;
        }
      for (let r = 0; r < GRID_SIZE; r++)
        if (!gameGrid[r][c])
          gameGrid[r][c] = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    }
  }

  function shuffleGrid() {
    let items = gameGrid.flat();
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++) gameGrid[r][c] = items.shift();
    drawGrid();
  }

  function manualShuffle() {
    // 1. Ambil semua item yang ada (flatten array)
    let validItems = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (gameGrid[r][c]) validItems.push(gameGrid[r][c]);
      }
    }

    // 2. Acak array (Fisher-Yates Shuffle)
    for (let i = validItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validItems[i], validItems[j]] = [validItems[j], validItems[i]];
    }

    // 3. Masukkan kembali ke Grid
    let index = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // Pastikan grid terisi ulang (jika ada yg null, isi random)
        if (index < validItems.length) {
          gameGrid[r][c] = validItems[index++];
        } else {
          gameGrid[r][c] = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        }
      }
    }

    // 4. Gambar Ulang
    drawGrid();

    // Opsional: Cek apakah langsung ada match setelah diacak
    setTimeout(() => {
      let matches = checkMatches();
      if (matches.length > 0) {
        processMatches(matches);
      }
    }, 500);
  }

  function endGame(win, msg) {
    document.getElementById('game-grid').style.pointerEvents = 'none';
    document.getElementById('game-feedback').textContent = msg;
    const btn = document.getElementById('btn-end-game');
    btn.style.display = 'block';
    btn.onclick = () => {
      playSoundFinish();
      showFinalDashboard(score, win);
    };
  }

  // --- 6. FINAL DASHBOARD & BACKEND SAVE (INTEGRASI) ---
  function showFinalDashboard(finalScore, win) {
    sceneGame.style.display = 'none';
    sceneDashboard.style.display = 'block';

    const knowledgeBonus = win ? 5 : 2;
    const finalHb = currentHbLevel.toFixed(1);
    const totalKnowledgePoints = totalKnowledge + knowledgeBonus;

    // Update Local Data (Backup)
    userData.progress['hari7'] = {
      completed: true,
      score: finalScore,
      hbLevel: finalHb,
    };
    userData.totalKnowledge = totalKnowledgePoints;
    userData.finalHb = finalHb;
    localStorage.setItem('fesmart_user', JSON.stringify(userData));

    // Update UI Dashboard
    document.getElementById(
      'score-pengetahuan-akhir'
    ).textContent = `${totalKnowledgePoints} Poin`;
    document.getElementById(
      'score-kepatuhan-akhir'
    ).textContent = `${totalCompliance} Poin`;

    let emotion = win ? 'senang' : currentHbLevel >= 12 ? 'normal' : 'murung';
    document.getElementById('main-character-hasil-img').src = getCharacterImage(
      mainCharacter.id,
      emotion
    );
    document.getElementById('final-message').innerHTML = `<strong>${
      win ? '🎉 Hebat! HB Optimal!' : '👍 HB mu Normal, tetap jaga nutrisi!'
    }</strong>`;

    // Render Grafik Chart.js
    new Chart(document.getElementById('xyChart'), {
      type: 'bar',
      data: {
        labels: ['Pengetahuan', 'Kepatuhan'],
        datasets: [
          {
            label: 'Poin Kumulatif',
            data: [totalKnowledgePoints, totalCompliance],
            backgroundColor: ['#FFA500', '#4CD964'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: `HB Akhir: ${finalHb} g/dL` },
        },
      },
    });

    // --- INTEGRASI BACKEND: SIMPAN FINAL ---
    const btnSelesai = document.getElementById('btn-selesai');
    btnSelesai.textContent = 'Menyimpan Data Akhir...';
    btnSelesai.disabled = true;

    const payload = {
      userId: userData.id,
      totalKnowledge: totalKnowledgePoints,
      totalCompliance: totalCompliance,
      finalHb: parseFloat(finalHb),
      lastDay: 'Tamat (Hari 7)',
      isCompleted: true, // Tanda Game Selesai
    };

    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Final Save Success:', data);
        btnSelesai.textContent = 'Selesai & Menu Utama';
        btnSelesai.disabled = false;
        btnSelesai.onclick = () => {
          localStorage.removeItem('fesmart_user_session');
          window.location.href = 'index.html';
        };
      })
      .catch((err) => {
        console.error('Final Save Failed:', err);
        btnSelesai.textContent = 'Selesai (Offline)';
        btnSelesai.disabled = false;
        btnSelesai.onclick = () => {
          window.location.href = 'index.html';
        };
      });
  }
});
