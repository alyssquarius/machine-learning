const form = document.getElementById('forgot-form');
const message = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = new FormData(form).get('email').trim();

  if (!email) {
    ui.show(message, 'error', 'Email wajib diisi.');
    return;
  }

  ui.hide(message);
  ui.setLoading(submitBtn, true, 'Mengirim...');

  const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: ui.redirectUrl('reset-password.html'),
  });

  if (error) {
    ui.show(message, 'error', ui.friendlyError(error));
    ui.setLoading(submitBtn, false);
    return;
  }

  // Pesan sama baik email terdaftar maupun tidak, agar akun tidak bisa ditebak.
  ui.show(
    message,
    'success',
    'Jika email terdaftar, tautan untuk mengatur ulang password sudah dikirim. Cek kotak masuk atau folder spam.'
  );
  ui.setLoading(submitBtn, false);
});
