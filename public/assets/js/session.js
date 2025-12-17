(function () {
  const loginStatus = sessionStorage.getItem('fesmart_admin_logged_in');
  const lastActive = sessionStorage.getItem('fesmart_admin_last_active');
  const now = Date.now();
  const timeout = 10 * 60 * 1000; // 10 menit dalam milidetik

  // 1. Cek apakah sudah login
  if (!loginStatus) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Cek apakah sesi sudah kadaluarsa (lebih dari 10 menit)
  if (lastActive && now - lastActive > timeout) {
    sessionStorage.removeItem('fesmart_admin_logged_in');
    sessionStorage.removeItem('fesmart_admin_last_active');
    sessionStorage.removeItem('fesmart_admin_name');
    alert('Sesi Anda telah berakhir (10 menit). Silakan login kembali.');
    window.location.href = 'admin-login.html';
    return;
  }

  // 3. Jika masih valid, perbarui waktu aktif terakhir
  sessionStorage.setItem('fesmart_admin_last_active', now);
})();
