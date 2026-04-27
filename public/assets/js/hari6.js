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
  const sceneSimulasi = document.getElementById('scene-simulasi-fe');
  const sceneHasil = document.getElementById('scene-hasil-akhir');
  const btnStart = document.getElementById('btn-start');
  const btnIkut = document.getElementById('btn-ikut');
  const btnTidakIkut = document.getElementById('btn-tidak-ikut');
  const btnLanjut = document.getElementById('btn-lanjut-hari6');
  const feedback = document.getElementById('simulasi-feedback');
  const openingSubtitle = document.querySelector('.opening-subtitle');
  const openingTitle = document.querySelector('.opening-title');

  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');

  let isSoundOn = localStorage.getItem('fesmart_sound') !== 'off';

  function playSound(audio) {
    if (!isSoundOn || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');
  };

  function saveProgress(lastDay) {
    fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        totalKnowledge: 0,
        totalCompliance: userData.totalCompliance || 0,
        finalHb: userData.finalHb || 0,
        lastDay,
        isCompleted: true,
      }),
    }).catch(() => {
      console.warn('Gagal menyimpan progress Hari 4');
    });
  }

  function init() {
    if (openingTitle) openingTitle.textContent = 'Hari - 4';
    if (openingSubtitle) openingSubtitle.textContent = 'Mini Game Refresh Otak';
    if (btnStart) btnStart.textContent = 'Mulai Mini Game';
    setTimeout(() => {
      if (containerOpening) {
        containerOpening.style.transform = 'translateY(-100vh)';
        containerOpening.style.transition = 'transform 1.2s ease';
      }
      setTimeout(() => {
        if (sceneOpening) sceneOpening.style.opacity = '1';
      }, 1200);
    }, 1500);
    playSound(bgMusic);
  }

  function startMiniGame() {
    playSound(soundGameClick);
    if (sceneOpening) sceneOpening.style.display = 'none';
    if (sceneSimulasi) sceneSimulasi.style.display = 'block';
    if (feedback)
      feedback.textContent =
        'Pilih salah satu opsi berikut untuk menyegarkan otak. Tidak ada poin tambahan di hari ini.';
  }

  function chooseOption(isPositive) {
    if (!feedback) return;
    if (isPositive) {
      feedback.innerHTML =
        '✅ Kamu memilih opsi yang lebih sehat. Mini game ini hanya untuk menyegarkan otak, skor tidak berubah.';
    } else {
      feedback.innerHTML =
        '⚠️ Opsi ini kurang baik untuk kesehatan. Tenang, skor tetap tidak berubah karena ini hanya mini game.';
    }
    if (btnLanjut) {
      btnLanjut.classList.remove('btn-hidden');
      btnLanjut.style.display = 'inline-block';
    }
  }

  function finishMiniGame() {
    saveProgress('Hari 4');
    localStorage.setItem(
      'fesmart_user_session',
      JSON.stringify({
        ...userData,
        lastPlayedDay: 'Hari 4',
      }),
    );
    window.location.href = 'index.html';
  }

  if (btnStart) btnStart.addEventListener('click', startMiniGame);
  if (btnIkut) btnIkut.addEventListener('click', function () {
    playSound(soundClick);
    chooseOption(true);
  });
  if (btnTidakIkut) btnTidakIkut.addEventListener('click', function () {
    playSound(soundClick);
    chooseOption(false);
  });
  if (btnLanjut) btnLanjut.addEventListener('click', finishMiniGame);

  init();
});
