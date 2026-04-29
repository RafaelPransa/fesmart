document.addEventListener('DOMContentLoaded', function () {
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  if (!userData || !userData.id) {
    alert('Sesi habis. Silakan masuk kembali.');
    window.location.href = 'index.html';
    return;
  }

  const sceneOpening = document.querySelector('.scene-opening');
  const sceneKuis = document.getElementById('scene-kuis-harian');
  const sceneHasil = document.querySelector('.scene-hasil');
  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');
  const btnCheck = document.getElementById('btn-check-answer');
  const btnNextDay = document.getElementById('btn-next-day');
  const openingSubtitle = document.querySelector('.opening-subtitle');
  const hariTitle = document.getElementById('hari-title');
  const currentDayBtn = document.getElementById('current-day-btn');

  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  // Tambahkan ini agar HTML bisa mengenali fungsi toggleSound
  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');

    const soundBtn = document.querySelector(
      '.control-btn[onclick="toggleSound()"]',
    );
    if (soundBtn) {
      soundBtn.innerHTML = isSoundOn ? '🔊 Suara' : '🔇 Suara';
    }

    // Opsional: Pause music jika dimatikan
    if (!isSoundOn && bgMusic) {
      bgMusic.pause();
    } else if (isSoundOn && bgMusic) {
      bgMusic.play().catch(() => {});
    }

    console.log('Sound is now: ' + (isSoundOn ? 'ON' : 'OFF'));
  };

  window.playBackgroundMusic = function () {
    if (isSoundOn && bgMusic && bgMusic.paused) {
      // Coba putar musik, ini mungkin gagal karena batasan browser (autoplay)
      bgMusic.volume = 0.5; // Atur volume agar tidak terlalu keras
      bgMusic
        .play()
        .catch((e) => console.log('Background music auto-play blocked:', e));
    }
  };

  function getCharacterImage(characterId, emotion = 'normal') {
    const characterImages = {
      siti: {
        normal: 'assets/images/characters/siti-normal.png',
        murung: 'assets/images/characters/siti-murung.png',
        senang: 'assets/images/characters/siti-senang.png',
      },
      sari: {
        normal: 'assets/images/characters/sari-normal.png',
        murung: 'assets/images/characters/sari-murung.png',
        senang: 'assets/images/characters/sari-senang.png',
      },
      clara: {
        normal: 'assets/images/characters/clara-normal.png',
        murung: 'assets/images/characters/clara-murung.png',
        senang: 'assets/images/characters/clara-senang.png',
      },
    };
    return (
      characterImages[characterId]?.[emotion] ||
      characterImages[characterId]?.['normal'] ||
      'assets/images/characters/default.png'
    );
  }

  function playSound(audio) {
    if (!isSoundOn || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  const kuisData = [
    {
      soal: '1. Apa itu anemia?',
      opsi: [
        'Kekurangan zat cair',
        'Kondisi kurangnya sel darah merah atau hemoglobin',
        'Kelebihan gula darah',
        'Infeksi virus',
      ],
      jawaban: 1,
    },
    {
      soal: '2. Salah satu gejala anemia adalah…',
      opsi: [
        'Mudah lelah',
        'Nafsu makan meningkat',
        'Berat badan naik',
        'Sulit tidur',
      ],
      jawaban: 0,
    },
    {
      soal: '3. Kulit pucat pada remaja putri biasanya menandakan…',
      opsi: ['Dehidrasi', 'Anemia', 'Alergi', 'Kurang tidur'],
      jawaban: 1,
    },
    {
      soal: '4. Mengapa remaja putri rentan anemia?',
      opsi: [
        'Karena sering berolahraga',
        'Karena menstruasi',
        'Karena terlalu banyak tidur',
        'Karena minum air putih',
      ],
      jawaban: 1,
    },
    {
      soal: '5. Tablet Fe biasanya diberikan untuk…',
      opsi: [
        'Menambah berat badan',
        'Memperbaiki nafsu makan',
        'Menambah cadangan zat besi',
        'Meningkatkan tinggi badan',
      ],
      jawaban: 2,
    },
    {
      soal: '6. Tanda umum anemia lain yang sering muncul adalah…',
      opsi: ['Kulit kering', 'Pusing', 'Cepat lapar', 'Bad mood'],
      jawaban: 1,
    },
    {
      soal: '7. Zat besi berperan penting untuk membentuk…',
      opsi: [
        'Protein otot',
        'Sel darah merah',
        'Tulang kuat',
        'Hormon pertumbuhan',
      ],
      jawaban: 1,
    },
    {
      soal: '8. Makanan kaya zat besi contohnya adalah…',
      opsi: ['Es krim', 'Bayam', 'Keripik kentang', 'Minuman ringan'],
      jawaban: 1,
    },
    {
      soal: '9. Penggunaan tablet Fe membantu…',
      opsi: [
        'Mencegah anemia',
        'Membuat cepat marah',
        'Mengurangi aktivitas',
        'Membuat susah tidur',
      ],
      jawaban: 0,
    },
    {
      soal: '10. Peran UKS dalam anemia adalah…',
      opsi: [
        'Membagikan tablet Fe dan edukasi',
        'Melarang olahraga',
        'Menyuruh tidur siang',
        'Menjalankan diet ketat',
      ],
      jawaban: 0,
    },
  ];

  let currentIndex = 0;
  let userAnswers = [];

  function typeWriter(lines, speed = 35, delay = 800) {
    if (!teksOpening) return;
    teksOpening.innerHTML = '';
    let lineIndex = 0;
    let charIndex = 0;

    function nextChar() {
      const currentLine = lines[lineIndex];
      if (charIndex < currentLine.length) {
        // PERBAIKAN: Gunakan slice dan innerHTML agar tag <i> terdeteksi
        teksOpening.innerHTML =
          teksOpening.innerHTML
            .split('<br><br>')
            .slice(0, lineIndex)
            .join('<br><br>') +
          (lineIndex > 0 ? '<br><br>' : '') +
          currentLine.slice(0, charIndex + 1);

        charIndex += 1;
        if (charIndex % 3 === 0) playSound(soundCoolClick);
        setTimeout(nextChar, speed);
      } else {
        lineIndex += 1;
        charIndex = 0;
        if (lineIndex < lines.length) {
          setTimeout(nextChar, delay);
        }
      }
    }
    nextChar();
  }

  function saveProgress(lastDay, totalScore) {
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        totalKnowledge: 0,
        totalCompliance: totalScore,
        finalHb: userData.finalHb || 0,
        lastDay,
        isCompleted: false,
      }),
    }).catch(() => {
      console.warn('Gagal menyimpan progress Hari 3');
    });
  }

  function init() {
    if (hariTitle) hariTitle.innerHTML = '<i>Post-test</i>';
    if (openingSubtitle)
      openingSubtitle.innerHTML = '<i>Post-test</i> berisikan 10 soal';
    if (currentDayBtn) currentDayBtn.textContent = '3';

    // Update character image
    const imgEl = document.getElementById('main-character-img');
    if (imgEl) imgEl.src = getCharacterImage(userData.character || 'siti');

    setTimeout(() => {
      const containerOpening = document.querySelector('.container-opening');
      if (containerOpening) {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.2s ease';
      }
      setTimeout(() => {
        if (sceneOpening) sceneOpening.style.opacity = '1';
        // Add slide animations
        const characterMain = document.getElementById('character-main');
        const characterGuru = document.getElementById('character-guru');
        if (characterMain) characterMain.classList.add('slide-main');
        if (characterGuru) characterGuru.classList.add('slide-guru');
        showDialog();
      }, 1200);
    }, 1500);
    if (bgMusic) playSound(bgMusic);
  }

  function showDialog() {
    const lines = [
      'Guru UKS: Sekarang kita mulai <i>post-test</i>. Setiap jawaban benar mendapatkan 1 poin.',
      `${userData.username || 'Petualang'}: Siap, aku akan jawab dengan teliti.`,
    ];
    typeWriter(lines);
    if (btnStart) btnStart.classList.remove('btn-hidden');
  }

  function startKuis() {
    playSound(soundGameClick);
    if (sceneOpening) sceneOpening.style.display = 'none';
    if (sceneKuis) sceneKuis.style.display = 'block';
    loadQuestion(currentIndex);
  }

  function loadQuestion(index) {
    const question = kuisData[index];
    const progressFill = document.getElementById('kuis-progress-fill');
    const progressText = document.getElementById('kuis-progress-text');
    const kuisContent = document.getElementById('kuis-harian-content');

    if (progressFill)
      progressFill.style.width = `${((index + 1) / kuisData.length) * 100}%`;
    if (progressText)
      progressText.textContent = `${index + 1}/${kuisData.length}`;

    if (!kuisContent) return;
    kuisContent.innerHTML = `
      <div class="soal-kuis slide-up">
        <h3>${question.soal}</h3>
        <div class="opsi-jawaban">
          ${question.opsi
            .map(
              (opsi, i) => `
                <label class="option-row" data-index="${i}">
                  <input type="radio" name="jawaban" value="${i}" />
                  <span class="opsi-text">${String.fromCharCode(65 + i)}. ${opsi}</span>
                </label>`,
            )
            .join('')}
        </div>
      </div>`;

    if (btnCheck) {
      btnCheck.textContent =
        index === kuisData.length - 1 ? 'Lihat Hasil' : 'Selanjutnya ➡';
    }
    document.querySelectorAll('input[name="jawaban"]').forEach((radio) => {
      radio.addEventListener('change', () => playSound(soundClick));
    });
  }

  function showResults() {
    // Update character image for hasil
    const imgEl = document.getElementById('main-character-hasil-img');
    if (imgEl) imgEl.src = getCharacterImage(userData.character || 'siti');

    const score = userAnswers.reduce(
      (sum, answer) => sum + (answer.selected === answer.correct ? 1 : 0),
      0,
    );
    const correctCount = userAnswers.filter(
      (answer) => answer.selected === answer.correct,
    ).length;
    const hasilMessage = document.getElementById('hasil-message');
    if (!hasilMessage) return;

    const historyHtml = userAnswers
      .map((answer, idx) => {
        const question = kuisData[idx];
        const isCorrect = answer.selected === answer.correct;
        const selectedText = question.opsi[answer.selected] || 'Tidak dijawab';
        const correctText = question.opsi[answer.correct];
        return `
          <div class="history-item ${isCorrect ? 'correct' : 'wrong'}">
            <div class="history-question">${question.soal}</div>
            <div class="history-answer">Jawaban kamu: <strong>${String.fromCharCode(65 + answer.selected)}. ${selectedText}</strong> ${isCorrect ? '<span class="history-badge correct">+1</span>' : '<span class="history-badge wrong">0</span>'}</div>
            ${isCorrect ? '' : `<div class="correct-answer">Jawaban benar: <strong>${String.fromCharCode(65 + answer.correct)}. ${correctText}</strong></div>`}
          </div>`;
      })
      .join('');

    hasilMessage.innerHTML = `
      <div class="result-summary">
        <p>Kamu menjawab benar <strong>${correctCount}</strong> dari <strong>${kuisData.length}</strong> soal.</p>
        <p>Total skor posttest: <strong>${score}</strong></p>
      </div>
      <div class="history-list">${historyHtml}</div>
    `;

    if (sceneKuis) sceneKuis.style.display = 'none';
    if (sceneHasil) sceneHasil.style.display = 'block';
    saveProgress('Hari 3', score);
    localStorage.setItem(
      'fesmart_user_session',
      JSON.stringify({
        ...userData,
        totalCompliance: score,
        totalKnowledge: 0,
        lastPlayedDay: 'Hari 3',
      }),
    );
  }

  if (btnStart) {
    btnStart.addEventListener('click', startKuis);
  }

  if (btnCheck) {
    btnCheck.addEventListener('click', function () {
      const selected = document.querySelector('input[name="jawaban"]:checked');
      if (!selected) {
        alert('Pilih jawaban terlebih dahulu.');
        return;
      }
      const answerIndex = parseInt(selected.value, 10);
      userAnswers.push({
        selected: answerIndex,
        correct: kuisData[currentIndex].jawaban,
      });
      currentIndex += 1;
      if (currentIndex >= kuisData.length) {
        showResults();
      } else {
        loadQuestion(currentIndex);
      }
    });
  }

  if (btnNextDay) {
    btnNextDay.addEventListener('click', function () {
      window.location.href = 'minigames.html';
    });
  }

  init();
});
