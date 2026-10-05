const form = document.getElementById('reset-form');
const checking = document.getElementById('checking');
const message = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');

let ready = false;

function showForm() {
  ready = true;
  checking.classList.add('hidden');
  form.classList.remove('hidden');
}

// Tautan di email membawa sesi "recovery"; Supabase memicu event ini.
window.supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY' || (session && !ready)) showForm();
});

// Tautan tidak valid / kedaluwarsa bila tidak ada sesi setelah jeda singkat.
setTimeout(() => {
  if (ready) return;
  checking.classList.add('hidden');
  ui.show(
    message,
    'error',
    'Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru di halaman Lupa password.'
  );
}, 2500);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { password, confirm } = Object.fromEntries(new FormData(form));

  if (password.length < 8) {
    ui.show(message, 'error', 'Password minimal 8 karakter.');
    return;
  }
  if (password !== confirm) {
    ui.show(message, 'error', 'Konfirmasi password tidak sama.');
    return;
  }

  ui.hide(message);
  ui.setLoading(submitBtn, true, 'Menyimpan...');

  const { error } = await window.supabaseClient.auth.updateUser({ password });

  if (error) {
    ui.show(message, 'error', ui.friendlyError(error));
    ui.setLoading(submitBtn, false);
    return;
  }

  ui.show(message, 'success', 'Password berhasil diubah. Mengalihkan ke dashboard...');
  setTimeout(() => window.location.replace('dashboard.html'), 1500);
});
