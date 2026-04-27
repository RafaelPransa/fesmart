document.addEventListener('DOMContentLoaded', function () {
  const userData =
    JSON.parse(localStorage.getItem('fesmart_user_session')) ||
    JSON.parse(localStorage.getItem('fesmart_user'));

  if (!userData || !userData.id) {
    alert('Sesi habis. Silakan masuk kembali.');
    window.location.href = 'index.html';
    return;
  }

  const containerOpening = document.querySelector('.container-opening');
  const sceneOpening = document.querySelector('.scene-opening');
  const sceneKuis = document.querySelector('.scene-kuis');
  const sceneHasil = document.querySelector('.scene-hasil');
  const characterMain = document.getElementById('character-main');
  const guru = document.getElementById('character-guru');
  const teksOpening = document.querySelector('.teks-opening');
  const btnStart = document.getElementById('btn-start');
  const btnNext = document.getElementById('btn-next');
  const btnRestart = document.getElementById('btn-restart');

  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

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

  function playSound(audio) {
    if (!isSoundOn || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');
  };

  function updateCharacterName() {
    const nameEl = document.getElementById('main-character-name');
    if (nameEl) nameEl.textContent = userData.username || 'Petualang';
    const imgEl = document.getElementById('main-character-img');
    if (imgEl) imgEl.src = getCharacterImage(userData.character || 'siti');
  }

  function typeWriter(lines, speed = 35, delay = 800) {
    if (!teksOpening) return;
    teksOpening.innerHTML = '';
    let lineIndex = 0;
    let charIndex = 0;

    function nextChar() {
      const currentLine = lines[lineIndex];
      if (charIndex < currentLine.length) {
        teksOpening.innerHTML += currentLine.charAt(charIndex);
        charIndex += 1;
        if (charIndex % 3 === 0) playSound(soundCoolClick);
        setTimeout(nextChar, speed);
      } else {
        lineIndex += 1;
        charIndex = 0;
        if (lineIndex < lines.length) {
          teksOpening.innerHTML += '<br><br>';
          setTimeout(nextChar, delay);
        }
      }
    }
    nextChar();
  }

  function init() {
    updateCharacterName();
    setTimeout(() => {
      if (containerOpening) {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.2s ease';
      }
      setTimeout(() => {
        if (sceneOpening) sceneOpening.style.opacity = '1';
        showOpeningDialog();
      }, 1200);
    }, 1500);
    playSound(bgMusic);
  }

  function showOpeningDialog() {
    // Add slide and floating animations
    if (characterMain) characterMain.classList.add('slide-main', 'floating');
    if (guru) guru.classList.add('slide-guru', 'floating');

    const lines = [
      `${userData.username || 'Petualang'}: "Aku ingin tahu lebih banyak tentang anemia dan tablet Fe."`,
      'GURU UKS: "Ayo kita mulai dengan pretest ringan. Jawabanmu tidak akan dihitung ke poin resmi."',
    ];
    typeWriter(lines);
    if (btnStart) btnStart.classList.remove('btn-hidden');
  }

  function startKuis() {
    playSound(soundGameClick);
    if (sceneOpening) sceneOpening.style.display = 'none';
    if (sceneKuis) sceneKuis.style.display = 'block';
    // Update character image for kuis
    const imgEl = document.getElementById('main-character-kuis-img');
    if (imgEl) imgEl.src = getCharacterImage(userData.character || 'siti');
    loadQuestion(currentIndex);
  }

  function loadQuestion(index) {
    const question = kuisData[index];
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const kuisContent = document.getElementById('kuis-content');

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
                <label>
                  <input type="radio" name="jawaban" value="${i}" />
                  <span class="opsi-text">${String.fromCharCode(65 + i)}. ${opsi}</span>
                </label>`,
            )
            .join('')}
        </div>
      </div>`;

    document.querySelectorAll('input[name="jawaban"]').forEach((radio) => {
      radio.addEventListener('change', () => playSound(soundClick));
    });
    if (btnNext)
      btnNext.textContent =
        index === kuisData.length - 1 ? 'Selesai' : 'Selanjutnya ➡';
  }

  function saveProgress(lastDay, totalScore = 0, isCompleted = false) {
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        totalKnowledge: 0,
        totalCompliance: totalScore,
        finalHb: userData.finalHb || 0,
        lastDay,
        isCompleted,
      }),
    }).catch(() => {
      console.warn('Gagal menyimpan progress Hari 1.');
    });
  }

  function showResults() {
    const totalCorrect = userAnswers.filter(
      (item) => item.selected === item.correct,
    ).length;
    const hasilMessage = document.getElementById('hasil-message');
    if (hasilMessage) {
      hasilMessage.innerHTML = `
        <p>Kamu menjawab benar <strong>${totalCorrect}</strong> dari <strong>${kuisData.length}</strong> soal.</p>
        <p>Ini adalah pretest. Skor ini <strong>belum dihitung</strong> ke total poin akhir.</p>
      `;
    }
    if (sceneKuis) sceneKuis.style.display = 'none';
    if (sceneHasil) sceneHasil.style.display = 'block';
    saveProgress('Hari 1', 0, false);
    localStorage.setItem(
      'fesmart_user_session',
      JSON.stringify({
        ...userData,
        lastPlayedDay: 'Hari 1',
        totalCompliance: 0,
        totalKnowledge: 0,
      }),
    );
    localStorage.setItem(
      'fesmart_pretest_answers',
      JSON.stringify(userAnswers),
    );
  }

  if (btnStart) {
    btnStart.addEventListener('click', startKuis);
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      const selectedEl = document.querySelector(
        'input[name="jawaban"]:checked',
      );
      if (!selectedEl) {
        alert('Silakan pilih jawaban terlebih dahulu.');
        return;
      }
      const selected = parseInt(selectedEl.value, 10);
      userAnswers.push({ selected, correct: kuisData[currentIndex].jawaban });
      currentIndex += 1;
      if (currentIndex >= kuisData.length) {
        showResults();
      } else {
        loadQuestion(currentIndex);
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', function () {
      window.location.href = 'hari2.html';
    });
  }

  init();
});
