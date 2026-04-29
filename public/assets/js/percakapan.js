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
    const soundBtn = document.querySelector(
      '.control-btn[onclick="toggleSound()"]',
    );
    if (soundBtn) {
      soundBtn.innerHTML = isSoundOn ? '🔊 Suara' : '🔇 Suara';
    }

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

  function typeWriter(lines, speed = 1, delay = 100) {
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
      bubble.innerHTML = ''; // Reset isi bubble
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

        // PERBAIKAN: Gunakan slice agar tag HTML terproses secara utuh oleh innerHTML
        bubble.innerHTML = currentLine.slice(0, charIndex + 1);

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
          // Biarkan bubble terakhir tetap tampil sejenak atau sembunyikan sesuai keinginan
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
        soal: 'Eh, kamu pernah dengar soal anemia nggak? Aku lagi penasaran banget nih.',
        correct: 'Kondisi kurangnya sel darah merah atau hemoglobin',
        explanation:
          'Pernah dong! Setahuku, anemia itu kondisi saat kita kekurangan sel darah merah atau hemoglobin dalam tubuh.',
      },
      {
        soal: 'Oh, begitu ya. Kalau ciri-ciri orang yang terkena anemia itu seperti apa sih?',
        correct: 'Mudah lelah',
        explanation:
          'Biasanya orang yang anemia itu bakal cepat merasa lelah atau lemas meskipun nggak beraktivitas berat.',
      },
      {
        soal: 'Selain itu ada lagi nggak? Soalnya aku pernah lihat di TikTok, katanya kulit pucat juga tanda anemia. Benar nggak sih?',
        correct: 'Anemia',
        explanation:
          'Iya, benar banget! Kulit yang terlihat pucat juga salah satu indikator kalau seseorang terkena anemia.',
      },
      {
        soal: 'Aku lihat di medsos, katanya remaja perempuan seumuran kita yang paling sering mengalami anemia. Itu kenapa ya?',
        correct: 'Karena menstruasi',
        explanation:
          'Karena kita kehilangan darah saat menstruasi, sehingga cadangan zat besi berkurang. Nah, makanya ada tablet Fe untuk mencegahnya.',
      },
      {
        soal: 'Wah, hebat juga ya penjelasannya. Memangnya fungsi utama dari tablet Fe itu apa?',
        correct: 'Menambah cadangan zat besi',
        explanation:
          'Tablet Fe itu isinya zat besi. Fungsinya untuk menambah cadangan zat besi di tubuh kita supaya terhindar dari anemia.',
      },
      {
        soal: 'Oke, paham. Terus, kamu tahu nggak gejala anemia selain mudah lelah atau lemas?',
        correct: 'Pusing',
        explanation:
          'Selain gampang capek, gejala yang paling sering muncul itu biasanya pusing atau sakit kepala.',
      },
      {
        soal: 'Oh iya, tadi kamu sempat sebut soal zat besi. Sebenarnya zat besi itu fungsinya untuk apa sih?',
        correct: 'Sel darah merah',
        explanation:
          'Zat besi itu bahan utama untuk membuat hemoglobin dalam darah. Kita bisa menemukan zat besi di makanan sehari-hari, lho.',
      },
      {
        soal: 'Oh, ya? Coba sebutkan dong makanan apa saja yang banyak mengandung zat besi.',
        correct: 'Bayam',
        explanation:
          'Banyak kok! Contohnya seperti bayam, daging merah, dan kacang-kacangan. Itu semua kaya akan zat besi.',
      },
      {
        soal: 'Tadi kamu bilang tablet Fe mengandung zat besi juga, kan?',
        correct: 'Mencegah anemia',
        explanation:
          'Yap, tepat sekali! Tablet Fe membantu mencegah dan mengobati anemia. Kalau kamu butuh, bisa coba minta ke UKS.',
      },
      {
        soal: 'Terus nanti di UKS tinggal ambil saja? Apa pihak UKS bakal kasih tahu juga cara minumnya?',
        correct: 'Membagikan tablet Fe dan edukasi',
        explanation:
          'Iya, tinggal ambil saja. Pasti dikasih tahu kok, karena sudah tugas UKS untuk membagikan tablet Fe sekaligus memberikan edukasi.',
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
        lines.push(`${userData.username || 'Petualang'}: ${question.soal}`);
        lines.push(
          `Teman ${userData.username.toLowerCase() || 'petualang'}: ${question.explanation}`,
        );
      } else {
        lines.push(`${userData.username || 'Petualang'}: ${question.soal}`);
        lines.push(
          `Teman ${userData.username.toLowerCase() || 'petualang'}: ${question.explanation}`,
        );
      }
    });

    lines.push(
      `${userData.username || 'Petualang'}: Aku menjawab benar ${correctCount} dari ${totalQuestions}. Lumayan!`,
    );
    lines.push(
      `Teman ${userData.username.toLowerCase() || 'petualang'}: Keren! Mari lanjut mempelajari tentang tablet Fe agar nilaimu sempurna di <i>post-test</i>!`,
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
      hasilMessage.innerHTML = `<p>Percakapan hari ini selesai!</p><p>Siapkan diri kamu untuk <strong><i>post-test</i>.</strong>`;
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
      // Pemicu selesai Hari 2: klik tombol lanjut ke hari 3
      saveProgress('Hari 2');
      localStorage.setItem(
        'fesmart_user_session',
        JSON.stringify({ ...userData, lastPlayedDay: 'Hari 2' }),
      );
      window.location.href = 'post-test.html';
    });

  init();
});
