document.addEventListener('DOMContentLoaded', function () {
  // --- 1. SETUP DATA USER & KONEKSI BACKEND ---
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  if (!userData) {
    alert('Sesi habis. Silakan login kembali.');
    window.location.href = 'index.html';
    return;
  }

  // --- 2. LOGIKA HARI (3, 4, atau 5) ---
  let currentDay =
    parseInt(localStorage.getItem('fesmart_current_day_loop')) || 3;

  // State Global
  let dayScore = 0;
  let currentKnowledge = userData.totalKnowledge || 0;
  let currentCompliance = userData.totalCompliance || 0;
  let currentHb = parseFloat(
    userData.progress?.hari2?.hbLevel || userData.initialHb || 12.0
  );

  // --- 3. DOM ELEMENTS ---
  const containerOpening = document.querySelector('.container-opening');
  const sceneOpening = document.querySelector('.scene-opening');

  // Scenes
  const scenePilihMenu = document.querySelector('.scene-pilih-menu'); // Hari 3
  const sceneAktivitas = document.querySelector('.scene-aktivitas'); // Hari 4
  const sceneKuisHarian = document.getElementById('scene-kuis-harian'); // Hari 5
  const sceneHasil = document.querySelector('.scene-hasil'); // Hasil Akhir

  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');
  const hariTitle = document.getElementById('hari-title');
  const currentDayBtn = document.getElementById('current-day-btn');

  // --- 4. AUDIO & VISUAL HELPERS ---
  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');
  const teksOpeningSound = document.getElementById('teks-opening-sound');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  // --- Fungsi Global Audio ---
  window.playClickSound = function () {
    if (isSoundOn && soundClick) {
      soundClick.currentTime = 0;
      soundClick.play().catch((e) => console.log('Click sound failed:', e));
    }
  };

  window.playCoolClickSound = function () {
    if (isSoundOn && soundCoolClick) {
      soundCoolClick.currentTime = 0;
      soundCoolClick.play().catch((e) => console.log('Cool click failed:', e));
    }
  };

  window.playGameClickSound = function () {
    if (isSoundOn && soundGameClick) {
      soundGameClick.currentTime = 0;
      soundGameClick.play().catch((e) => console.log('Game click failed:', e));
    }
  };

  window.playTeksOpeningSound = function () {
    if (isSoundOn && teksOpeningSound) {
      teksOpeningSound.currentTime = 0;
      teksOpeningSound
        .play()
        .catch((e) => console.log('Text sound failed:', e));
    }
  };

  window.playNotificationSound = function () {
    if (isSoundOn && notificationSound) {
      notificationSound.currentTime = 0;
      notificationSound
        .play()
        .catch((e) => console.log('Notif sound failed:', e));
    }
  };

  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');

    const soundBtn = document.querySelector(
      '.control-btn[onclick="toggleSound()"]'
    );
    if (soundBtn) {
      soundBtn.innerHTML = isSoundOn ? '🔊 Sound' : '🔇 Sound';
    }

    if (isSoundOn) playBackgroundMusic();
    else if (bgMusic) bgMusic.pause();
  };

  window.playBackgroundMusic = function () {
    if (isSoundOn && bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch((e) => console.log('BG Music failed:', e));
    }
  };

  function getCharacterImage(characterId, emotion = 'normal') {
    const id = characterId || 'siti';
    return `assets/images/characters/${id}-${emotion}.png`;
  }

  // Update Karakter Awal
  const mainImg = document.getElementById('main-character-img');
  if (mainImg) {
    mainImg.src = getCharacterImage(userData.character, 'normal');
    mainImg.alt = userData.username;
  }

  function typeWriterMultiple(lines, speed = 40, lineDelay = 800) {
    if (!teksOpening) return;
    let lineIndex = 0;
    let charIndex = 0;
    teksOpening.innerHTML = '';

    function typeLine() {
      if (lineIndex < lines.length) {
        if (charIndex === 0 && lineIndex > 0) teksOpening.innerHTML += '<br>';
        if (charIndex < lines[lineIndex].length) {
          const char = lines[lineIndex].charAt(charIndex);
          if (charIndex === 0) teksOpening.innerHTML += '<strong>';
          teksOpening.innerHTML += char;
          if (char === ':' && charIndex < 15)
            teksOpening.innerHTML += '</strong>';
          if (charIndex % 3 === 0) window.playCoolClickSound(); // Sound effect
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

  // --- 5. DATA PERMAINAN LENGKAP ---

  // DATA HARI 3: MENU GAME
  const menuGameData = [
    { name: 'Hati Ayam', icon: '🍗', category: 'zat-besi' },
    { name: 'Bayam', icon: '🍃', category: 'zat-besi' },
    { name: 'Daging Sapi', icon: '🥩', category: 'zat-besi' },
    { name: 'Teh', icon: '🍵', category: 'penghambat' },
    { name: 'Kopi', icon: '☕', category: 'penghambat' },
    { name: 'Junk Food', icon: '🍔', category: 'penghambat' },
  ].sort(() => Math.random() - 0.5);

  // DATA HARI 5: KUIS LENGKAP
  const masterDailyKuis = [
    {
      soal: '1. Apa penyebab utama anemia pada remaja putri?',
      opsi: [
        'Kurang minum air putih',
        'Kekurangan zat besi',
        'Terlalu sering olahraga',
        'Kebanyakan tidur',
      ],
      jawaban: 1, // Kekurangan zat besi
      score: 20,
    },
    {
      soal: '2. Kebiasaan makan apa yang dapat meningkatkan risiko anemia?',
      opsi: [
        'Jarang makan sumber protein hewani',
        'Sering makan sayuran hijau',
        'Minum jus buah setiap hari',
        'Makan tiga kali sehari',
      ],
      jawaban: 0, // Jarang makan sumber protein hewani
      score: 20,
    },
    {
      soal: '3. Kondisi fisiologis apa yang membuat remaja putri lebih berisiko anemia?',
      opsi: [
        'Pertumbuhan rambut',
        'Menstruasi',
        'Suhu tubuh menurun',
        'Tidak suka olahraga',
      ],
      jawaban: 1, // Menstruasi
      score: 20,
    },
    {
      soal: '4. Sikap mana yang dapat menyebabkan anemia?',
      opsi: [
        'Mengabaikan pola makan seimbang',
        'Mengonsumsi tablet Fe sesuai anjuran',
        'Rajin makan makanan tinggi zat besi',
        'Olahraga teratur',
      ],
      jawaban: 0, // Mengabaikan pola makan seimbang
      score: 20,
    },
    {
      soal: '5. Mengapa minum teh setelah makan dapat meningkatkan risiko anemia?',
      opsi: [
        'Karena teh membuat kantuk',
        'Karena teh menghambat penyerapan zat besi',
        'Karena teh membuat perut kembung',
        'Karena teh menambah nafsu makan',
      ],
      jawaban: 1, // Menghambat penyerapan zat besi
      score: 20,
    },
  ];

  // --- 6. INIT GAME SEQUENCE ---
  initGame();

  function initGame() {
    // Update Judul Hari
    if (hariTitle) hariTitle.textContent = `Hari - ${currentDay}`;
    if (currentDayBtn) currentDayBtn.textContent = currentDay;

    // Config Teks Tombol & Subtitle
    const openingSubtitle = document.querySelector('.opening-subtitle');
    let btnText = 'Mulai';
    let subtitle = '';

    if (currentDay === 3) {
      btnText = 'Mulai Tantangan Menu';
      subtitle = 'Memilih Makanan Zat Besi';
    } else if (currentDay === 4) {
      btnText = 'Mulai Aktivitas';
      subtitle = 'Simulasi Energi Harian';
    } else if (currentDay === 5) {
      btnText = 'Mulai Kuis Harian';
      subtitle = 'Uji Pengetahuan Anemia';
    }

    if (btnStart) btnStart.textContent = btnText;
    if (openingSubtitle) openingSubtitle.textContent = subtitle;

    // Animasi Opening
    if (containerOpening) {
      setTimeout(() => {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.5s ease';
        setTimeout(() => {
          if (sceneOpening) sceneOpening.style.opacity = '1';
          startOpeningScene();
        }, 1600);
      }, 2000);
    }
  }

  function startOpeningScene() {
    const charMain = document.getElementById('character-main');
    const charTeman = document.getElementById('character-teman');

    if (charMain) charMain.classList.add('slide-main');
    if (charTeman) charTeman.classList.add('slide-teman');

    setTimeout(() => {
      showDialog();
    }, 1500);

    setTimeout(() => {
      if (btnStart) {
        btnStart.classList.remove('btn-hidden');
        btnStart.style.opacity = '1';
      }
    }, 9000);
  }

  function showDialog() {
    let specificMsg = '';
    if (currentDay === 3)
      specificMsg =
        'Hari ini kita belajar membedakan makanan sumber zat besi dan penghambatnya.';
    else if (currentDay === 4)
      specificMsg =
        'Kamu begadang semalam. Pilih asupan yang tepat untuk memulihkan energimu!';
    else if (currentDay === 5)
      specificMsg = 'Ayo kita uji pemahamanmu tentang anemia lewat kuis ini!';

    const dialogLines = [
      `TEMAN: "Hai ${userData.username || 'Kawan'}! ${specificMsg}"`,
      `PETUALANG: "Siap! Aku akan melakukan yang terbaik."`,
    ];
    typeWriterMultiple(dialogLines, 40, 800);
  }

  // --- ROUTER TOMBOL START ---
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      window.playGameClickSound();
      if (currentDay === 3) startHari3MenuGame();
      else if (currentDay === 4) startHari4Aktivitas();
      else if (currentDay === 5) startHari5Kuis();
    });
  }

  // ============================================================
  // HARI 3: PILIH MENU (FULL 6 ITEMS)
  // ============================================================
  function startHari3MenuGame() {
    sceneOpening.style.display = 'none';
    scenePilihMenu.style.display = 'block';

    const charImg = document.getElementById('main-character-menu-img');
    if (charImg)
      charImg.src = getCharacterImage(userData.character, 'berpikir');

    const container = document.getElementById('menu-options-container');
    container.innerHTML = '';
    document.getElementById('drop-zat-besi').innerHTML = '';
    document.getElementById('drop-penghambat').innerHTML = '';

    // Render 6 Kartu
    menuGameData.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.draggable = true;
      card.id = `drag-${i}`;
      card.dataset.category = item.category;
      card.innerHTML = `<span>${item.icon}</span>${item.name}`;

      card.addEventListener('dragstart', (e) =>
        e.dataTransfer.setData('text', e.target.id)
      );
      container.appendChild(card);
    });

    document.querySelectorAll('.drop-area').forEach((area) => {
      area.addEventListener('dragover', (e) => e.preventDefault());
      area.addEventListener('drop', handleDrop);
    });

    document.getElementById('btn-submit-menu').onclick = finishHari3;
  }

  function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const el = document.getElementById(id);
    const zone = e.target.closest('.drop-area');
    const feedback = document.getElementById('menu-game-feedback');

    if (el && zone && el.dataset.category === zone.dataset.category) {
      window.playCoolClickSound();
      const clone = el.cloneNode(true);
      clone.draggable = false;
      clone.style.transform = 'scale(0.8)';
      clone.style.margin = '5px';
      zone.querySelector('.dropped-items').appendChild(clone);
      el.remove();
      feedback.textContent = '✅ Benar!';
      feedback.className = 'game-feedback success';
    } else {
      feedback.textContent = '⚠️ Salah tempat!';
      feedback.className = 'game-feedback error';
    }
  }

  function finishHari3() {
    const correctCount = document.querySelectorAll(
      '.dropped-items .menu-card'
    ).length;
    dayScore = correctCount * 15;
    if (correctCount === 6) dayScore += 10;
    showHasilAkhir();
  }

  // ============================================================
  // HARI 4: SIMULASI AKTIVITAS
  // ============================================================
  function startHari4Aktivitas() {
    sceneOpening.style.display = 'none';
    sceneAktivitas.style.display = 'block';

    const charImg = document.getElementById('main-character-simulasi-img');
    if (charImg)
      charImg.src = getCharacterImage(userData.character, 'cape-olahraga');

    document.getElementById('aktivitas-header-title').textContent =
      'Simulasi Belajar Malam';

    // Render Pilihan Makanan
    const card = document.getElementById('daily-action-card');
    card.innerHTML = `
        <h3>Belajar Kelompok</h3>
        <p>Kamu begadang semalam suntuk untuk belajar. Energi turun drastis! Pilih makanan untuk memulihkan tenaga.</p>
        <div class="food-options-small">
            <div class="food-card-small" onclick="pilihMakananHari4('sehat')">
                <div style="font-size:2em">🍗</div><div>Hati Ayam</div>
            </div>
            <div class="food-card-small" onclick="pilihMakananHari4('junk')">
                <div style="font-size:2em">🍔</div><div>Junk Food</div>
            </div>
        </div>
        <p id="simulasi-feedback" style="margin-top:20px; font-weight:bold;"></p>
    `;

    const oldBtn = document.getElementById('btn-next-step');
    if (oldBtn) oldBtn.style.display = 'none';
  }

  window.pilihMakananHari4 = function (type) {
    const feedback = document.getElementById('simulasi-feedback');
    const charImg = document.getElementById('main-character-simulasi-img');

    if (type === 'sehat') {
      window.playCoolClickSound();
      dayScore = 10;
      feedback.innerHTML =
        "<span style='color:green'>✅ Pilihan Tepat! Energi pulih & kaya zat besi.</span>";
      if (charImg)
        charImg.src = getCharacterImage(userData.character, 'senang');
    } else {
      dayScore = 0;
      feedback.innerHTML =
        "<span style='color:red'>❌ Kurang Tepat. Junk food menghambat penyerapan.</span>";
      if (charImg)
        charImg.src = getCharacterImage(userData.character, 'murung');
    }

    setTimeout(showHasilAkhir, 1500);
  };

  // ============================================================
  // HARI 5: KUIS HARIAN (NO BUTTON CEK, ONLY NEXT)
  // ============================================================
  function startHari5Kuis() {
    sceneOpening.style.display = 'none';
    sceneKuisHarian.style.display = 'block';

    const charImg = document.getElementById('main-character-kuis-img');
    if (charImg)
      charImg.src = getCharacterImage(userData.character, 'berpikir');

    kuisIndex = 0;
    kuisTotalScore = 0;
    renderSoal();
  }

  let kuisIndex = 0;
  let kuisTotalScore = 0;

  function renderSoal() {
    // Cek jika sudah selesai semua soal
    if (kuisIndex >= masterDailyKuis.length) {
      dayScore = kuisTotalScore;
      showHasilAkhir();
      return;
    }

    const k = masterDailyKuis[kuisIndex];
    const container = document.getElementById('kuis-harian-content');

    // Update Progress Bar
    document.getElementById('kuis-progress-text').textContent = `${
      kuisIndex + 1
    }/${masterDailyKuis.length}`;
    document.getElementById('kuis-progress-fill').style.width = `${
      ((kuisIndex + 1) / masterDailyKuis.length) * 100
    }%`;

    // Render 4 Opsi Jawaban
    container.innerHTML = `
          <div class="soal-kuis slide-up">
              <h3>${k.soal}</h3>
              <div class="opsi-jawaban">
                  ${k.opsi
                    .map(
                      (opt, i) => `
                      <label>
                          <input type="radio" name="jawaban" value="${i}">
                          <span class="opsi-text">${String.fromCharCode(
                            65 + i
                          )}. ${opt}</span>
                      </label>
                  `
                    )
                    .join('')}
              </div>
          </div>
      `;

    // BUTTON SETUP (LANGSUNG NEXT)
    const btnCheck = document.getElementById('btn-check-answer');
    const btnNext = document.getElementById('btn-finish-day');

    // Sembunyikan tombol cek lama
    if (btnCheck) btnCheck.style.display = 'none';

    // Tampilkan tombol Next
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent =
        kuisIndex === masterDailyKuis.length - 1
          ? 'Selesai Kuis'
          : 'Soal Berikutnya ➡';

      btnNext.onclick = () => {
        const checked = document.querySelector('input[name="jawaban"]:checked');
        if (!checked) {
          alert('Pilih jawaban terlebih dahulu!');
          return;
        }

        // LOGIKA SCORING LANGSUNG DI SINI (TANPA FEEDBACK ALERT)
        if (parseInt(checked.value) === k.jawaban) {
          kuisTotalScore += k.score;
        }

        window.playClickSound();
        kuisIndex++;
        renderSoal();
      };
    }

    // Sound pilih jawaban
    document.querySelectorAll('input[name="jawaban"]').forEach((radio) => {
      radio.addEventListener('change', () => window.playClickSound());
    });
  }

  // ============================================================
  // HASIL AKHIR & BACKEND SAVE
  // ============================================================
  function showHasilAkhir() {
    scenePilihMenu.style.display = 'none';
    sceneAktivitas.style.display = 'none';
    sceneKuisHarian.style.display = 'none';
    sceneHasil.style.display = 'block';

    window.playGameClickSound();

    const charHasil = document.getElementById('main-character-hasil-img');
    if (charHasil)
      charHasil.src = getCharacterImage(userData.character, 'senang');

    // Distribusi Skor ke Global
    let knowledgeGain = 0;
    let complianceGain = 0;

    if (currentDay === 3) {
      knowledgeGain = Math.ceil(dayScore / 10);
    } else if (currentDay === 4) {
      complianceGain = dayScore;
    } else if (currentDay === 5) {
      knowledgeGain = Math.ceil(dayScore / 5);
    }

    currentKnowledge += knowledgeGain;
    currentCompliance += complianceGain;

    if (dayScore > 50 || (currentDay === 4 && dayScore > 0)) {
      currentHb = (currentHb + 0.2).toFixed(1);
    }

    // Update Local Data
    userData.totalKnowledge = currentKnowledge;
    userData.totalCompliance = currentCompliance;
    userData.progress[`hari${currentDay}`] = {
      completed: true,
      score: dayScore,
      hbLevel: currentHb,
    };

    localStorage.setItem('fesmart_user', JSON.stringify(userData));
    localStorage.setItem('fesmart_user_session', JSON.stringify(userData));

    // UI Hasil
    const hasilMsg = document.getElementById('hasil-message');
    hasilMsg.innerHTML = `
        <div class="score-detail">
            <div class="score-item-detail"><span class="score-label">Poin Hari Ini:</span><span class="score-value">+${dayScore}</span></div>
            <div class="score-item-detail"><span class="score-label">Total Pengetahuan:</span><span class="score-value">${currentKnowledge}</span></div>
            <div class="score-item-detail"><span class="score-label">Total Kepatuhan:</span><span class="score-value">${currentCompliance}</span></div>
            <div class="score-item-detail total-item"><span class="score-label">HB Terkini:</span><span class="score-value total-value">${currentHb} g/dL</span></div>
        </div>
    `;

    // Fetch Backend
    const btnNextDay = document.getElementById('btn-next-day');
    const isLastLoop = currentDay >= 5;
    btnNextDay.textContent = isLastLoop
      ? 'Simpan & Lanjut ke Hari 6'
      : `Simpan & Lanjut ke Hari ${currentDay + 1}`;

    btnNextDay.onclick = () => {
      btnNextDay.textContent = 'Menyimpan...';
      btnNextDay.disabled = true;

      const payload = {
        userId: userData.id,
        totalKnowledge: currentKnowledge,
        totalCompliance: currentCompliance,
        finalHb: parseFloat(currentHb),
        lastDay: `Hari ${currentDay}`,
        isCompleted: false,
      };

      fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (currentDay < 5) {
            currentDay++;
            localStorage.setItem('fesmart_current_day_loop', currentDay);
            window.location.reload();
          } else {
            localStorage.removeItem('fesmart_current_day_loop');
            window.location.href = 'hari6.html';
          }
        })
        .catch((err) => {
          console.error('Error:', err);
          // Fallback Offline
          if (currentDay < 5) {
            currentDay++;
            localStorage.setItem('fesmart_current_day_loop', currentDay);
            window.location.reload();
          } else {
            window.location.href = 'hari6.html';
          }
        });
    };
  }

  function checkWindowSize() {}
  window.addEventListener('resize', checkWindowSize);
});
