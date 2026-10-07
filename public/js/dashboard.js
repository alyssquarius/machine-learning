const $ = (sel) => document.querySelector(sel);

// ---------- Sidebar (mobile) ----------
const sidebar = $('#sidebar');
const overlay = $('#overlay');

function setSidebar(open) {
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('-translate-x-full', !open);
  overlay.classList.toggle('hidden', !open);
  document.body.classList.toggle('overflow-hidden', open);
}

if ($('#menu-btn')) $('#menu-btn').addEventListener('click', () => setSidebar(true));
if (overlay) overlay.addEventListener('click', () => setSidebar(false));

document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('[data-nav]').forEach((l) => {
      const on = l === link;
      l.classList.toggle('nav-active', on);
      l.classList.toggle('nav-item', !on);
    });
    setSidebar(false);
  });
});

// ---------- Dropdown (notifikasi & menu pengguna) ----------
const triggers = document.querySelectorAll('[data-menu]');

function closeMenus(except) {
  triggers.forEach((t) => {
    if (t === except) return;
    const el = document.getElementById(t.dataset.menu);
    if (el) el.classList.add('hidden');
    t.setAttribute('aria-expanded', 'false');
  });
}

triggers.forEach((t) =>
  t.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenus(t);
    const menu = document.getElementById(t.dataset.menu);
    if (menu) {
      const open = menu.classList.toggle('hidden') === false;
      t.setAttribute('aria-expanded', String(open));
    }
  })
);
document.addEventListener('click', (e) => {
  if (!e.target.closest('#notif-menu, #user-menu')) closeMenus();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenus();
    setSidebar(false);
  }
});
if ($('#mark-read')) {
  $('#mark-read').addEventListener('click', () => {
    const dot = $('#notif-dot');
    if (dot) dot.classList.add('hidden');
  });
}

// ---------- Logout ----------
if ($('#logout')) {
  $('#logout').addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.replace('index.html');
  });
}

// ---------- Sesi & data pengguna ----------
(async () => {
  const { data } = await window.supabaseClient.auth.getSession();

  // Belum login: kembali ke halaman login.
  if (!data.session) return window.location.replace('index.html');

  const user = data.session.user;
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email;
  const first = name.split(' ')[0];

  if ($('#user-name')) $('#user-name').textContent = name;
  if ($('#user-email')) $('#user-email').textContent = user.email;
  if ($('#user-name-short')) $('#user-name-short').textContent = first;
  if ($('#greeting-name')) $('#greeting-name').textContent = first;
  if ($('#avatar-initial')) $('#avatar-initial').textContent = name.trim().charAt(0).toUpperCase();

  if (meta.avatar_url) {
    const img = $('#avatar');
    if (img) {
      img.addEventListener('error', () => {
        img.classList.add('hidden');
        if ($('#avatar-initial')) $('#avatar-initial').classList.remove('hidden');
      });
      img.src = meta.avatar_url;
      img.classList.remove('hidden');
      if ($('#avatar-initial')) $('#avatar-initial').classList.add('hidden');
    }
  }

  const now = new Date();
  const h = now.getHours();
  if ($('#greeting')) {
    $('#greeting').textContent =
      h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  }
  if ($('#date')) {
    $('#date').textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  if ($('#app')) $('#app').classList.remove('invisible');
  if (window.Dashboard) window.Dashboard.render();

  // Sesi berakhir di tab lain: kembali ke login.
  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('index.html');
  });
})();
