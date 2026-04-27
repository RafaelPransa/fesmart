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
  const sceneHasil = document.querySelector('.scene-hasil');
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');

  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  // Tambahkan ini agar HTML bisa mengenali fungsi toggleSound
  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');

    // Opsional: Pause music jika dimatikan
    if (!isSoundOn && bgMusic) {
      bgMusic.pause();
    } else if (isSoundOn && bgMusic) {
      bgMusic.play().catch(() => {});
    }

    console.log('Sound is now: ' + (isSoundOn ? 'ON' : 'OFF'));
  };

  // --- FUNGSI YANG TADI HILANG ---
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

  function animateCharacterSpeaking(characterId, isSpeaking) {
    const charEl = document.getElementById(characterId);
    if (charEl) {
      if (isSpeaking) {
        charEl.classList.add('speaking');
      } else {
        charEl.classList.remove('speaking');
      }
    }
  }

  function typeWriter(lines, speed = 40, delay = 1000) {
    let lineIndex = 0;
    let charIndex = 0;

    const bubbleMain = document.getElementById('bubble-main');
    const bubbleTeman = document.getElementById('bubble-teman');
    if (!bubbleMain || !bubbleTeman) return;

    function startLine() {
      const currentLine = lines[lineIndex];
      const isUserSpeaking = currentLine.startsWith(
        userData.username || 'Petualang',
      );
      const bubble = isUserSpeaking ? bubbleMain : bubbleTeman;
      const otherBubble = isUserSpeaking ? bubbleTeman : bubbleMain;

      otherBubble.style.display = 'none';
      bubble.style.display = 'block';
      bubble.innerHTML = '';
      animateCharacterSpeaking('character-main', isUserSpeaking);
      animateCharacterSpeaking('character-teman', !isUserSpeaking);
    }

    function nextChar() {
      if (!lines || lines.length === 0) return;
      const currentLine = lines[lineIndex];

      if (charIndex === 0) startLine();

      if (charIndex < currentLine.length) {
        const isUserSpeaking = currentLine.startsWith(
          userData.username || 'Petualang',
        );
        const bubble = isUserSpeaking ? bubbleMain : bubbleTeman;
        bubble.innerHTML += currentLine.charAt(charIndex);
        charIndex += 1;
        if (charIndex % 3 === 0) playSound(soundCoolClick);
        setTimeout(nextChar, speed);
      } else {
        lineIndex += 1;
        charIndex = 0;
        if (lineIndex < lines.length) {
          setTimeout(nextChar, delay);
        } else {
          animateCharacterSpeaking('character-main', false);
          animateCharacterSpeaking('character-teman', false);
          bubbleMain.style.display = 'none';
          bubbleTeman.style.display = 'none';
          if (btnStart) btnStart.classList.remove('btn-hidden');
        }
      }
    }
    nextChar();
  }

  function showConversation() {
    const pretestAnswers = JSON.parse(
      localStorage.getItem('fesmart_pretest_answers') || '[]',
    );
    const questions = [
      {
        soal: 'Ehh kamu pernah dengar ga soal anemia? Aku sekarang lagi penasaran soalnya',
        correct: 'Kondisi kurangnya sel darah merah atau hemoglobin',
        explanation:
          'Iya pernah. Setauku anemia yaitu ketika kita kekurangan sel darah merah atau hemoglobin.',
      },
      {
        soal: 'Ohh kayak gitu ya, apa kamu tau ciri-ciri orang yang anemia?',
        correct: 'Mudah lelah',
        explanation:
          'Biasanya sih orang yang anemia itu cepat banget ngerasa cape.',
      },
      {
        soal: 'Selain itu ada lagi ga? Soalnya aku pernah liat di tiktok, katanya kulit pucat itu juga tanda anemia. Benar ga itu?',
        correct: 'Anemia',
        explanation: 'Iyap benar banget.',
      },
      {
        soal: 'Aku liat-liat juga di medsos katanya remaja perempuan seumuran kita yang sering mengalami anemia. Itu kenapa ya bisa begitu?',
        correct: 'Karena menstruasi',
        explanation:
          'Karena kehilangan darah saat menstruasi yang mengurangi zat besi. Ada juga tablet yang bisa untuk mencegah anemia. Nama tabletnya yaitu tablet Fe',
      },
      {
        soal: 'Woww, hebat juga ya. Emang kandungan dari tablet Fe apaan?',
        correct: 'Menambah cadangan zat besi',
        explanation:
          'Tablet Fe mengandung zat besi. Nahh, jadi bisa untuk mencegah anemia.',
      },
      {
        soal: 'Ohh oke. Terus kamu tau ga tanda gejala anemia selain mudah cape atau lelah gitu?',
        correct: 'Pusing',
        explanation:
          'Selain menyebabkan mudah lelah, gejala yang sering muncul adalah pusing',
      },
      {
        soal: 'Ohh iya tadi kamu nyebutin zat besi. Sebenarnya zat besi itu untuk apa si?',
        correct: 'Sel darah merah',
        explanation:
          'Zat besi dibutuhkan untuk membuat hemoglobin dalam darah. Zat besi dapat kita temui dalam makanan sehari-hari kita tau...',
      },
      {
        soal: 'Ohh emang iya? coba sebutin apa aja makanan yang mengandung zat besi dong.',
        correct: 'Bayam',
        explanation:
          'Banyakk kayak bayam, daging merah, dan kacang-kacangan kaya zat besi.',
      },
      {
        soal: 'Ohh iya aku ingin nanya lagi, tadi kamu bilang tablet Fe mengandung zat besi juga ya?',
        correct: 'Mencegah anemia',
        explanation:
          'Yapp!! Tablet Fe membantu mengobati anemia dengan menambah zat besi. Kamu bisa ke UKS kalo mau tabletnya.',
      },
      {
        soal: 'Ohh jadi nanti tinggal di ambil apa gimana di UKS? terus apa nanti UKS akan ngasih tau cara mengkonsumsi tablet Fe?',
        correct: 'Membagikan tablet Fe dan edukasi',
        explanation:
          'Iya tinggal ambil. Pasti dong kan itu sudah jadi tugas UKS buat edukasi tentang tablet Fe dan anemia juga.',
      },
    ];

    let lines = [];
    const correctCount = pretestAnswers.filter(
      (a) => a.selected === a.correct,
    ).length;
    const totalQuestions = questions.length;

    pretestAnswers.forEach((answer, index) => {
      const question = questions[index];
      const isCorrect = answer.selected === answer.correct;
      if (isCorrect) {
        lines.push(`${userData.username || 'Petualang'}: " ${question.soal}"`);
        lines.push(`TEMAN: "${question.explanation}"`);
      } else {
        lines.push(`${userData.username || 'Petualang'}: "${question.soal}"`);
        lines.push(`TEMAN: "'${question.correct}'. ${question.explanation}"`);
      }
    });

    lines.push(
      `${userData.username || 'Petualang'}: "Aku benar ${correctCount} dari ${totalQuestions}. Lumayan!"`,
    );
    lines.push(
      `TEMAN: "Keren! Mari lanjut pelajari tentang tablet Fe agar nilaimu sempurna di Posttest!"`,
    );

    typeWriter(lines);
  }

  function saveProgress(lastDay) {
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        lastDay,
        isCompleted: false,
      }),
    }).catch(() => console.warn('Gagal simpan ke server.'));
  }

  function startStory() {
    playSound(soundGameClick);
    if (sceneOpening) sceneOpening.style.display = 'none';
    if (sceneHasil) sceneHasil.style.display = 'block';
    const hasilMessage = document.getElementById('hasil-message');
    if (hasilMessage) {
      hasilMessage.innerHTML = `<p>Percakapan hari ini selesai!</p><p>Siapkan dirimu untuk <strong>Hari ke-3</strong>.</p>`;
    }
    saveProgress('Hari 2');
    localStorage.setItem(
      'fesmart_user_session',
      JSON.stringify({ ...userData, lastPlayedDay: 'Hari 2' }),
    );
  }

  function init() {
    // PERBAIKAN: Menampilkan gambar karakter utama
    const imgEl = document.getElementById('main-character-img');
    if (imgEl) imgEl.src = getCharacterImage(userData.character || 'siti');

    setTimeout(() => {
      if (containerOpening) {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.2s ease';
      }
      setTimeout(() => {
        if (sceneOpening) sceneOpening.style.opacity = '1';
        const charMain = document.getElementById('character-main');
        const charTeman = document.getElementById('character-teman');
        if (charMain) charMain.classList.add('slide-main');
        if (charTeman) charTeman.classList.add('slide-teman');
        showConversation();
      }, 1200);
    }, 1500);
    if (bgMusic) playSound(bgMusic);
  }

  if (btnStart) btnStart.addEventListener('click', startStory);
  if (btnRestart)
    btnRestart.addEventListener('click', () => {
      window.location.href = 'hari3.html';
    });

  init();
});
