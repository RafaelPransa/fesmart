document.addEventListener('DOMContentLoaded', function () {
  // --- 1. SETUP DATA USER & KONEKSI BACKEND ---
  // Prioritaskan data sesi yang memiliki ID Database (fesmart_user_session)
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  // Cek validasi login
  if (!userData) {
    alert('Sesi tidak valid. Silakan login kembali.');
    window.location.href = 'index.html';
    return;
  }

  // --- DOM Elements ---
  const containerOpening = document.querySelector('.container-opening');
  const sceneOpening = document.querySelector('.scene-opening');
  const sceneKuis = document.querySelector('.scene-kuis');
  const sceneSimulasi = document.querySelector('.scene-simulasi');
  const sceneHasil = document.querySelector('.scene-hasil');

  const characterMain = document.getElementById('character-main');
  const teman = document.getElementById('character-teman');
  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');
  const btnBack = document.querySelector('.container-btn .btn-secondary');
  const containerBtn = document.querySelector(
    '.scene-opening .container-teks-opening .container-btn'
  );

  // --- Audio Elements ---
  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');
  const teksOpeningSound = document.getElementById('teks-opening-sound');
  const notificationSound = document.getElementById('notification-sound'); // Fix ID

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

  // --- Helper Gambar Karakter ---
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
    // Fallback jika characterId tidak ditemukan (default siti)
    const charData = characterImages[characterId] || characterImages['siti'];
    return charData[emotion] || charData['murung'];
  }

  // Setup Karakter Utama
  const mainCharacter = {
    id: userData.character || 'siti',
    name: userData.username || userData.characterName || 'Petualang',
    image: getCharacterImage(userData.character || 'siti', 'murung'),
  };

  function updateCharacterElements() {
    const mainCharacterImg = document.getElementById('main-character-img');
    if (mainCharacterImg) {
      mainCharacterImg.src = mainCharacter.image;
      mainCharacterImg.alt = mainCharacter.name;
    }
  }

  // --- Data Kuis Hari 2 ---
  const kuisData = [
    {
      soal: '1. Salah satu tanda umum anemia adalah…',
      opsi: [
        'Mudah lelah',
        'Nafsu makan meningkat',
        'Tidak bisa tidur',
        'Berat badan naik',
      ],
      jawaban: 0,
    },
    {
      soal: '2. Kulit pucat pada remaja putri dapat menjadi tanda…',
      opsi: ['Dehidrasi', 'Anemia', 'Kebanyakan tidur', 'Alergi makanan'],
      jawaban: 1,
    },
    {
      soal: '3. Sering merasa pusing saat berdiri bisa menjadi gejala…',
      opsi: ['Hipertensi', 'Anemia', 'Flu', 'Cacingan saja'],
      jawaban: 1,
    },
    {
      soal: '4. Detak jantung cepat pada siswi bisa terjadi karena…',
      opsi: ['Olahraga teratur', 'Kelebihan zat besi', 'Anemia', 'Tidur cukup'],
      jawaban: 2,
    },
    {
      soal: '5. Nafas terasa pendek dan mudah sesak merupakan tanda…',
      opsi: ['Anemia', 'Kekenyangan', 'Hiperaktif', 'Kejang otot'],
      jawaban: 0,
    },
  ];

  // --- Game State ---
  let currentKuisIndex = 0;
  let score = 0;
  let kepatuhan = 0;
  let hbLevel = 12;
  let timer;
  let timeLeft = 60;
  let gameCompleted = false;

  // Ambil nilai awal dari progress sebelumnya (akumulasi)
  let totalKnowledge = userData.totalKnowledge || 0;
  let totalKepatuhan = userData.totalCompliance || 0;

  // --- INIT GAME ---
  initGame();

  function initGame() {
    updateCharacterElements();

    // Animasi Opening Layar Biru
    setTimeout(() => {
      if (containerOpening) {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.5s ease';
      }

      setTimeout(() => {
        if (sceneOpening) sceneOpening.style.opacity = '1';
        startOpeningScene();
      }, 1600);
    }, 2000);
  }

  function startOpeningScene() {
    // Animasi karakter masuk
    if (characterMain) characterMain.classList.add('slide-main');
    if (teman) teman.classList.add('slide-teman');

    // Mulai dialog
    setTimeout(() => {
      showDialog();
    }, 1500);

    // Tampilkan tombol start setelah dialog
    setTimeout(() => {
      if (btnStart) {
        btnStart.classList.remove('btn-hidden');
        btnStart.style.opacity = '1';
        btnStart.style.transition = 'opacity 0.8s ease';
      }
    }, 15000);
  }

  function showDialog() {
    const dialogLines = [
      `TEMAN ${mainCharacter.name.toUpperCase()}: "Hai ${
        mainCharacter.name
      }, aku lihat kamu masih sering lesu. Aku dulu juga gitu lho!"`,
      `${mainCharacter.name.toUpperCase()}: "Iya nih, gimana caranya kamu bisa lebih berenergi sekarang?"`,
      `TEMAN ${mainCharacter.name.toUpperCase()}: "Coba kamu minum tablet Fe. Tapi harus tahu aturan minumnya ya, biar efektif!"`,
    ];
    typeWriterMultiple(dialogLines, 40, 800);
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
          const currentChar = lines[lineIndex].charAt(charIndex);
          if (charIndex === 0) teksOpening.innerHTML += '<strong>';
          if (charIndex % 3 === 0) playCoolClickSound();
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

  // --- KUIS SECTION ---
  if (btnStart) btnStart.addEventListener('click', startKuis);

  function startKuis() {
    playGameClickSound();
    if (sceneOpening) sceneOpening.style.opacity = '0';

    const characterKuisImg = document.getElementById('main-character-kuis-img');
    if (characterKuisImg) {
      characterKuisImg.src = getCharacterImage(mainCharacter.id, 'berpikir');
      characterKuisImg.classList.add('fade-in');
    }

    setTimeout(() => {
      if (sceneOpening) sceneOpening.style.display = 'none';
      if (sceneKuis) sceneKuis.style.display = 'block';
      loadSoalKuis(0);
    }, 800);
  }

  function loadSoalKuis(index) {
    const soal = kuisData[index];
    const progress = ((index + 1) / kuisData.length) * 100;

    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${index + 1}/${
      kuisData.length
    }`;

    const kuisContent = document.getElementById('kuis-content');
    kuisContent.innerHTML = `
      <div class="soal-kuis slide-up">
        <h3>${soal.soal}</h3>
        <div class="opsi-jawaban">
          ${soal.opsi
            .map(
              (opsi, i) => `
            <label>
              <input type="radio" name="jawaban" value="${i}">
              <span class="opsi-text">${String.fromCharCode(
                65 + i
              )}. ${opsi}</span>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const btnNext = document.getElementById('btn-next');
    // Gunakan clone untuk membersihkan event listener lama
    const newBtn = btnNext.cloneNode(true);
    btnNext.parentNode.replaceChild(newBtn, btnNext);

    newBtn.textContent =
      index === kuisData.length - 1 ? 'Selesai 🎉' : 'Selanjutnya ➡';
    newBtn.onclick = () => {
      window.playCoolClickSound();
      navigateKuis(1);
    };

    // Sound effect pilihan
    document.querySelectorAll('input[name="jawaban"]').forEach((radio) => {
      radio.addEventListener('change', () => window.playClickSound());
    });
  }

  function navigateKuis(direction) {
    const selectedAnswer = document.querySelector(
      'input[name="jawaban"]:checked'
    );
    if (!selectedAnswer && direction === 1) {
      alert('Pilih jawaban terlebih dahulu!');
      return;
    }

    if (direction === 1 && selectedAnswer) {
      if (
        parseInt(selectedAnswer.value) === kuisData[currentKuisIndex].jawaban
      ) {
        score++;
      }
    }

    currentKuisIndex += direction;

    if (currentKuisIndex < kuisData.length) {
      loadSoalKuis(currentKuisIndex);
    } else {
      showSimulasiScene();
    }
  }

  // --- SIMULASI MINUM FE SECTION ---
  function showSimulasiScene() {
    sceneKuis.style.display = 'none';
    sceneSimulasi.style.display = 'block';

    // Reset state
    timeLeft = 60;
    gameCompleted = false;

    // Ambil HB level dari data sebelumnya (hari 1) atau default
    hbLevel = userData.progress?.hari1?.energy > 50 ? 12.2 : 12.0;
    if (userData.initialHb) hbLevel = userData.initialHb;

    updateStatsDisplay();
    startSimulasi();
  }

  function startSimulasi() {
    const timerText = document.getElementById('timer-text');
    const timerCircle = document.querySelector('.timer-circle');
    const clockDisplay = document.getElementById('clock-display');
    const btnMinumFe = document.getElementById('btn-minum-fe');

    const characterSimulasiImg = document.getElementById(
      'main-character-simulasi-img'
    );
    if (characterSimulasiImg) {
      characterSimulasiImg.src = getCharacterImage(
        mainCharacter.id,
        'berpikir'
      );
      characterSimulasiImg.classList.add('fade-in');
    }

    // Reset UI
    timerText.textContent = timeLeft;
    timerCircle.className = 'timer-circle';
    btnMinumFe.disabled = false;
    btnMinumFe.textContent = '💊 Minum Fe Sekarang';
    clockDisplay.textContent = '15:59';

    // Start Timer
    timer = setInterval(() => {
      timeLeft--;
      timerText.textContent = timeLeft;

      if (timeLeft <= 30 && timeLeft > 10) timerCircle.classList.add('warning');
      else if (timeLeft <= 10) {
        timerCircle.classList.remove('warning');
        timerCircle.classList.add('danger');
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        timeUp();
      }
    }, 1000);

    btnMinumFe.onclick = minumTabletFe;
  }

  function minumTabletFe() {
    playCoolClickSound();
    if (gameCompleted) return;

    clearInterval(timer);
    gameCompleted = true;
    const btnMinumFe = document.getElementById('btn-minum-fe');

    if (timeLeft > 0) {
      // Sukses
      kepatuhan += 10;
      hbLevel += 0.5;
      showFePopup(
        `Tepat waktu! Kamu berhasil minum tablet Fe sebelum jam 16:00\n+10 Poin Kepatuhan\nHb meningkat menjadi ${hbLevel.toFixed(
          1
        )} g/dL`,
        'success'
      );
    } else {
      // Terlambat
      hbLevel = Math.max(8, hbLevel - 0.5);
      showFePopup(
        `Waktu habis! Kamu terlambat minum tablet Fe\nHb menurun menjadi ${hbLevel.toFixed(
          1
        )} g/dL\nIngat, minum sebelum jam 16:00 ya!`,
        'error'
      );
    }

    btnMinumFe.disabled = true;
    btnMinumFe.textContent = timeLeft > 0 ? '✅ Sudah diminum' : '⏰ Terlambat';
    updateStatsDisplay();
  }

  function timeUp() {
    gameCompleted = true;
    const btnMinumFe = document.getElementById('btn-minum-fe');
    hbLevel = Math.max(8, hbLevel - 0.5);
    showFePopup(
      `Waktu habis! Kamu terlambat minum tablet Fe\nHb menurun menjadi ${hbLevel.toFixed(
        1
      )} g/dL\nIngat, minum sebelum jam 16:00 ya!`,
      'error'
    );
    btnMinumFe.disabled = true;
    btnMinumFe.textContent = '⏰ Terlambat';
    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    document.getElementById('kepatuhan-value').textContent = kepatuhan;
    document.getElementById('hb-value').textContent = `${hbLevel.toFixed(
      1
    )} g/dL`;
  }

  function showFePopup(message, type = 'success') {
    const popup = document.createElement('div');
    popup.className = 'fe-popup';
    const icon = type === 'success' ? '✅' : '❌';
    const title = type === 'success' ? 'Berhasil!' : 'Perhatian!';

    popup.innerHTML = `
    <div class="fe-popup-content">
      <div class="fe-popup-progress"><div class="fe-popup-progress-bar"></div></div>
      <div class="fe-popup-header"><span class="fe-popup-icon">${icon}</span><h3>${title}</h3></div>
      <div class="fe-popup-message">${message
        .split('\n')
        .map((line) => `<p>${line}</p>`)
        .join('')}</div>
      <button class="fe-popup-close">Lanjutkan</button>
    </div>`;

    document.body.appendChild(popup);

    // Animasi bar
    const progressBar = popup.querySelector('.fe-popup-progress-bar');
    setTimeout(() => {
      progressBar.style.width = '100%';
      progressBar.style.transition = 'width 5s linear';
    }, 100);

    // Auto close
    const autoHideTimer = setTimeout(() => {
      if (popup.parentNode) {
        hidePopup(popup);
        showHasilAkhir();
      }
    }, 5000);

    const close = () => {
      playCoolClickSound();
      clearTimeout(autoHideTimer);
      hidePopup(popup);
      showHasilAkhir();
    };

    popup.querySelector('.fe-popup-close').onclick = close;
    popup.onclick = (e) => {
      if (e.target === popup) close();
    };
  }

  function hidePopup(popup) {
    popup.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(() => {
      if (popup.parentNode) document.body.removeChild(popup);
    }, 500);
  }

  // --- HASIL AKHIR SECTION & BACKEND SAVE ---
  function showHasilAkhir() {
    sceneSimulasi.style.display = 'none';
    sceneHasil.style.display = 'block';

    const characterHasilImg = document.getElementById(
      'main-character-hasil-img'
    );
    const totalScore = score + kepatuhan;

    // --- Update Akumulasi Skor Global ---
    userData.totalKnowledge = (userData.totalKnowledge || 0) + score;
    userData.totalCompliance = (userData.totalCompliance || 0) + kepatuhan;

    // Simpan data progress hari ini
    if (!userData.progress) userData.progress = {};
    userData.progress['hari2'] = {
      completed: true,
      score: totalScore,
      knowledge: score,
      compliance: kepatuhan,
      hbLevel: hbLevel,
    };

    // Update LocalStorage (Backup)
    localStorage.setItem('fesmart_user', JSON.stringify(userData));
    localStorage.setItem('fesmart_user_session', JSON.stringify(userData));

    // Render HTML Hasil
    const hasilMessage = document.getElementById('hasil-message');
    hasilMessage.innerHTML = `
      <div class="score-detail">
        <div class="score-item-detail"><span class="score-label">Skor Kuis:</span><span class="score-value">${score}/${
      kuisData.length
    }</span></div>
        <div class="score-item-detail"><span class="score-label">Skor Kepatuhan:</span><span class="score-value">${kepatuhan}</span></div>
        <div class="score-item-detail total-item"><span class="score-label">Total Skor Hari Ini:</span><span class="score-value total-value">${totalScore}</span></div>
        <div class="score-item-detail"><span class="score-label">Hb Akhir:</span><span class="score-value">${hbLevel.toFixed(
          1
        )} g/dL</span></div>
      </div>
    `;

    // Feedback visual
    const feedbackMessage = document.createElement('div');
    feedbackMessage.className = 'feedback-message';
    let emotion = 'normal';

    if (totalScore >= 12 && hbLevel >= 12) {
      feedbackMessage.innerHTML =
        '🎉 <strong>Luar biasa!</strong> Kamu sangat patuh minum tablet Fe!';
      feedbackMessage.style.color = '#4CD964';
      emotion = 'senang';
    } else if (totalScore >= 8) {
      feedbackMessage.innerHTML =
        '👍 <strong>Bagus!</strong> Terus tingkatkan kepatuhan minum Fe!';
      feedbackMessage.style.color = '#FF9500';
      emotion = 'normal';
    } else {
      feedbackMessage.innerHTML =
        '💪 <strong>Jangan menyerah!</strong> Ingat selalu minum Fe tepat waktu!';
      feedbackMessage.style.color = '#FF3B30';
      emotion = 'murung';
    }
    hasilMessage.appendChild(feedbackMessage);

    if (characterHasilImg) {
      characterHasilImg.src = getCharacterImage(mainCharacter.id, emotion);
      characterHasilImg.classList.add('fade-in');
    }

    // --- INTEGRASI BACKEND: TOMBOL LANJUT ---
    const btnRestart = document.getElementById('btn-restart'); // Tombol "Lanjut ke Hari 3"

    // Ubah status tombol jadi "Menyimpan..."
    btnRestart.textContent = 'Menyimpan Progress...';
    btnRestart.disabled = true;

    // Data yang akan dikirim ke Supabase
    const payload = {
      userId: userData.id,
      totalKnowledge: userData.totalKnowledge,
      totalCompliance: userData.totalCompliance,
      finalHb: hbLevel,
      lastDay: 'Hari 2',
      isCompleted: false,
    };

    // Fetch ke API
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Save Sukses:', data);

        // Aktifkan tombol lanjut setelah save berhasil
        btnRestart.textContent = 'Lanjut ke Hari 3';
        btnRestart.disabled = false;

        // Set event listener untuk pindah halaman
        btnRestart.onclick = lanjutKeHari3;
      })
      .catch((error) => {
        console.error('Gagal save ke backend:', error);

        // Fallback: Tetap izinkan lanjut meski offline/error
        btnRestart.textContent = 'Lanjut (Offline Mode)';
        btnRestart.disabled = false;
        btnRestart.onclick = lanjutKeHari3;
      });
  }

  function lanjutKeHari3() {
    playCoolClickSound();
    window.location.href = 'hari3-5.html'; // Pastikan file ini ada
  }

  // --- Init ---
  playBackgroundMusic();
  // checkWindowSize() logic bisa ditambahkan jika perlu, tapi CSS media query biasanya sudah cukup.
});
