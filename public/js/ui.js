// Helper UI yang dipakai semua halaman auth.
window.ui = {
  show(el, type, message) {
    el.textContent = message;
    el.className =
      'rounded-xl px-4 py-3 text-sm border ' +
      (type === 'error'
        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
        : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50');
  },

  hide(el) {
    el.className = 'hidden';
    el.textContent = '';
  },

  setLoading(btn, loading, loadingText) {
    if (loading) {
      btn.dataset.html = btn.innerHTML;
      btn.innerHTML =
        '<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>' +
        '<path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round" class="opacity-90"/>' +
        '</svg><span>' + (loadingText || 'Memproses...') + '</span>';
    } else if (btn.dataset.html) {
      btn.innerHTML = btn.dataset.html;
    }
    btn.disabled = loading;
    btn.classList.toggle('opacity-70', loading);
    btn.classList.toggle('cursor-not-allowed', loading);
  },

  friendlyError(error) {
    const msg = (error && error.message ? error.message : '').toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Email atau password salah.';
    if (msg.includes('email not confirmed')) return 'Email belum diverifikasi. Cek kotak masuk Anda.';
    if (msg.includes('already registered')) return 'Email sudah terdaftar. Silakan login.';
    if (msg.includes('rate limit') || msg.includes('too many'))
      return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
    if (msg.includes('same password')) return 'Password baru tidak boleh sama dengan yang lama.';
    if (msg.includes('password') && msg.includes('characters')) return 'Password terlalu pendek.';
    if (msg.includes('failed to fetch') || msg.includes('network'))
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    return (error && error.message) || 'Terjadi kesalahan. Silakan coba lagi.';
  },

  redirectUrl(page) {
    return new URL(page, window.location.href).href;
  },
};

// Tombol "Lihat/Sembunyi" password: <button data-toggle-password="id-input">
document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
  const input = document.getElementById(btn.dataset.togglePassword);
  if (!input) return;
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Sembunyi' : 'Lihat';
    btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  });
});
