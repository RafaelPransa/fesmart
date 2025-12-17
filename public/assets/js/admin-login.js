document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember-me');
  const errorMsg = document.getElementById('error-message');
  const btnLogin = document.querySelector('.btn-login');

  // --- 1. CEK APAKAH ADA DATA TERSEMPAN ---
  const savedUser = localStorage.getItem('fesmart_remember_user');
  const savedPass = localStorage.getItem('fesmart_remember_pass');

  if (savedUser && savedPass) {
    usernameInput.value = savedUser;
    passwordInput.value = savedPass;
    rememberCheckbox.checked = true;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      errorMsg.style.display = 'none';

      if (!username || !password) {
        showError('Username dan Password harus diisi!');
        return;
      }

      // UI Loading State
      const originalBtnText = btnLogin.textContent;
      btnLogin.textContent = 'Memuat...';
      btnLogin.disabled = true;

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // --- 2. LOGIKA REMEMBER ME ---
          if (rememberCheckbox.checked) {
            localStorage.setItem('fesmart_remember_user', username);
            localStorage.setItem('fesmart_remember_pass', password);
          } else {
            localStorage.removeItem('fesmart_remember_user');
            localStorage.removeItem('fesmart_remember_pass');
          }

          // Simpan sesi admin
          sessionStorage.setItem('fesmart_admin_logged_in', 'true');
          sessionStorage.setItem('fesmart_admin_name', data.user.username);
          sessionStorage.setItem('fesmart_admin_last_active', Date.now());

          window.location.href = 'index.html';
        } else {
          showError(data.error || 'Username atau Password salah!');
          resetButton(originalBtnText);
        }
      } catch (error) {
        showError('Gagal terhubung ke server.');
        resetButton(originalBtnText);
      }
    });
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function resetButton(text) {
    btnLogin.textContent = text;
    btnLogin.disabled = false;
  }

  // --- FITUR SHOW PASSWORD ---
  const togglePassword = document.getElementById('togglePassword');
  const passwordField = document.getElementById('password');

  if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', function () {
      // Toggle tipe input
      const type =
        passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordField.setAttribute('type', type);

      // Toggle ikon (Mata Terbuka / Mata Tertutup)
      this.classList.toggle('ph-eye');
      this.classList.toggle('ph-eye-closed');
    });
  }
});
