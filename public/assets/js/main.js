document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const characterCards = document.querySelectorAll('.character-card');
  const userForm = document.getElementById('user-form');
  const usernameInput = document.getElementById('username-input');
  const usernameInfo = document.getElementById('username-info');
  const anonymousCheckbox = document.getElementById('anonymous-checkbox');
  const anonymousInfo = document.getElementById('anonymous-info');
  const validationMessage = document.getElementById('validation-message');
  const startButton = document.getElementById('btn-start-game');
  const loadingContainer = document.getElementById('loading-container');

  // State Audio Global
  const bgMusic = document.getElementById('background-music');
  const soundClick = document.getElementById('sound-click');
  const soundCoolClick = document.getElementById('cool-click');
  const soundGameClick = document.getElementById('game-click');
  const notificationSound = document.getElementById('teks-opening-sound');

  let isSoundOn =
    localStorage.getItem('fesmart_sound') === 'off' ? false : true;

  // Fungsi Global untuk Mengontrol Suara
  window.playClickSound = function () {
    if (isSoundOn && soundClick) {
      soundClick.currentTime = 0; // Memastikan suara dapat diputar cepat
      soundClick
        .play()
        .catch((e) => console.log('Click sound failed to play:', e));
    }
  };

  window.playCoolClickSound = function () {
    if (isSoundOn && soundCoolClick) {
      soundCoolClick.currentTime = 0; // Memastikan suara dapat diputar cepat
      soundCoolClick
        .play()
        .catch((e) => console.log('Click sound failed to play:', e));
    }
  };

  window.playGameClickSound = function () {
    if (isSoundOn && soundGameClick) {
      soundGameClick.currentTime = 0; // Memastikan suara dapat diputar cepat
      soundGameClick
        .play()
        .catch((e) => console.log('Click sound failed to play:', e));
    }
  };

  window.playNotificationSound = function () {
    if (isSoundOn && notificationSound) {
      notificationSound.currentTime = 0; // Memastikan suara dapat diputar cepat
      notificationSound
        .play()
        .catch((e) => console.log('Click sound failed to play:', e));
    }
  };

  window.toggleSound = function () {
    isSoundOn = !isSoundOn;
    localStorage.setItem('fesmart_sound', isSoundOn ? 'on' : 'off');

    // Update ikon
    const soundBtn = document.querySelector(
      '.control-btn[onclick="toggleSound()"]'
    );
    if (soundBtn) {
      soundBtn.innerHTML = isSoundOn ? '🔊 Sound' : '🔇 Sound';
    }

    if (isSoundOn) {
      playBackgroundMusic();
    } else {
      if (bgMusic) bgMusic.pause();
    }
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

  // State
  let selectedCharacter = null;
  let isAnonymous = false;
  let isFormValid = false;

  // Reset form setiap halaman dimuat
  function resetForm() {
    usernameInput.value = '';
    anonymousCheckbox.checked = false;
    anonymousInfo.style.display = 'none';
    usernameInput.disabled = false;
    usernameInput.setAttribute('required', '');
    usernameInput.style.background = 'white';
    validationMessage.textContent = '';
    validationMessage.className = 'validation-message';

    // Reset character selection
    characterCards.forEach((card) => {
      card.classList.remove('selected', 'anonymous-selected');
    });

    // Auto-select first character by default
    if (characterCards.length > 0) {
      characterCards[0].click();
    }

    isAnonymous = false;
    validateForm();
  }

  // Character Selection
  characterCards.forEach((card) => {
    card.addEventListener('click', function () {
      window.playClickSound();
      // Remove previous selection
      characterCards.forEach((c) =>
        c.classList.remove('selected', 'anonymous-selected')
      );

      // Add selection to clicked card
      this.classList.add('selected');
      if (isAnonymous) {
        this.classList.add('anonymous-selected');
      }
      selectedCharacter = this.dataset.character;

      // Validate form
      validateForm();

      // Play selection sound effect
      playSelectionSound();
    });
  });

  // Form submission
  userForm.addEventListener('submit', function (e) {
    playGameClickSound();
    e.preventDefault();
    if (isFormValid) {
      startGame();
    }
  });

  // Anonymous Checkbox
  anonymousCheckbox.addEventListener('change', function () {
    playCoolClickSound();
    isAnonymous = this.checked;

    if (isAnonymous) {
      // Anonymous mode
      usernameInput.disabled = true;
      usernameInput.removeAttribute('required');
      usernameInput.value = '';
      anonymousInfo.style.display = 'block';

      // Add anonymous style to selected character
      characterCards.forEach((card) => {
        if (card.classList.contains('selected')) {
          card.classList.add('anonymous-selected');
        }
      });
    } else {
      // Normal mode
      usernameInput.disabled = false;
      usernameInput.setAttribute('required', '');
      usernameInput.value = '';
      anonymousInfo.style.display = 'none';

      // Remove anonymous style
      characterCards.forEach((card) => {
        card.classList.remove('anonymous-selected');
      });

      // Focus on username input
      setTimeout(() => {
        usernameInput.focus();
      }, 300);
    }

    validateForm();
  });

  // Username Input validation
  usernameInput.addEventListener('input', function () {
    playCoolClickSound();
    validateForm();

    // Real-time validation feedback
    if (!isAnonymous) {
      const username = this.value.trim();

      if (username.length === 0) {
        showValidationMessage('Nama tidak boleh kosong', 'error');
      } else if (username.length > 15) {
        showValidationMessage('Nama maksimal 15 karakter', 'error');
      } else {
        showValidationMessage('Nama tersedia', 'success');
      }
    }
  });

  // Username Input blur for additional validation
  usernameInput.addEventListener('blur', function () {
    if (!isAnonymous) {
      const username = this.value.trim();
      if (username.length > 0 && username.length <= 15) {
        this.style.borderColor = '#5662e7';
        this.style.background = '#f0fff4';
      } else {
        this.style.borderColor = '#e9ecef';
        this.style.background = 'white';
      }
    }
  });

  // Function untuk update input style
  function updateInputStyle() {
    if (usernameInput.disabled) {
      usernameInput.classList.remove(
        'username-input-focused',
        'username-input-valid',
        'username-input-invalid'
      );
      usernameInput.classList.add('username-input-disabled');
    } else if (document.activeElement === usernameInput) {
      usernameInput.classList.remove(
        'username-input-valid',
        'username-input-invalid',
        'username-input-disabled'
      );
      usernameInput.classList.add('username-input-focused');
    } else {
      const username = usernameInput.value.trim();
      usernameInput.classList.remove(
        'username-input-focused',
        'username-input-disabled'
      );

      if (username.length > 0 && username.length <= 15) {
        usernameInput.classList.add('username-input-valid');
        usernameInput.classList.remove('username-input-invalid');
      } else {
        usernameInput.classList.add('username-input-invalid');
        usernameInput.classList.remove('username-input-valid');
      }
    }
  }

  // Event listeners
  usernameInput.addEventListener('focus', function () {
    updateInputStyle();
  });

  usernameInput.addEventListener('blur', function () {
    updateInputStyle();
  });

  usernameInput.addEventListener('input', function () {
    updateInputStyle();
    validateForm();
  });

  anonymousCheckbox.addEventListener('change', function () {
    isAnonymous = this.checked;

    if (isAnonymous) {
      usernameInput.disabled = true;
      usernameInput.value = '';
      anonymousInfo.style.display = 'block';
    } else {
      usernameInput.disabled = false;
      usernameInput.value = '';
      anonymousInfo.style.display = 'none';
      setTimeout(() => {
        usernameInput.focus();
        updateInputStyle();
      }, 300);
    }

    updateInputStyle();
    validateForm();
  });

  // Check focus state periodically (fallback)
  setInterval(() => {
    updateInputStyle();
  }, 100);

  // Start Button
  startButton.addEventListener('click', function () {
    userForm.requestSubmit();
  });

  function validateForm() {
    const username = usernameInput.value.trim();

    // Check character selection
    if (!selectedCharacter) {
      isFormValid = false;
      showValidationMessage('Pilih karakter terlebih dahulu', 'error');
      return;
    }

    // Check username based on anonymous mode
    if (isAnonymous) {
      isFormValid = true;
      showValidationMessage('Siap bermain sebagai anonymous!', 'success');
    } else {
      if (username.length === 0) {
        isFormValid = false;
        showValidationMessage('Nama tidak boleh kosong', 'error');
      } else if (username.length > 15) {
        isFormValid = false;
        showValidationMessage('Nama maksimal 15 karakter', 'error');
      } else {
        isFormValid = true;
        showValidationMessage('Form valid, siap bermain!', 'success');
      }
    }

    updateStartButtonState();
  }

  function showValidationMessage(message, type) {
    validationMessage.textContent = message;
    validationMessage.className = 'validation-message';

    if (type === 'error') {
      validationMessage.classList.add('validation-error');
    } else if (type === 'success') {
      validationMessage.classList.add('validation-success');
    }
  }

  function updateStartButtonState() {
    if (isFormValid) {
      startButton.disabled = false;

      const finalUsername = isAnonymous
        ? 'Petualang FeSmart'
        : usernameInput.value.trim();
      usernameInfo.innerHTML = `${finalUsername}`;
    } else {
      startButton.disabled = true;
      startButton.textContent = 'Mulai Petualangan';
    }
  }

  function playSelectionSound()z {
    // Optional: Add sound effect for character selection
  }

  // --- KONEKSI KE BACKEND (FUNGSI UTAMA) ---
  async function startGame() {
    if (!isFormValid || !selectedCharacter) return;

    // 1. Tampilkan Loading
    if (loadingContainer) loadingContainer.classList.add('show');

    const username = isAnonymous
      ? 'Petualang FeSmart'
      : usernameInput.value.trim();

    const localUserData = {
      username: username,
      character: selectedCharacter,
      isAnonymous: isAnonymous,
      totalKnowledge: 0,
      totalCompliance: 0,
      progress: {},
    };

    try {
      // 3. FETCH KE API LOGIN
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          character: selectedCharacter,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Login Sukses:', result);

        // ============================================================
        // PERBAIKAN BUG: BERSIHKAN SISA MEMORI HARI 3-5
        // ============================================================
        localStorage.removeItem('fesmart_current_day_loop');
        // ============================================================

        // 4. Simpan Session ID
        const sessionData = {
          ...localUserData,
          id: result.user.id,
          db_username: result.user.username,
        };

        localStorage.setItem(
          'fesmart_user_session',
          JSON.stringify(sessionData)
        );
        localStorage.setItem('fesmart_user', JSON.stringify(sessionData));

        // 5. Redirect ke Hari 1
        setTimeout(() => {
          window.location.href = 'hari1.html';
        }, 1000);
      } else {
        throw new Error(result.error || 'Gagal Login');
      }
    } catch (error) {
      console.error('Error backend:', error);
      if (loadingContainer) loadingContainer.classList.remove('show');
      showValidation('Gagal terhubung ke Server.', 'error');
      alert('Gagal terhubung ke server backend.');
    }
  }

  function getCharacterName(characterId) {
    const characterNames = {
      siti: 'Siti',
      sari: 'Sari',
    };
    return characterNames[characterId] || 'Karakter';
  }

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
    };
    return (
      characterImages[characterId]?.[emotion] ||
      characterImages[characterId]?.['normal'] ||
      'assets/images/characters/default.png'
    );
  }

  function simulateAPICall(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) {
          resolve({ success: true, data: userData });
        } else {
          reject(new Error('Network error'));
        }
      }, 500);
    });
  }

  // Initialize form - RESET SETIAP KALI LOAD
  resetForm();

  // Optional: Add reset button
  // addResetButton();

  // Add interactive effects
  usernameInput.addEventListener('focus', function () {
    if (!isAnonymous) {
      this.parentElement.style.transform = 'scale(1.02)';
    }
  });

  usernameInput.addEventListener('blur', function () {
    this.parentElement.style.transform = 'scale(1)';
  });

  // Tambahkan pemanggilan ini di akhir DOMContentLoaded

  // ...
  // Initialize form - RESET SETIAP KALI LOAD
  resetForm();

  // TAMBAH: Coba putar musik latar saat halaman dimuat
  playBackgroundMusic();

  // TAMBAH: Update ikon tombol saat dimuat
  window.toggleSound();
});
