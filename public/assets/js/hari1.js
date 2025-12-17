document.addEventListener('DOMContentLoaded', function () {
  // --- 1. SETUP DATA USER & KONEKSI BACKEND ---

  // Ambil data sesi (prioritas pakai fesmart_user_session yang ada ID database)
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  // Cek jika tidak ada data login, tendang ke halaman depan
  if (!userData) {
    alert('Sesi habis. Silakan login kembali.');
    window.location.href = 'index.html';
    return;
  }

  // FIX PENTING: Penanganan nama variabel yang berbeda (backend vs frontend lama)
  // Backend pakai 'username', frontend lama mungkin pakai 'characterName'
  const mainCharacter = {
    id: userData.character || 'siti', // Default siti jika error
    name: userData.username || userData.characterName || 'Petualang',
    // Ambil gambar (fungsi getCharacterImage didefinisikan di bawah, tapi JS hoisting aman)
    // Kita set image nanti setelah fungsi didefinisikan
  };

  // Pastikan objek progress ada
  if (!userData.progress) userData.progress = {};

  // --- 2. DOM ELEMENTS & AUDIO ---
  const containerOpening = document.querySelector('.container-opening');
  const sceneOpening = document.querySelector('.scene-opening');
  const sceneKuis = document.querySelector('.scene-kuis');
  const sceneSarapan = document.querySelector('.scene-sarapan');
  const sceneHasil = document.querySelector('.scene-hasil');

  const characterMain = document.getElementById('character-main');
  const guru = document.getElementById('character-guru');
  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');

  // Audio Elements
  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');
  const teksOpeningSound = document.getElementById('teks-opening-sound');
  const notificationSound = document.getElementById('notification-sound'); // Fix ID

  // Cek status suara
  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  // --- 3. HELPER FUNCTIONS ---

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
    // Safety check jika characterId salah
    const charData = characterImages[characterId] || characterImages['siti'];
    return charData[emotion] || charData['normal'];
  }

  // Set gambar karakter utama setelah fungsi dibuat
  mainCharacter.image = getCharacterImage(mainCharacter.id, 'murung');

  // Audio Helpers
  window.playClickSound = () =>
    isSoundOn && soundClick
      ? ((soundClick.currentTime = 0),
        soundClick.play().catch(() => {
          निकालते;
        }))
      : null;
  window.playCoolClickSound = () =>
    isSoundOn && soundCoolClick
      ? ((soundCoolClick.currentTime = 0),
        soundCoolClick.play().catch(() => {
          निकालते;
        }))
      : null;
  window.playGameClickSound = () =>
    isSoundOn && soundGameClick
      ? ((soundGameClick.currentTime = 0),
        soundGameClick.play().catch(() => {
          निकालते;
        }))
      : null;

  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');

    // Update tombol di UI (jika ada class control-btn)
    const soundBtns = document.querySelectorAll('.control-btn');
    soundBtns.forEach((btn) => {
      if (btn.textContent.includes('Sound'))
        btn.innerHTML = isSoundOn ? '🔊 Sound' : '🔇 Sound';
    });

    if (isSoundOn) playBackgroundMusic();
    else if (bgMusic) bgMusic.pause();
  };

  window.playBackgroundMusic = function () {
    if (isSoundOn && bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch(() => {});
    }
  };

  // --- 4. UPDATE UI AWAL ---
  function updateCharacterElements() {
    // Update teks nama
    const nameElements = [
      'main-character-name',
      'sarapan-character-name',
      'energy-character-name',
    ];
    nameElements.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = mainCharacter.name;
    });

    // Update gambar
    const mainCharacterImg = document.getElementById('main-character-img');
    if (mainCharacterImg) {
      mainCharacterImg.src = mainCharacter.image;
      mainCharacterImg.alt = mainCharacter.name;
    }
  }

  // --- 5. DATA PERMAINAN (Soal & Makanan) ---
  const kuisData = [
    {
      soal: '1. Apa itu anemia?',
      opsi: [
        'Kekurangan zat cair',
        'Kondisi kurangnya sel darah merah / hemoglobin',
        'Kelebihan gula darah',
        'Infeksi virus',
      ],
      jawaban: 1,
    },
    {
      soal: '2. Zat gizi apa yang paling berperan mencegah anemia?',
      opsi: ['Vitamin C', 'Kalsium', 'Zat besi', 'Lemak'],
      jawaban: 2,
    },
    {
      soal: '3. Siapa kelompok paling berisiko anemia?',
      opsi: ['Remaja putri', 'Laki-laki dewasa', 'Anak laki-laki', 'Lansia'],
      jawaban: 0,
    },
    {
      soal: '4. Cara sederhana mencegah anemia adalah…',
      opsi: [
        'Kurangi makan',
        'Konsumsi makanan kaya zat besi',
        'Minum teh saat makan',
        'Hindari olahraga',
      ],
      jawaban: 1,
    },
    {
      soal: '5. Tablet Fe diberikan kepada remaja putri untuk…',
      opsi: [
        'Menambah berat badan',
        'Mengurangi nafsu makan',
        'Menambah cadangan zat besi',
        'Menghilangkan pusing',
      ],
      jawaban: 2,
    },
  ];

  const makananData = {
    'nasi-telur': {
      nama: 'Nasi + Telur',
      energy: +30,
      message: `Pilihan bagus! 🥚 Telur kaya zat besi & protein.`,
      type: 'positive',
      popup: 'Telur adalah sumber zat besi hewani yang mudah diserap tubuh.',
    },
    roti: {
      nama: 'Roti Gandum',
      energy: +15,
      message: `Baik! 🌾 Roti gandum beri energi stabil.`,
      type: 'positive',
      popup:
        'Zat besi nabati (roti) lebih baik diserap jika dibarengi Vitamin C.',
    },
    'mie-instan': {
      nama: 'Mie Instan',
      energy: -20,
      message: `Hati-hati! 🚫 Rendah gizi penting.`,
      type: 'negative',
      popup: 'Makanan instan seringkali tinggi natrium tapi rendah zat besi.',
    },
  };

  // State Variables
  let currentKuisIndex = 0;
  let score = 0;
  let energy = 55;
  let bonusPengetahuan = 0;
  let jumlahPilihanSehat = 0;
  let selectedFood = null;

  // --- 6. GAME FLOW CONTROL ---

  // Start Game
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
    if (characterMain) characterMain.classList.add('slide-main');
    if (guru) guru.classList.add('slide-guru');

    setTimeout(() => {
      showDialog();
    }, 1500);

    setTimeout(() => {
      if (btnStart) {
        btnStart.classList.remove('btn-hidden');
        btnStart.style.opacity = '1';
      }
    }, 12000);
  }

  function showDialog() {
    const dialogLines = [
      `${mainCharacter.name.toUpperCase()}: "Aduh... kepala pusing sekali. Kenapa ya aku sering merasa lemas di sekolah?"`,
      'GURU UKS: "Hai, gejala pucat, lemas, dan pusing itu bisa jadi tanda anemia. Yuk kita pelajari bersama!"',
    ];
    typeWriterMultiple(dialogLines, 40, 1000);
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
          if (charIndex === 0) teksOpening.innerHTML += '<strong>'; // Bold nama
          teksOpening.innerHTML += char;
          if (char === ':' && charIndex < 15)
            teksOpening.innerHTML += '</strong>'; // End bold nama

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

  // --- KUIS SECTION ---
  if (btnStart) {
    btnStart.addEventListener('click', function () {
      playGameClickSound();
      startKuis();
    });
  }

  function startKuis() {
    sceneOpening.style.opacity = '0';
    setTimeout(() => {
      sceneOpening.style.display = 'none';
      sceneKuis.style.display = 'block';

      const charImg = document.getElementById('main-character-kuis-img');
      if (charImg) {
        charImg.src = getCharacterImage(mainCharacter.id, 'berpikir');
        charImg.classList.add('fade-in');
      }
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
    btnNext.textContent =
      index === kuisData.length - 1 ? 'Selesai 🎉' : 'Selanjutnya ➡';

    // Hapus listener lama (clone node trick)
    const newBtn = btnNext.cloneNode(true);
    btnNext.parentNode.replaceChild(newBtn, btnNext);

    newBtn.onclick = () => {
      window.playCoolClickSound();
      navigateKuis(1);
    };

    // Sound pilih jawaban
    document.querySelectorAll('input[name="jawaban"]').forEach((radio) => {
      radio.addEventListener('change', () => window.playClickSound());
    });
  }

  function navigateKuis(direction) {
    const selectedAnswer = document.querySelector(
      'input[name="jawaban"]:checked'
    );
    if (!selectedAnswer) {
      alert('Pilih jawaban terlebih dahulu!');
      return;
    }

    if (parseInt(selectedAnswer.value) === kuisData[currentKuisIndex].jawaban) {
      score++;
    }

    currentKuisIndex += direction;

    if (currentKuisIndex < kuisData.length) {
      loadSoalKuis(currentKuisIndex);
    } else {
      showSarapanScene();
    }
  }

  // --- SARAPAN SECTION ---
  function showSarapanScene() {
    sceneKuis.style.display = 'none';
    sceneSarapan.style.display = 'block';

    // Reset State
    selectedFood = null;
    jumlahPilihanSehat = 0;
    bonusPengetahuan = 0;
    energy = 55;
    updateEnergyBar();

    // Reset UI
    document
      .querySelectorAll('.food-card')
      .forEach((c) => c.classList.remove('selected'));
    document.getElementById('result-message').style.display = 'none';
    const btnLanjut = document.getElementById('btn-lanjut');
    btnLanjut.classList.add('btn-hidden');
    btnLanjut.style.opacity = '0';

    // Listener Food Cards
    document.querySelectorAll('.food-card').forEach((card) => {
      // Hapus listener lama dengan clone
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      newCard.addEventListener('click', function () {
        selectFood(this);
        playClickSound();
      });
    });

    const charImg = document.getElementById('main-character-sarapan-img');
    if (charImg) {
      charImg.src = getCharacterImage(mainCharacter.id, 'berpikir');
      charImg.classList.add('fade-in');
    }
  }

  function selectFood(card) {
    const foodId = card.dataset.food;
    const food = makananData[foodId];

    // Toggle
    const isSelected = card.classList.toggle('selected');

    if (isSelected) {
      selectedFood = foodId;
      if (food.energy > 0) jumlahPilihanSehat++;
      energy = Math.min(100, energy + food.energy);
      showFoodResult(food);
      showEdukasiPopup(food.popup);
    } else {
      if (food.energy > 0)
        jumlahPilihanSehat = Math.max(0, jumlahPilihanSehat - 1);
      energy = Math.max(0, energy - food.energy);
      selectedFood = null;
    }
    updateEnergyBar();
    bonusPengetahuan = jumlahPilihanSehat;
  }

  function updateEnergyBar() {
    const fill = document.getElementById('energy-fill');
    document.getElementById('energy-text').textContent = `${energy}%`;
    fill.style.width = `${energy}%`;

    if (energy < 30)
      fill.style.background = 'linear-gradient(90deg, #FF3B30, #FF9500)';
    else if (energy < 70)
      fill.style.background = 'linear-gradient(90deg, #FF9500, #FFCC00)';
    else fill.style.background = 'linear-gradient(90deg, #4CD964, #2E8B57)';
  }

  function showFoodResult(food) {
    const msg = document.getElementById('result-message');
    msg.innerHTML = food.message;
    msg.className = `result-message ${
      food.energy > 0 ? 'result-positive' : 'result-negative'
    }`;
    msg.style.display = 'block';

    const btnLanjut = document.getElementById('btn-lanjut');
    if (document.querySelectorAll('.food-card.selected').length > 0) {
      btnLanjut.classList.remove('btn-hidden');
      btnLanjut.style.opacity = '1';
      btnLanjut.onclick = () => {
        playCoolClickSound();
        showHasilAkhir();
      };
    } else {
      btnLanjut.classList.add('btn-hidden');
      btnLanjut.style.opacity = '0';
    }
  }

  function showEdukasiPopup(text) {
    const popup = document.createElement('div');
    popup.className = 'edukasi-popup';
    popup.innerHTML = `
      <div class="popup-content">
        <div class="popup-header"><span class="popup-icon">💡</span><h3>Info Gizi</h3></div>
        <p class="popup-message">${text}</p>
        <button class="popup-close">Oke, Mengerti</button>
      </div>
    `;
    document.body.appendChild(popup);

    const close = () => {
      popup.style.animation = 'fadeOut 0.3s';
      setTimeout(() => popup.remove(), 300);
    };

    popup.querySelector('.popup-close').onclick = close;
    popup.onclick = (e) => {
      if (e.target === popup) close();
    };
  }

  // --- 7. HASIL AKHIR & SIMPAN KE CLOUD ---
  function showHasilAkhir() {
    sceneSarapan.style.display = 'none';
    sceneHasil.style.display = 'block';

    const totalPengetahuan = score + bonusPengetahuan;

    // Tampilkan UI Hasil
    const hasilMessage = document.getElementById('hasil-message');
    hasilMessage.innerHTML = `
      <div class="score-detail">
        <div class="score-item-detail"><span class="score-label">Skor Kuis:</span><span class="score-value">${score}/${
      kuisData.length
    }</span></div>
        ${
          bonusPengetahuan > 0
            ? `<div class="score-item-detail bonus-item"><span class="score-label">Bonus Makanan:</span><span class="score-value">+${bonusPengetahuan}</span></div>`
            : ''
        }
        <div class="score-item-detail total-item"><span class="score-label">Total Pengetahuan:</span><span class="score-value total-value">${totalPengetahuan}</span></div>
        <div class="score-item-detail"><span class="score-label">Energi Akhir:</span><span class="score-value">${energy}%</span></div>
      </div>
    `;

    // Pesan Feedback
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';

    // Tentukan Emosi & Pesan
    let emotion = 'normal';
    let msgText = '';
    let color = '';

    if (totalPengetahuan >= 3 && energy > 70) {
      emotion = 'senang';
      msgText = '🎉 <strong>Luar biasa!</strong> Awal yang sempurna!';
      color = '#4CD964';
    } else if (totalPengetahuan >= 2) {
      emotion = 'normal';
      msgText = '👍 <strong>Bagus!</strong> Tingkatkan lagi besok.';
      color = '#FF9500';
    } else {
      emotion = 'murung';
      msgText = '💪 <strong>Jangan menyerah!</strong> Belajar lagi ya.';
      color = '#FF3B30';
    }

    feedback.innerHTML = msgText;
    feedback.style.color = color;
    hasilMessage.appendChild(feedback);

    const charImg = document.getElementById('main-character-hasil-img');
    if (charImg) {
      charImg.src = getCharacterImage(mainCharacter.id, emotion);
      charImg.classList.add('fade-in');
    }

    // --- LOGIKA SIMPAN KE CLOUD (BACKEND) ---
    const btnLanjut = document.getElementById('btn-restart');
    btnLanjut.textContent = 'Menyimpan...';
    btnLanjut.disabled = true;

    // Siapkan Data
    const progressData = {
      userId: userData.id, // ID dari Database Supabase
      totalKnowledge: totalPengetahuan,
      totalCompliance: 0, // Hari 1 belum ada nilai kepatuhan
      finalHb: 12, // Default awal
      lastDay: 'Hari 1',
      isCompleted: false,
    };

    // Update LocalStorage (untuk backup/kecepatan UI)
    userData.progress['hari1'] = { completed: true, score: totalPengetahuan };
    userData.totalKnowledge = totalPengetahuan;
    localStorage.setItem('fesmart_user', JSON.stringify(userData));
    localStorage.setItem('fesmart_user_session', JSON.stringify(userData));

    // KIRIM KE API (FETCH)
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Save sukses:', data);
        btnLanjut.textContent = 'Lanjut ke Tahap Berikutnya';
        btnLanjut.disabled = false;

        // Klik lanjut pindah halaman
        btnLanjut.onclick = () => {
          playGameClickSound();
          window.location.href = 'hari2.html';
        };
      })
      .catch((error) => {
        console.error('Gagal save:', error);
        btnLanjut.textContent = 'Lanjut (Offline Mode)';
        btnLanjut.disabled = false;
        btnLanjut.onclick = () => (window.location.href = 'hari2.html');
      });
  }

  playBackgroundMusic();
  window.addEventListener('resize', () => {
    /* Logika resize jika perlu */
  });
});
