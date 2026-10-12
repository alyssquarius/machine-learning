const $ = (sel) => document.querySelector(sel);

// ---------- Sidebar (mobile drawer + collapse desktop) ----------
const sidebar = $('#sidebar');
const overlay = $('#overlay');
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

function setMobile(open) {
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('-translate-x-full', !open);
  overlay.classList.toggle('hidden', !open);
  document.body.classList.toggle('overflow-hidden', open && !isDesktop());
}

function setCollapsed(collapsed) {
  if (!sidebar) return;
  sidebar.classList.toggle('sidebar-collapsed', collapsed);
  try { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0'); } catch { /* abaikan */ }
}

// Pulihkan preferensi collapse desktop.
try {
  if (isDesktop() && localStorage.getItem('sidebar-collapsed') === '1') {
    sidebar?.classList.add('sidebar-collapsed');
  }
} catch { /* abaikan */ }

if ($('#menu-btn')) $('#menu-btn').addEventListener('click', () => {
  if (isDesktop()) {
    setCollapsed(!sidebar?.classList.contains('sidebar-collapsed'));
  } else {
    setMobile(sidebar?.classList.contains('-translate-x-full'));
  }
});
if (overlay) overlay.addEventListener('click', () => setMobile(false));
// Saat pindah ke desktop, pastikan overlay & scroll terkunci tidak nyangkut.
window.addEventListener('resize', () => { if (isDesktop()) setMobile(false); });

function setSidebar(open) { setMobile(open); }

// Navigasi antar halaman (#/dashboard, #/jual, ...) ditangani marketplace.js.
// Di sini hanya sediakan helper agar status aktif nav selalu sinkron.
window.setActiveNav = function (name) {
  document.querySelectorAll('[data-nav]').forEach((l) => {
    const on = l.dataset.nav === name;
    l.classList.toggle('nav-active', on);
    l.classList.toggle('nav-item', !on);
  });
};
window.closeSidebar = () => setSidebar(false);

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
    // Terintegrasi: catat waktu baca agar dot tidak muncul lagi sampai ada aktivitas baru.
    try { window.CarStore?.markNotifsRead(); } catch { /* abaikan */ }
    if (window.Dashboard?.paintNotifDot) window.Dashboard.paintNotifDot();
    else {
      const dot = $('#notif-dot');
      if (dot) dot.classList.add('hidden');
    }
  });
}

// ---------- Logout ----------
if ($('#logout')) {
  $('#logout').addEventListener('click', async () => {
    try {
      await window.supabaseClient?.auth.signOut();
    } catch (err) {
      console.error('[dashboard] logout gagal:', err);
    } finally {
      window.location.replace('index.html');
    }
  });
}

// ---------- Sesi & data pengguna ----------
// Catatan: UI jangan dikunci di balik `invisible` bila Supabase gagal/offline.
// Router marketplace tetap jalan; blok ini hanya mengisi profil bila sesi ada.
function unhideApp() {
  if ($('#app')) $('#app').classList.remove('invisible');
}

function renderDashboardSafe() {
  try {
    if (window.Dashboard) window.Dashboard.render();
  } catch (err) {
    console.error('[dashboard] render gagal:', err);
  }
  // Pastikan rute hash awal (mis. #/jual) diterapkan walau sesi tertahan.
  try {
    if (window.__showPage && window.__route) window.__showPage(window.__route());
  } catch (err) {
    console.error('[dashboard] terapkan rute awal gagal:', err);
  }
}

(async () => {
  // Fallback: jangan biarkan layar tetap invisible lebih dari 1,5 dtk.
  setTimeout(() => {
    unhideApp();
    if (!window.__dashboardRendered) {
      window.__dashboardRendered = true;
      renderDashboardSafe();
    }
  }, 1500);

  let session = null;
  try {
    if (!window.supabaseClient) throw new Error('supabaseClient belum siap');
    const { data } = await window.supabaseClient.auth.getSession();
    session = data?.session || null;
  } catch (err) {
    console.error('[dashboard] cek sesi gagal (mode demo):', err);
    unhideApp();
    if (!window.__dashboardRendered) {
      window.__dashboardRendered = true;
      renderDashboardSafe();
    }
    return;
  }

  // Belum login: kembali ke halaman login.
  if (!session) return window.location.replace('index.html');

  const user = session.user;
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

  unhideApp();
  window.__dashboardRendered = true;
  if (window.fillSettingsProfile) window.fillSettingsProfile(user);
  renderDashboardSafe();

  // Sesi berakhir di tab lain: kembali ke login.
  try {
    window.supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace('index.html');
    });
  } catch (err) {
    console.error('[dashboard] auth listener gagal:', err);
  }
})();
