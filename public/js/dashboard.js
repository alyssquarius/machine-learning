const $ = (sel) => document.querySelector(sel);

// ---------- Sidebar (mobile) ----------
const sidebar = $('#sidebar');
const overlay = $('#overlay');

function setSidebar(open) {
  sidebar.classList.toggle('-translate-x-full', !open);
  overlay.classList.toggle('hidden', !open);
  document.body.classList.toggle('overflow-hidden', open);
}
$('#menu-btn').addEventListener('click', () => setSidebar(true));
overlay.addEventListener('click', () => setSidebar(false));

document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('[data-nav]').forEach((l) => {
      const on = l === link;
      l.classList.toggle('bg-white/10', on);
      l.classList.toggle('text-white', on);
      l.classList.toggle('text-slate-400', !on);
    });
    setSidebar(false);
  });
});

// ---------- Dropdown (notifikasi & menu pengguna) ----------
const triggers = document.querySelectorAll('[data-menu]');

function closeMenus(except) {
  triggers.forEach((t) => {
    if (t === except) return;
    document.getElementById(t.dataset.menu).classList.add('hidden');
    t.setAttribute('aria-expanded', 'false');
  });
}
triggers.forEach((t) =>
  t.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenus(t);
    const menu = document.getElementById(t.dataset.menu);
    const open = menu.classList.toggle('hidden') === false;
    t.setAttribute('aria-expanded', String(open));
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
$('#mark-read').addEventListener('click', () => $('#notif-dot').classList.add('hidden'));

// ---------- Logout ----------
$('#logout').addEventListener('click', async () => {
  await window.supabaseClient.auth.signOut();
  window.location.replace('index.html');
});

// ---------- Sesi & data pengguna ----------
(async () => {
  const { data } = await window.supabaseClient.auth.getSession();

  // Belum login: kembali ke halaman login.
  if (!data.session) return window.location.replace('index.html');

  const user = data.session.user;
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email;
  const first = name.split(' ')[0];

  $('#user-name').textContent = name;
  $('#user-email').textContent = user.email;
  $('#user-name-short').textContent = first;
  $('#greeting-name').textContent = first;
  $('#avatar-initial').textContent = name.trim().charAt(0).toUpperCase();

  if (meta.avatar_url) {
    const img = $('#avatar');
    img.addEventListener('error', () => {
      img.classList.add('hidden');
      $('#avatar-initial').classList.remove('hidden');
    });
    img.src = meta.avatar_url;
    img.classList.remove('hidden');
    $('#avatar-initial').classList.add('hidden');
  }

  const now = new Date();
  const h = now.getHours();
  $('#greeting').textContent =
    h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  $('#date').textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  $('#app').classList.remove('invisible');
  window.Dashboard.render();

  // Sesi berakhir di tab lain: kembali ke login.
  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('index.html');
  });
})();
