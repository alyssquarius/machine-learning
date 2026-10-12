// AutoBuyCars - Navigasi halaman + Jual/Beli/Favorit/Riwayat/Pengaturan.
// Semua halaman memakai satu sumber data: window.CarStore (terhubung ke dashboard).
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const store = () => window.CarStore;
  const rp = (n) => (window.fmtRp ? window.fmtRp(n) : 'Rp ' + Number(n || 0).toLocaleString('id-ID'));
  const ago = (ts) => (window.timeAgo ? window.timeAgo(ts) : '');

  const PAGES = ['dashboard', 'jual', 'beli', 'favorit', 'riwayat', 'pengaturan'];
  const TITLES = {
    dashboard: 'AutoBuyCars - Dashboard',
    jual: 'AutoBuyCars - Jual Mobil',
    beli: 'AutoBuyCars - Beli Mobil',
    favorit: 'AutoBuyCars - Favorit',
    riwayat: 'AutoBuyCars - Riwayat',
    pengaturan: 'AutoBuyCars - Pengaturan',
  };

  const sellState = { filter: 'all' };
  const buyState = { q: '', cat: 'all', sort: 'new' };
  const histState = { filter: 'all' };

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  function paint() {
    if (window.Dashboard) window.Dashboard.paintIcons();
  }

  // ---------- Dashboard aman-error ----------
  // Semua render halaman Jual/Beli/dll bungkus dengan safe() agar satu
  // error kecil tidak mematikan router & tombol Tambah Listing.
  function safe(fn, label) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (err) {
        console.error(`[marketplace] ${label || fn.name || 'render'} gagal:`, err);
        return undefined;
      }
    };
  }

  // ---------- Router ----------
  function currentRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return PAGES.includes(h) ? h : 'dashboard';
  }

  function showPage(name) {
    if (!PAGES.includes(name)) name = 'dashboard';
    $$('[data-page]').forEach((s) => s.classList.toggle('hidden', s.dataset.page !== name));
    if (window.setActiveNav) window.setActiveNav(name);
    if (window.closeSidebar) window.closeSidebar();
    document.title = TITLES[name] || TITLES.dashboard;
    const scroller = $('#main-scroll') || $('.flex-1.overflow-y-auto');
    if (scroller) scroller.scrollTop = 0;

    if (name === 'dashboard' && window.Dashboard) safe(() => window.Dashboard.refresh(), 'refresh-dashboard')();
    if (name === 'jual') safe(renderSell, 'render-jual')();
    if (name === 'beli') safe(renderBuy, 'render-beli')();
    if (name === 'favorit') safe(renderFav, 'render-favorit')();
    if (name === 'riwayat') safe(renderHist, 'render-riwayat')();
    if (name === 'pengaturan') safe(renderSettings, 'render-pengaturan')();
    safe(paint, 'paint-icons')();
  }
  // Ekspos untuk debug dari console: window.__showPage('jual')
  window.__showPage = showPage;
  window.__route = currentRoute;

  window.addEventListener('hashchange', () => showPage(currentRoute()));

  // ---------- Kartu mobil (dipakai Jual/Beli/Favorit) ----------
  const STATUS_LABEL = { done: 'Terjual', running: 'Dijual', queued: 'Menunggu', failed: 'Ditolak' };
  const STATUS_CLS = {
    done: 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950',
    running: 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-gray-200 dark:border-zinc-700',
    queued: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300',
    failed: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  };

  function carArt(c, big) {
    const h = big ? 'h-44' : 'h-36';
    if (c.image) {
      return `<div class="${h} w-full overflow-hidden bg-gray-100 dark:bg-zinc-800"><img src="${c.image}" alt="${c.title}" loading="lazy" class="h-full w-full object-cover" onerror="this.remove()" /></div>`;
    }
    return `<div class="${h} w-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
      <svg viewBox="0 0 24 24" fill="currentColor" class="h-12 w-12 text-gray-300 dark:text-zinc-600"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.28l1.08 3.11H5.77L6.85 7zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
    </div>`;
  }

  function favBtn(c) {
    const on = store().isFav(c.id);
    return `<button data-fav="${c.id}" aria-label="Favorit" title="Favorit" class="absolute right-3 top-3 rounded-lg border p-2 backdrop-blur transition ${on ? 'bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950' : 'bg-white/90 dark:bg-zinc-950/80 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
    </button>`;
  }

  function card(c, opts = {}) {
    const st = STATUS_LABEL[c.status] || c.status;
    return `<article class="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition hover:border-gray-300 dark:hover:border-zinc-700">
      <div class="relative cursor-pointer" data-detail="${c.id}">${carArt(c)}${favBtn(c)}
        <span class="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CLS[c.status] || STATUS_CLS.queued}">${st}</span>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-black dark:text-white leading-snug cursor-pointer hover:underline" data-detail="${c.id}">${c.title}</h3>
        <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">${c.year} • ${Number(c.km || 0).toLocaleString('id-ID')} km • ${c.location}</p>
        <div class="mt-2 flex items-center justify-between">
          <p class="font-bold text-black dark:text-white">${rp(c.price)}</p>
          <span class="text-[11px] font-medium text-gray-500 dark:text-zinc-400">${c.category || ''}</span>
        </div>
        <div class="mt-3 flex gap-2">
          ${c.status === 'running' && !opts.sell
            ? `<button data-buy="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Beli Sekarang</button>`
            : ''}
          ${opts.sell
            ? (c.status === 'queued'
              ? `<button data-publish="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Tayangkan</button>`
              : c.status === 'running'
                ? `<button data-sold="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Tandai Terjual</button>`
                : `<button data-relist="${c.id}" class="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Jual Lagi</button>`)
            : ''}
          ${opts.sell ? `<button data-del="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900" title="Hapus"><svg data-icon="trash" class="h-4 w-4 pointer-events-none"></svg></button>` : ''}
          <button data-detail="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Detail</button>
        </div>
      </div>
    </article>`;
  }

  // ---------- JUAL ----------
  function renderSell() {
    if (!store()) return;
    const s = store().stats();
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#sell-total', s.total);
    set('#sell-active', s.active);
    set('#sell-pending', s.pending);
    set('#sell-sold', s.sold);

    $$('#sell-tabs [data-sell-filter]').forEach((b) => {
      const on = b.dataset.sellFilter === sellState.filter;
      b.className = 'rounded-lg px-4 py-1.5 text-xs font-medium transition ' + (on
        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
        : 'text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-zinc-800');
    });

    const list = store().all().filter((c) => sellState.filter === 'all' || c.status === sellState.filter);
    const grid = $('#sell-grid');
    if (grid) grid.innerHTML = list.map((c) => card(c, { sell: true })).join('');
    const empty = $('#sell-empty');
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    paint();
  }

  function openSellModal() {
    const m = $('#modal-sell');
    if (!m) {
      console.error('[marketplace] #modal-sell tidak ditemukan di HTML.');
      toast('Form jual tidak ditemukan. Muat ulang halaman.');
      return;
    }
    const msg = $('#sell-msg');
    if (msg) msg.className = 'hidden';
    m.classList.remove('hidden');
    setTimeout(() => $('#sell-title')?.focus(), 50);
  }
  function closeSellModal() {
    $('#modal-sell')?.classList.add('hidden');
  }

  function submitSell(e) {
    e.preventDefault();
    const title = $('#sell-title').value.trim();
    const price = Number($('#sell-price').value);
    const year = Number($('#sell-year').value);
    const msg = $('#sell-msg');
    const show = (t, ok) => {
      if (!msg) return;
      msg.textContent = t;
      msg.className = 'rounded-lg p-3 text-sm font-medium border mb-4 ' + (ok
        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50');
    };
    if (title.length < 4) return show('Judul mobil minimal 4 karakter.');
    if (!price || price < 1000000) return show('Harga minimal Rp 1.000.000.');
    if (!year || year < 1990 || year > 2026) return show('Tahun harus antara 1990–2026.');
    const car = store().add({
      title,
      price,
      year,
      km: $('#sell-km').value,
      location: $('#sell-location').value.trim() || '-',
      category: $('#sell-category').value,
      image: $('#sell-image').value,
      description: $('#sell-desc').value,
    });
    $('#form-sell').reset();
    closeSellModal();
    sellState.filter = 'all';
    if (currentRoute() === 'jual') renderSell();
    toast(`"${car.title}" ditambahkan, menunggu verifikasi.`);
  }

  // ---------- BELI ----------
  function fillBuyCats() {
    const sel = $('#buy-cat');
    if (!sel || !store()) return;
    const cats = [...new Set(store().all().map((c) => c.category).filter(Boolean))];
    const cur = buyState.cat;
    sel.innerHTML = '<option value="all">Semua kategori</option>' + cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    sel.value = cats.includes(cur) ? cur : 'all';
    buyState.cat = sel.value;
  }

  function renderBuy() {
    if (!store()) return;
    fillBuyCats();
    let list = store().all().filter((c) => c.status === 'running' || c.status === 'queued');
    const q = buyState.q.trim().toLowerCase();
    if (q) list = list.filter((c) => c.title.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    if (buyState.cat !== 'all') list = list.filter((c) => c.category === buyState.cat);
    if (buyState.sort === 'cheap') list.sort((a, b) => a.price - b.price);
    else if (buyState.sort === 'exp') list.sort((a, b) => b.price - a.price);
    else if (buyState.sort === 'love') list.sort((a, b) => (b.interest || 0) - (a.interest || 0));
    else list.sort((a, b) => b.createdAt - a.createdAt);

    const grid = $('#buy-grid');
    if (grid) grid.innerHTML = list.map((c) => card(c)).join('');
    const empty = $('#buy-empty');
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    const count = $('#buy-count');
    if (count) count.textContent = list.length;
    paint();
  }

  // ---------- FAVORIT ----------
  function renderFav() {
    if (!store()) return;
    const list = store().favorites();
    const grid = $('#fav-grid');
    if (grid) grid.innerHTML = list.map((c) => card(c)).join('');
    const empty = $('#fav-empty');
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    if (grid) grid.classList.toggle('hidden', list.length === 0);
    const lbl = $('#fav-count-label');
    if (lbl) lbl.textContent = list.length;
    paint();
  }

  // ---------- RIWAYAT ----------
  const HIST_TONE = {
    beli: 'bg-zinc-950 dark:bg-white', jual: 'bg-zinc-500', tawar: 'bg-zinc-400',
    favorit: 'bg-zinc-400', status: 'bg-zinc-500', verifikasi: 'bg-zinc-300 dark:bg-zinc-600',
    batal: 'bg-red-500', hapus: 'bg-zinc-300 dark:bg-zinc-600',
  };
  function renderHist() {
    if (!store()) return;
    let list = store().history();
    if (histState.filter !== 'all') list = list.filter((h) => h.type === histState.filter);
    const ul = $('#hist-list');
    if (ul) {
      ul.innerHTML = list.map((h, i) => `
        <li class="relative flex gap-3">
          ${i < list.length - 1 ? '<span class="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-zinc-800"></span>' : ''}
          <span class="relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${HIST_TONE[h.type] || 'bg-zinc-400'}"></span>
          <div class="flex-1"><p class="text-sm text-gray-700 dark:text-zinc-300">${h.text}</p><p class="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">${ago(h.ts)}</p></div>
        </li>`).join('');
    }
    const empty = $('#hist-empty');
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    const count = $('#hist-count');
    if (count) count.textContent = store().history().length;
    paint();
  }

  // ---------- PENGATURAN ----------
  function renderSettings() {
    if (!store()) return;
    const input = $('#target-input');
    if (input && document.activeElement !== input) input.value = store().getTarget();
    paintThemeButtons();
  }

  function paintThemeButtons() {
    const saved = localStorage.getItem('theme');
    const mode = saved === 'dark' || saved === 'light' ? saved : 'system';
    $$('#set-theme-group [data-set-theme]').forEach((b) => {
      const on = b.dataset.setTheme === mode;
      b.className = 'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition border ' + (on
        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white'
        : 'border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800');
    });
  }

  // ---------- DETAIL MODAL ----------
  function openDetail(id) {
    const c = store().get(id);
    if (!c) return;
    const body = $('#detail-body');
    if (!body) return;
    const st = STATUS_LABEL[c.status] || c.status;
    const on = store().isFav(c.id);
    body.innerHTML = `
      ${carArt(c, true)}
      <div class="p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CLS[c.status] || STATUS_CLS.queued}">${st}</span>
            <h3 class="mt-2 text-xl font-bold text-black dark:text-white leading-snug">${c.title}</h3>
            <p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">${c.year} • ${Number(c.km || 0).toLocaleString('id-ID')} km • ${c.location} • ${c.category || ''}</p>
          </div>
          <button data-close-detail class="shrink-0 rounded-lg border border-gray-200 dark:border-zinc-800 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"><svg data-icon="x" class="h-4 w-4 pointer-events-none"></svg></button>
        </div>
        <p class="mt-3 text-2xl font-bold text-black dark:text-white">${rp(c.price)}</p>
        <p class="mt-3 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">${c.description || 'Tidak ada deskripsi.'}</p>
        <div class="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          <span class="inline-flex items-center gap-1">❤ ${c.interest || 0}% diminati</span><span>•</span><span>Ditambahkan ${ago(c.createdAt)}</span>
        </div>
        <div class="mt-5 flex gap-2">
          ${c.status === 'running' ? `<button data-buy="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Beli Sekarang</button>` : ''}
          <button data-fav="${c.id}" class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${on ? 'bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950' : 'border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'}">${on ? '★ Favorit' : '☆ Simpan Favorit'}</button>
        </div>
        ${c.status === 'queued' ? `<button data-publish="${c.id}" class="mt-2 w-full rounded-lg border border-gray-300 dark:border-zinc-700 py-2.5 text-sm font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Tayangkan Listing</button>` : ''}
      </div>`;
    $('#modal-detail').classList.remove('hidden');
    paint();
  }
  function closeDetail() {
    $('#modal-detail')?.classList.add('hidden');
  }

  // ---------- Global click delegation ----------
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.stopPropagation();
      const on = store().toggleFav(fav.dataset.fav);
      toast(on ? 'Ditambahkan ke favorit.' : 'Dihapus dari favorit.');
      const r = currentRoute();
      if (r === 'favorit') renderFav();
      if (r === 'beli') renderBuy();
      if (r === 'jual') renderSell();
      if (!$('#modal-detail').classList.contains('hidden')) openDetail(fav.dataset.fav);
      return;
    }
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const id = buy.dataset.buy;
      const c = store().get(id);
      closeDetail();
      if (c && c.status !== 'running') { toast('Mobil ini tidak tersedia untuk dibeli.'); return; }
      if (c && confirm(`Beli "${c.title}" seharga ${rp(c.price)}?`)) {
        store().buy(id);
        toast('Pembelian berhasil! Cek menu Riwayat.');
        const r = currentRoute();
        if (r === 'beli') renderBuy();
        if (r === 'favorit') renderFav();
      }
      return;
    }
    const pub = e.target.closest('[data-publish]');
    if (pub) {
      store().setStatus(pub.dataset.publish, 'running');
      closeDetail();
      toast('Listing ditayangkan.');
      if (currentRoute() === 'jual') renderSell();
      return;
    }
    const sold = e.target.closest('[data-sold]');
    if (sold) {
      store().setStatus(sold.dataset.sold, 'done');
      toast('Listing ditandai terjual.');
      if (currentRoute() === 'jual') renderSell();
      return;
    }
    const relist = e.target.closest('[data-relist]');
    if (relist) {
      store().setStatus(relist.dataset.relist, 'running');
      toast('Listing dijual kembali.');
      if (currentRoute() === 'jual') renderSell();
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      if (confirm('Hapus listing ini?')) {
        store().remove(del.dataset.del);
        toast('Listing dihapus.');
        if (currentRoute() === 'jual') renderSell();
      }
      return;
    }
    const det = e.target.closest('[data-detail]');
    if (det) {
      openDetail(det.dataset.detail);
      return;
    }
    if (e.target.closest('[data-close-detail]')) { closeDetail(); return; }
    if (e.target.closest('[data-close-sell]')) { closeSellModal(); return; }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDetail(); closeSellModal(); }
  });

  // Listener tombol jual dipasang via delegasi klik global juga,
  // agar tetap jalan walau bind() gagal sebagian (mis. Supabase diblokir).
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-car')) {
      safe(openSellModal, 'open-sell-modal')();
      return;
    }
  });

  // ---------- Bind halaman ----------
  // Catatan: semua aksi kartu/modal juga ditangani delegasi klik global di atas,
  // jadi bind() ini hanya untuk filter & form — boleh gagal sebagian tanpa mematikan navigasi.
  function bind() {
    try {
      $$('#sell-tabs [data-sell-filter]').forEach((b) =>
        b.addEventListener('click', () => { sellState.filter = b.dataset.sellFilter; safe(renderSell, 'render-jual-filter')(); }));
    } catch (err) { console.error('[marketplace] bind sell-tabs gagal:', err); }
    try {
      $('#form-sell')?.addEventListener('submit', submitSell);
    } catch (err) { console.error('[marketplace] bind form-sell gagal:', err); }

    try {
      $('#buy-search')?.addEventListener('input', (e) => { buyState.q = e.target.value; safe(renderBuy, 'render-beli-q')(); });
    } catch (err) { console.error('[marketplace] bind buy-search gagal:', err); }
    try {
      $('#buy-cat')?.addEventListener('change', (e) => { buyState.cat = e.target.value; safe(renderBuy, 'render-beli-cat')(); });
    } catch (err) { console.error('[marketplace] bind buy-cat gagal:', err); }
    try {
      $('#buy-sort')?.addEventListener('change', (e) => { buyState.sort = e.target.value; safe(renderBuy, 'render-beli-sort')(); });
    } catch (err) { console.error('[marketplace] bind buy-sort gagal:', err); }

    try {
      $('#hist-filter')?.addEventListener('change', (e) => { histState.filter = e.target.value; safe(renderHist, 'render-riwayat-filter')(); });
    } catch (err) { console.error('[marketplace] bind hist-filter gagal:', err); }

    try {
      $('#target-save')?.addEventListener('click', () => {
        if (!store()) { toast('Data belum siap. Muat ulang halaman.'); return; }
        const v = Number($('#target-input').value);
        if (!v || v < 1) { toast('Target minimal 1.'); return; }
        store().setTarget(v);
        toast('Target penjualan disimpan.');
      });
    } catch (err) { console.error('[marketplace] bind target gagal:', err); }

    try {
      $$('#set-theme-group [data-set-theme]').forEach((b) =>
        b.addEventListener('click', () => {
          const mode = b.dataset.setTheme;
          if (mode === 'system') {
            try { localStorage.removeItem('theme'); } catch { /* abaikan */ }
            const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (window.Theme) window.Theme.set(sysDark ? 'dark' : 'light');
            else document.documentElement.classList.toggle('dark', sysDark);
            try { localStorage.removeItem('theme'); } catch { /* abaikan */ }
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'system' } }));
          } else if (window.Theme) {
            window.Theme.set(mode);
          }
          safe(paintThemeButtons, 'paint-theme')();
        }));
    } catch (err) { console.error('[marketplace] bind theme gagal:', err); }

    try {
      $('#btn-reset-data')?.addEventListener('click', () => {
        if (!store()) { toast('Data belum siap. Muat ulang halaman.'); return; }
        if (!confirm('Kembalikan semua data ke awal?')) return;
        store().reset();
        // Sinkronkan pencarian global dashboard ke halaman beli
        const s = $('#search');
        if (s) { s.value = ''; buyState.q = ''; }
        showPage(currentRoute());
        toast('Data dikembalikan ke awal.');
      });
    } catch (err) { console.error('[marketplace] bind reset gagal:', err); }

    try {
      const doLogout = async () => {
        try { await window.supabaseClient?.auth.signOut(); } finally { window.location.replace('index.html'); }
      };
      $('#logout-2')?.addEventListener('click', doLogout);
    } catch (err) { console.error('[marketplace] bind logout gagal:', err); }

    // Search global di topbar ikut memfilter halaman Beli
    try {
      $('#search')?.addEventListener('input', (e) => {
        buyState.q = e.target.value;
        const bs = $('#buy-search');
        if (bs) bs.value = e.target.value;
        if (currentRoute() === 'beli') safe(renderBuy, 'render-beli-topq')();
      });
    } catch (err) { console.error('[marketplace] bind top-search gagal:', err); }

    // Sinkron profil di Pengaturan + topbar search dua arah
    try {
      $('#buy-search')?.addEventListener('input', (e) => {
        const s = $('#search');
        if (s) s.value = e.target.value;
      });
    } catch (err) { console.error('[marketplace] bind buy-sync gagal:', err); }

    window.addEventListener('storechange', () => {
      try {
        const r = currentRoute();
        if (r === 'jual') safe(renderSell, 'render-jual-store')();
        else if (r === 'beli') safe(renderBuy, 'render-beli-store')();
        else if (r === 'favorit') safe(renderFav, 'render-fav-store')();
        else if (r === 'riwayat') safe(renderHist, 'render-riwayat-store')();
      } catch (err) { console.error('[marketplace] storechange gagal:', err); }
    });
  }

  function bootMarketplace() {
    try { bind(); } catch (err) { console.error('[marketplace] bind() gagal:', err); }
    try { showPage(currentRoute()); } catch (err) { console.error('[marketplace] showPage awal gagal:', err); }
  }

  function fillProfile(user) {
    if (!user) return;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#set-name', name);
    set('#set-email', user.email);
    set('#set-avatar', name.trim().charAt(0).toUpperCase());
  }
  window.fillSettingsProfile = fillProfile;

  // Jalankan segera bila DOM sudah siap (script di akhir body),
  // plus fallback DOMContentLoaded untuk keamanan.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootMarketplace);
  } else {
    bootMarketplace();
  }
  // Fallback kedua: pastikan rute hash awal tetap diterapkan walau
  // DOMContentLoaded sudah lewat / tertahan script lain.
  setTimeout(() => {
    try { showPage(currentRoute()); } catch (err) { console.error('[marketplace] showPage tunda gagal:', err); }
  }, 0);
})();
