const form = document.getElementById('login-form');
const message = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');
const googleBtn = document.getElementById('google-login');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { email, password } = Object.fromEntries(new FormData(form));

  if (!email.trim() || !password) {
    ui.show(message, 'error', 'Email dan password wajib diisi.');
    return;
  }

  ui.hide(message);
  ui.setLoading(submitBtn, true, 'Memproses...');

  const { error } = await window.supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    ui.show(message, 'error', ui.friendlyError(error));
    ui.setLoading(submitBtn, false);
    return;
  }
  window.location.replace('dashboard.html');
});

googleBtn.addEventListener('click', async () => {
  ui.hide(message);
  googleBtn.disabled = true;

  const { error } = await window.supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: ui.redirectUrl('dashboard.html') },
  });

  if (error) {
    ui.show(message, 'error', ui.friendlyError(error));
    googleBtn.disabled = false;
  }
});

// Kalau sudah login, langsung ke dashboard.
window.supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) window.location.replace('dashboard.html');
});
