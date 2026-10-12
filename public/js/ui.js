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
// Menukar tipe input + ikon mata (tanpa menghapus SVG di dalam tombol).
const EYE_OPEN = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
const EYE_OFF = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>';
document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
  const input = document.getElementById(btn.dataset.togglePassword);
  if (!input) return;
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? EYE_OFF : EYE_OPEN;
    btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    btn.setAttribute('title', show ? 'Sembunyikan password' : 'Tampilkan password');
  });
});
