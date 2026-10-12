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
  const buyState = { q: '', cat: 'all', sort: 'new', min: '', max: '', loc: 'all', year: 'all' };
  const histState = { filter: 'all' };
  // ID listing yang sedang diedit (null = mode tambah baru).
  let editingId = null;

  // Pilihan filter harga cepat (rupiah).
  const PRICE_PRESETS = [
    { id: 'all', label: 'Semua harga', min: '', max: '' },
    { id: 'u200', label: '< Rp 200 jt', min: '', max: 200000000 },
    { id: '200-400', label: 'Rp 200–400 jt', min: 200000000, max: 400000000 },
    { id: '400-600', label: 'Rp 400–600 jt', min: 400000000, max: 600000000 },
    { id: 'a600', label: '> Rp 600 jt', min: 600000000, max: '' },
  ];

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

  // Foto bawaan per kategori — samakan dengan store.js agar konsisten di semua halaman.
  // (Fallback saja; tiap mobil seed sudah punya foto mereknya sendiri.)
  const W = (n) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(n)}?width=800`;
  const CATEGORY_IMAGES = {
    SUV: W('2015 Toyota Fortuner (New Zealand).jpg'),
    Sedan: W('Honda Civic e-HEV Sport (XI) – f 30062024.jpg'),
    MPV: W('2022 Toyota Avanza 1.5 G Toyota Safety Sense W101RE (20220403).jpg'),
    Hatchback: W('2014 Daihatsu Ayla 1.0 X B100RS (20190615).jpg'),
    Listrik: W('Hyundai Ioniq 5 AWD Techniq-Paket – f 31122024.jpg'),
    Lainnya: W('Honda CR-V e-HEV Elegance AWD (VI) – f 14072024.jpg'),
  };
  function carImage(c) {
    const url = (c.image || '').trim();
    if (url) return url;
    return CATEGORY_IMAGES[c.category] || CATEGORY_IMAGES.Lainnya;
  }

  function carArt(c, big) {
    const h = big ? 'h-44' : 'h-36';
    const src = carImage(c);
    const fallback = CATEGORY_IMAGES[c.category] || CATEGORY_IMAGES.Lainnya;
    return `<div class="${h} w-full overflow-hidden bg-gray-100 dark:bg-zinc-800"><img src="${src}" alt="${c.title}" loading="lazy" class="h-full w-full object-cover" onerror="this.onerror=null;this.src='${fallback}'" /></div>`;
  }

  // Badge + daftar penawaran ringkas pada kartu.
  function offerBadge(c) {
    const best = store() ? store().bestOffer(c.id) : null;
    if (!best || best.status !== 'pending') return '';
    return `<span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-zinc-200">Tawaran tertinggi ${rp(best.amount)}</span>`;
  }

  function offerList(c, compact) {
    if (!store()) return '';
    const list = store().offersFor(c.id);
    if (!list.length) return '';
    const rows = (compact ? list.slice(0, 2) : list).map((o) => `
      <div class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-zinc-800 px-3 py-2 text-xs">
        <div class="min-w-0">
          <p class="font-bold text-black dark:text-white">${rp(o.amount)}</p>
          <p class="text-gray-500 dark:text-zinc-400 truncate">${o.note ? o.note + ' • ' : ''}${ago(o.ts)} • ${o.status === 'pending' ? 'menunggu' : o.status === 'accepted' ? 'diterima' : 'ditolak'}</p>
        </div>
        ${o.status === 'pending' ? `<div class="flex shrink-0 gap-1">
          <button data-accept="${c.id}:${o.id}" class="rounded-md bg-zinc-950 dark:bg-white px-2.5 py-1 text-[11px] font-semibold text-white dark:text-zinc-950">Terima</button>
          <button data-reject="${c.id}:${o.id}" class="rounded-md border border-gray-300 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-semibold">Tolak</button>
        </div>` : ''}
      </div>`).join('');
    return `<div class="mt-3 space-y-2">${rows}${compact && list.length > 2 ? `<button data-detail="${c.id}" class="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 hover:underline">Lihat ${list.length - 2} tawaran lain</button>` : ''}</div>`;
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
            ? `<button data-buy="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Beli Sekarang</button>
               <button data-offer="${c.id}" class="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Tawar</button>`
            : c.status === 'queued' && !opts.sell
              ? `<button data-offer="${c.id}" class="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Tawar</button>`
              : ''}
          ${offerBadge(c)}
          ${opts.sell
            ? (c.status === 'queued'
              ? `<button data-publish="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Tayangkan</button>`
              : c.status === 'running'
                ? `<button data-sold="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2 text-xs font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Tandai Terjual</button>`
                : `<button data-relist="${c.id}" class="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Jual Lagi</button>`)
            : ''}
          ${opts.sell ? `<button data-edit="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800" title="Edit"><svg data-icon="edit" class="h-4 w-4 pointer-events-none"></svg></button>` : ''}
          ${opts.sell ? `<button data-duplicate="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800" title="Duplikat">⧉</button>` : ''}
          ${opts.sell ? `<button data-del="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900" title="Hapus"><svg data-icon="trash" class="h-4 w-4 pointer-events-none"></svg></button>` : ''}
          <button data-detail="${c.id}" class="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Detail</button>
        </div>
        ${opts.sell ? offerList(c, true) : ''}
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
    editingId = null;
    $('#form-sell')?.reset();
    const title = $('#sell-modal-title');
    if (title) title.textContent = 'Tambah Listing';
    const sub = $('#sell-modal-sub');
    if (sub) sub.textContent = 'Listing baru masuk sebagai "Menunggu" verifikasi.';
    const btn = $('#sell-submit-btn');
    if (btn) btn.textContent = 'Pasang Listing';
    const msg = $('#sell-msg');
    if (msg) msg.className = 'hidden';
    m.classList.remove('hidden');
    setTimeout(() => $('#sell-title')?.focus(), 50);
  }
  function closeSellModal() {
    $('#modal-sell')?.classList.add('hidden');
    editingId = null;
  }

  // Mode edit: buka modal yang sama dengan data terisi.
  function openEditModal(id) {
    const c = store().get(id);
    if (!c) { toast('Listing tidak ditemukan.'); return; }
    const m = $('#modal-sell');
    if (!m) { toast('Form jual tidak ditemukan.'); return; }
    editingId = id;
    const set = (sel, v) => { const el = $(sel); if (el) el.value = v ?? ''; };
    set('#sell-title', c.title);
    set('#sell-price', c.price);
    set('#sell-year', c.year);
    set('#sell-km', c.km);
    set('#sell-location', c.location === '-' ? '' : c.location);
    set('#sell-category', c.category);
    set('#sell-image', (c.image || '').startsWith('http') && !c.image.includes('wikimedia.org') && !c.image.includes('unsplash.com') ? c.image : '');
    set('#sell-desc', c.description);
    const title = $('#sell-modal-title');
    if (title) title.textContent = 'Edit Listing';
    const sub = $('#sell-modal-sub');
    if (sub) sub.textContent = `Perbarui data "${c.title}".`;
    const btn = $('#sell-submit-btn');
    if (btn) btn.textContent = 'Simpan Perubahan';
    const msg = $('#sell-msg');
    if (msg) msg.className = 'hidden';
    m.classList.remove('hidden');
    setTimeout(() => $('#sell-title')?.focus(), 50);
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
    // Mode edit: perbarui listing yang ada.
    if (editingId) {
      const ok = store().edit(editingId, {
        title,
        price,
        year,
        km: $('#sell-km').value,
        location: $('#sell-location').value.trim() || '-',
        category: $('#sell-category').value,
        image: $('#sell-image').value,
        description: $('#sell-desc').value,
      });
      if (!ok) return show('Gagal menyimpan. Periksa kembali data mobil.');
      editingId = null;
      $('#form-sell').reset();
      closeSellModal();
      if (currentRoute() === 'jual') renderSell();
      if (currentRoute() === 'beli') renderBuy();
      toast('Listing diperbarui.');
      return;
    }
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
  const FILTER_CLS = 'rounded-lg border border-gray-300 dark:border-zinc-700 py-2 pl-3 pr-8 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 focus:border-black dark:focus:border-white outline-none transition appearance-none';

  function fillBuyCats() {
    const sel = $('#buy-cat');
    if (!sel || !store()) return;
    const cats = [...new Set(store().all().map((c) => c.category).filter(Boolean))];
    const cur = buyState.cat;
    sel.innerHTML = '<option value="all">Semua kategori</option>' + cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    sel.value = cats.includes(cur) ? cur : 'all';
    buyState.cat = sel.value;
  }

  function fillBuyLocs() {
    const sel = $('#buy-loc');
    if (!sel || !store()) return;
    const locs = [...new Set(store().all().map((c) => (c.location || '-').trim()).filter(Boolean))].sort();
    const cur = buyState.loc;
    sel.innerHTML = '<option value="all">Semua lokasi</option>' + locs.map((c) => `<option value="${c}">${c}</option>`).join('');
    sel.value = locs.includes(cur) ? cur : 'all';
    buyState.loc = sel.value;
  }

  function fillBuyYears() {
    const sel = $('#buy-year');
    if (!sel || !store()) return;
    const years = [...new Set(store().all().map((c) => Number(c.year)).filter((y) => y > 0))].sort((a, b) => b - a);
    const cur = buyState.year;
    sel.innerHTML = '<option value="all">Semua tahun</option>' + years.map((y) => `<option value="${y}">${y}</option>`).join('');
    sel.value = years.map(String).includes(String(cur)) ? String(cur) : 'all';
    buyState.year = sel.value;
  }

  function num(v) {
    const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function activePricePreset() {
    const min = buyState.min === '' ? '' : Number(buyState.min);
    const max = buyState.max === '' ? '' : Number(buyState.max);
    const hit = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
    return hit ? hit.id : (min === '' && max === '' ? 'all' : 'custom');
  }

  function paintPriceChips() {
    const box = $('#buy-price-chips');
    if (!box) return;
    const active = activePricePreset();
    box.innerHTML = PRICE_PRESETS.map((p) =>
      `<button data-price="${p.id}" class="rounded-full px-3 py-1.5 text-xs font-medium transition border ${active === p.id
        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white'
        : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-zinc-500'}">${p.label}</button>`
    ).join('');
  }

  function applyPricePreset(id) {
    const p = PRICE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    buyState.min = p.min;
    buyState.max = p.max;
    const mn = $('#buy-min'), mx = $('#buy-max');
    if (mn) mn.value = p.min === '' ? '' : p.min;
    if (mx) mx.value = p.max === '' ? '' : p.max;
    safe(renderBuy, 'render-beli-harga')();
  }

  function resetBuyFilters() {
    buyState.q = '';
    buyState.cat = 'all';
    buyState.sort = 'new';
    buyState.min = '';
    buyState.max = '';
    buyState.loc = 'all';
    buyState.year = 'all';
    const set = (id, v) => { const el = $(id); if (el) el.value = v; };
    set('#buy-search', '');
    set('#search', '');
    set('#buy-cat', 'all');
    set('#buy-sort', 'new');
    set('#buy-min', '');
    set('#buy-max', '');
    set('#buy-loc', 'all');
    set('#buy-year', 'all');
    safe(renderBuy, 'render-beli-reset')();
    toast('Filter dikembalikan ke awal.');
  }

  function shortRp(n) {
    const v = Number(n) || 0;
    if (v >= 1e9) return (v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M';
    if (v >= 1e6) return Math.round(v / 1e6) + ' jt';
    if (v >= 1e3) return Math.round(v / 1e3) + ' rb';
    return String(v);
  }

  function renderBuy() {
    if (!store()) return;
    fillBuyCats();
    fillBuyLocs();
    fillBuyYears();
    paintPriceChips();
    let list = store().all().filter((c) => c.status === 'running' || c.status === 'queued');
    const q = buyState.q.trim().toLowerCase();
    if (q) list = list.filter((c) => c.title.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    if (buyState.cat !== 'all') list = list.filter((c) => c.category === buyState.cat);
    if (buyState.loc !== 'all') list = list.filter((c) => (c.location || '-') === buyState.loc);
    if (buyState.year !== 'all') list = list.filter((c) => String(c.year) === String(buyState.year));
    const min = buyState.min === '' ? null : Number(buyState.min);
    const max = buyState.max === '' ? null : Number(buyState.max);
    if (min != null) list = list.filter((c) => Number(c.price) >= min);
    if (max != null) list = list.filter((c) => Number(c.price) <= max);
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

    // Ringkasan filter aktif
    const sum = $('#buy-active');
    if (sum) {
      const parts = [];
      if (buyState.cat !== 'all') parts.push(buyState.cat);
      if (buyState.loc !== 'all') parts.push(buyState.loc);
      if (buyState.year !== 'all') parts.push(String(buyState.year));
      if (min != null || max != null) {
        if (min != null && max != null) parts.push(`Rp ${shortRp(min)}–${shortRp(max)}`);
        else if (min != null) parts.push(`≥ Rp ${shortRp(min)}`);
        else parts.push(`≤ Rp ${shortRp(max)}`);
      }
      if (q) parts.push(`"${buyState.q.trim()}"`);
      sum.textContent = parts.length ? 'Filter: ' + parts.join(' • ') : '';
      sum.classList.toggle('hidden', parts.length === 0);
    }
    const resetBtn = $('#buy-reset');
    if (resetBtn) {
      const dirty = buyState.cat !== 'all' || buyState.loc !== 'all' || buyState.year !== 'all' ||
        buyState.min !== '' || buyState.max !== '' || buyState.q.trim() !== '' || buyState.sort !== 'new';
      resetBtn.classList.toggle('hidden', !dirty);
    }

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
    const clearBtn = $('#fav-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', list.length === 0);
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
          <div class="flex-1"><p class="text-sm text-gray-700 dark:text-zinc-300">${h.text}</p><p class="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">${ago(h.ts)}${h.carId ? ` • <button data-detail="${h.carId}" class="font-semibold underline underline-offset-2 hover:opacity-70">Lihat mobil</button>` : ''}</p></div>
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
    const dn = $('#displayname-input');
    if (dn && document.activeElement !== dn && typeof store().getDisplayName === 'function') {
      dn.value = store().getDisplayName();
    }
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
        ${c.purchase ? `<div class="mt-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-3 text-xs text-gray-600 dark:text-zinc-300">
          <p class="font-bold text-black dark:text-white mb-1">Info pembelian</p>
          ${c.purchase.method === 'kredit'
            ? `<p>DP ${rp(c.purchase.dp)} • ${c.purchase.tenor}× ${rp(c.purchase.installment)}/bln • bunga ${c.purchase.rate}%/thn${c.purchase.name ? ` • ${c.purchase.name}` : ''}</p>`
            : c.purchase.method === 'tawar'
              ? `<p>Dibeli via tawaran yang diterima${c.purchase.name ? ` • ${c.purchase.name}` : ''}</p>`
              : `<p>Tunai${c.purchase.name ? ` • ${c.purchase.name} (${c.purchase.phone || '-'})` : ''}</p>`}
        </div>` : ''}
        <div class="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          <span class="inline-flex items-center gap-1">❤ ${c.interest || 0}% diminati</span><span>•</span><span>Ditambahkan ${ago(c.createdAt)}</span>
        </div>
        <div class="mt-5 flex gap-2">
          ${c.status === 'running' ? `<button data-buy="${c.id}" class="flex-1 rounded-lg bg-black dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-zinc-950 transition hover:bg-gray-800 dark:hover:bg-zinc-200">Beli Sekarang</button>` : ''}
          <button data-fav="${c.id}" class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${on ? 'bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950' : 'border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'}">${on ? '★ Favorit' : '☆ Simpan Favorit'}</button>
        </div>
        ${c.status !== 'done' ? `<button data-offer="${c.id}" class="mt-2 w-full rounded-lg border border-gray-300 dark:border-zinc-700 py-2.5 text-sm font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Ajukan Tawaran</button>` : ''}
        ${c.status === 'queued' ? `<button data-publish="${c.id}" class="mt-2 w-full rounded-lg border border-gray-300 dark:border-zinc-700 py-2.5 text-sm font-semibold text-black dark:text-white transition hover:bg-gray-100 dark:hover:bg-zinc-800">Tayangkan Listing</button>` : ''}
        <div class="mt-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">Penawaran (${store().offersFor(c.id).length})</h4>
          ${offerList(c) || '<p class="text-xs text-gray-500 dark:text-zinc-400">Belum ada tawaran. Jadilah yang pertama!</p>'}
        </div>
      </div>`;
    $('#modal-detail').classList.remove('hidden');
    paint();
  }
  function closeDetail() {
    $('#modal-detail')?.classList.add('hidden');
  }

  // ---------- MODAL TAWAR ----------
  function openOfferModal(id) {
    const c = store().get(id);
    if (!c) { toast('Mobil tidak ditemukan.'); return; }
    if (c.status === 'done') { toast('Mobil ini sudah terjual.'); return; }
    const m = $('#modal-offer');
    if (!m) { toast('Form tawar tidak ditemukan.'); return; }
    $('#offer-car-id').value = id;
    const name = $('#offer-car-name');
    if (name) name.textContent = `${c.title} • ${rp(c.price)}`;
    const amt = $('#offer-amount');
    if (amt) { amt.value = ''; amt.placeholder = `cth: ${Math.round(c.price * 0.95)}`; }
    const note = $('#offer-note');
    if (note) note.value = '';
    const msg = $('#offer-msg');
    if (msg) msg.className = 'hidden';
    closeDetail();
    m.classList.remove('hidden');
    setTimeout(() => amt?.focus(), 50);
  }
  function closeOfferModal() {
    $('#modal-offer')?.classList.add('hidden');
  }

  // ---------- MODAL CHECKOUT ----------
  const checkoutState = { method: 'tunai', tenor: 36 };
  function checkoutCalc(price, dp, tenor, rate) {
    const principal = Math.max(0, price - dp);
    const total = principal * (1 + (rate / 100) * (tenor / 12));
    const monthly = tenor > 0 ? Math.round(total / tenor) : 0;
    return { principal, total: Math.round(total), monthly };
  }
  function paintPayButtons() {
    $$('#checkout-methods [data-pay]').forEach((b) => {
      const on = b.dataset.pay === checkoutState.method;
      b.className = 'rounded-lg border px-4 py-2.5 text-sm font-semibold transition ' + (on
        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white'
        : 'border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800');
    });
    $$('#checkout-tenors [data-tenor]').forEach((b) => {
      const on = Number(b.dataset.tenor) === checkoutState.tenor;
      b.className = 'rounded-full px-4 py-1.5 text-xs font-medium transition border ' + (on
        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white'
        : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white');
    });
    const credit = $('#checkout-credit');
    if (credit) credit.classList.toggle('hidden', checkoutState.method !== 'kredit');
  }
  function paintCheckoutSim() {
    const id = $('#checkout-car-id')?.value;
    const c = id ? store().get(id) : null;
    const price = c ? Number(c.price) : 0;
    const dp = Math.max(0, Number($('#checkout-dp')?.value) || 0);
    const rate = Math.max(0, Number($('#checkout-rate')?.value) || 0);
    const tenor = checkoutState.tenor;
    const box = $('#checkout-sim-detail');
    const inst = $('#checkout-installment');
    const sum = $('#checkout-summary');
    if (checkoutState.method === 'kredit') {
      const r = checkoutCalc(price, dp, tenor, rate);
      if (inst) inst.textContent = rp(r.monthly);
      if (box) box.textContent = `Pinjaman ${rp(r.principal)} • tenor ${tenor} bln • bunga ${rate}%/thn • total bayar ${rp(r.total + dp)}`;
      if (sum) sum.innerHTML = `<b class="text-black dark:text-white">${c ? c.title : ''}</b> — harga ${rp(price)}, DP ${rp(dp)}, sisa ${rp(r.principal)}, cicilan <b class="text-black dark:text-white">${rp(r.monthly)}/bln</b> × ${tenor} bln.`;
      return r;
    }
    if (inst) inst.textContent = rp(0);
    if (box) box.textContent = '';
    if (sum) sum.innerHTML = `<b class="text-black dark:text-white">${c ? c.title : ''}</b> — bayar tunai penuh <b class="text-black dark:text-white">${rp(price)}</b>. Serah terima setelah pembayaran terverifikasi.`;
    return null;
  }
  function openCheckoutModal(id) {
    const c = store().get(id);
    if (!c) { toast('Mobil tidak ditemukan.'); return; }
    if (c.status !== 'running') { toast('Mobil ini tidak tersedia untuk dibeli.'); return; }
    const m = $('#modal-checkout');
    if (!m) { toast('Form checkout tidak ditemukan.'); return; }
    $('#checkout-car-id').value = id;
    checkoutState.method = 'tunai';
    checkoutState.tenor = 36;
    const name = $('#checkout-car-name');
    if (name) name.textContent = `${c.title} • ${rp(c.price)}`;
    const nm = $('#checkout-name');
    if (nm) nm.value = '';
    const ph = $('#checkout-phone');
    if (ph) ph.value = '';
    const dp = $('#checkout-dp');
    if (dp) dp.value = Math.round(c.price * 0.2);
    const msg = $('#checkout-msg');
    if (msg) msg.className = 'hidden';
    closeDetail();
    paintPayButtons();
    paintCheckoutSim();
    m.classList.remove('hidden');
    setTimeout(() => nm?.focus(), 50);
  }
  function closeCheckoutModal() {
    $('#modal-checkout')?.classList.add('hidden');
  }
  function submitCheckout(e) {
    e.preventDefault();
    const id = $('#checkout-car-id')?.value;
    const c = id ? store().get(id) : null;
    const msg = $('#checkout-msg');
    const show = (t) => {
      if (!msg) return;
      msg.textContent = t;
      msg.className = 'rounded-lg p-3 text-sm font-medium border mb-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
    };
    if (!c) return show('Mobil tidak valid.');
    const name = ($('#checkout-name')?.value || '').trim();
    const phone = ($('#checkout-phone')?.value || '').trim();
    if (name.length < 3) return show('Isi nama pembeli (min. 3 karakter).');
    if (phone.replace(/\D/g, '').length < 9) return show('Isi nomor HP yang valid (min. 9 digit).');
    let payload = { method: 'tunai', name, phone };
    if (checkoutState.method === 'kredit') {
      const price = Number(c.price);
      const dp = Math.max(0, Number($('#checkout-dp')?.value) || 0);
      const rate = Math.max(0, Number($('#checkout-rate')?.value) || 0);
      const tenor = checkoutState.tenor;
      if (dp < price * 0.1) return show(`DP minimal 10% (${rp(Math.round(price * 0.1))}).`);
      if (dp >= price) return show('DP harus lebih kecil dari harga mobil.');
      const r = checkoutCalc(price, dp, tenor, rate);
      payload = { method: 'kredit', name, phone, dp, tenor, rate, installment: r.monthly };
    }
    const ok = store().buy(id, payload);
    if (!ok) return show('Gagal memproses pembelian.');
    $('#form-checkout')?.reset();
    closeCheckoutModal();
    if (!$('#modal-detail')?.classList.contains('hidden')) closeDetail();
    const r = currentRoute();
    if (r === 'beli') renderBuy();
    if (r === 'favorit') renderFav();
    if (r === 'jual') renderSell();
    toast(payload.method === 'kredit'
      ? `Pembelian kredit berhasil! Cicilan ${rp(payload.installment)}/bln × ${payload.tenor} bln.`
      : 'Pembelian tunai berhasil! Cek menu Riwayat.');
  }
  function submitOffer(e) {
    e.preventDefault();
    const id = $('#offer-car-id')?.value;
    const amount = Number($('#offer-amount')?.value);
    const note = $('#offer-note')?.value || '';
    const msg = $('#offer-msg');
    const show = (t) => {
      if (!msg) return;
      msg.textContent = t;
      msg.className = 'rounded-lg p-3 text-sm font-medium border mb-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
    };
    if (!id) return show('Mobil tidak valid.');
    if (!amount || amount < 1000000) return show('Tawaran minimal Rp 1.000.000.');
    const ok = store().makeOffer(id, amount, note);
    if (!ok) return show('Gagal mengirim tawaran.');
    $('#form-offer')?.reset();
    closeOfferModal();
    const r = currentRoute();
    if (r === 'beli') renderBuy();
    if (r === 'jual') renderSell();
    if (r === 'favorit') renderFav();
    toast(`Tawaran ${rp(amount)} terkirim.`);
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
      e.stopPropagation();
      safe(() => openCheckoutModal(buy.dataset.buy), 'open-checkout')();
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
    // Tombol Tawar di kartu & modal detail.
    const offer = e.target.closest('[data-offer]');
    if (offer) {
      e.stopPropagation();
      safe(() => openOfferModal(offer.dataset.offer), 'open-offer')();
      return;
    }
    // Tombol Edit di halaman Jual.
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      e.stopPropagation();
      safe(() => openEditModal(editBtn.dataset.edit), 'open-edit')();
      return;
    }
    // Tombol Duplikat di halaman Jual.
    const dupBtn = e.target.closest('[data-duplicate]');
    if (dupBtn) {
      e.stopPropagation();
      const copy = store().duplicate(dupBtn.dataset.duplicate);
      if (copy) {
        toast(`"${copy.title}" diduplikat, menunggu verifikasi.`);
        sellState.filter = 'all';
        if (currentRoute() === 'jual') renderSell();
      } else {
        toast('Gagal menduplikat listing.');
      }
      return;
    }
    // Hapus semua favorit.
    if (e.target.closest('#fav-clear')) {
      if (!store().favorites().length) return;
      if (!confirm('Hapus semua favorit?')) return;
      const n = store().clearFavs();
      toast(`${n} favorit dihapus.`);
      renderFav();
      return;
    }
    // Unduh riwayat CSV.
    if (e.target.closest('#hist-export')) {
      const csv = store().exportHistoryCSV();
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'riwayat-autobuycars.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Riwayat diunduh sebagai CSV.');
      return;
    }
    // Hapus riwayat.
    if (e.target.closest('#hist-clear')) {
      if (!store().history().length) { toast('Riwayat sudah kosong.'); return; }
      if (!confirm('Hapus seluruh riwayat aktivitas?')) return;
      store().clearHistory();
      toast('Riwayat dihapus.');
      renderHist();
      return;
    }
    // Terima / tolak tawaran.
    const acc = e.target.closest('[data-accept]');
    if (acc) {
      e.stopPropagation();
      const [cid, oid] = (acc.dataset.accept || '').split(':');
      const done = store().decideOffer(cid, oid, true);
      if (done) toast('Tawaran diterima — mobil ditandai terjual.');
      else toast('Gagal memproses tawaran.');
      const r = currentRoute();
      if (r === 'jual') renderSell();
      if (r === 'beli') renderBuy();
      if (!$('#modal-detail')?.classList.contains('hidden')) openDetail(cid);
      return;
    }
    const rej = e.target.closest('[data-reject]');
    if (rej) {
      e.stopPropagation();
      const [cid, oid] = (rej.dataset.reject || '').split(':');
      const done = store().decideOffer(cid, oid, false);
      if (done) toast('Tawaran ditolak.');
      else toast('Gagal memproses tawaran.');
      const r = currentRoute();
      if (r === 'jual') renderSell();
      if (r === 'beli') renderBuy();
      if (!$('#modal-detail')?.classList.contains('hidden')) openDetail(cid);
      return;
    }
    // Link "Lihat mobil →" dari aktivitas/notifikasi: buka detail mobil terkait.
    const goto = e.target.closest('[data-goto-car]');
    if (goto) {
      e.preventDefault();
      const id = goto.dataset.gotoCar;
      if (store().get(id)) {
        if (currentRoute() !== 'beli' && currentRoute() !== 'jual' && currentRoute() !== 'favorit') {
          location.hash = '#/beli';
        }
        setTimeout(() => safe(openDetail, 'open-detail-goto')(id), 60);
      } else {
        toast('Mobil terkait sudah tidak tersedia.');
      }
      return;
    }
    const det = e.target.closest('[data-detail]');
    if (det) {
      openDetail(det.dataset.detail);
      return;
    }
    if (e.target.closest('[data-close-detail]')) { closeDetail(); return; }
    if (e.target.closest('[data-close-offer]')) { closeOfferModal(); return; }
    if (e.target.closest('[data-close-checkout]')) { closeCheckoutModal(); return; }
    if (e.target.closest('[data-close-sell]')) { closeSellModal(); return; }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDetail(); closeSellModal(); closeOfferModal(); closeCheckoutModal(); }
  });

  // Listener tombol jual dipasang via delegasi klik global juga,
  // agar tetap jalan walau bind() gagal sebagian (mis. Supabase diblokir).
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-car')) {
      safe(openSellModal, 'open-sell-modal')();
      return;
    }
    // Chip preset harga di halaman Beli (dirender ulang tiap renderBuy).
    const chip = e.target.closest('[data-price]');
    if (chip) {
      safe(() => applyPricePreset(chip.dataset.price), 'apply-harga')();
      return;
    }
  });

  // ---------- Panduan jual cepat (ganti tombol mati) ----------
  function bindGuide() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-guide]')) {
        toast('Panduan: foto asli + deskripsi jujur + balas tawaran < 24 jam.');
        if (window.CarStore) window.CarStore.log('verifikasi', 'Panduan <b>Tips Jual Cepat</b> dibaca');
        return;
      }
      if (e.target.closest('[data-guide-contact]')) {
        toast('Butuh bantuan? Hubungi tim via menu Pengaturan → Reset Data untuk demo.');
        return;
      }
    });
  }
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
      $('#form-offer')?.addEventListener('submit', submitOffer);
    } catch (err) { console.error('[marketplace] bind form-offer gagal:', err); }
    try {
      $('#form-checkout')?.addEventListener('submit', submitCheckout);
    } catch (err) { console.error('[marketplace] bind form-checkout gagal:', err); }
    // Metode bayar + tenor + input simulasi di modal checkout (dirender sekali, tetap di DOM).
    try {
      $$('#checkout-methods [data-pay]').forEach((b) =>
        b.addEventListener('click', () => {
          checkoutState.method = b.dataset.pay;
          paintPayButtons();
          paintCheckoutSim();
        }));
      $$('#checkout-tenors [data-tenor]').forEach((b) =>
        b.addEventListener('click', () => {
          checkoutState.tenor = Number(b.dataset.tenor);
          paintPayButtons();
          paintCheckoutSim();
        }));
      let simT = null;
      const onSim = () => {
        clearTimeout(simT);
        simT = setTimeout(() => safe(paintCheckoutSim, 'sim-cicilan')(), 250);
      };
      $('#checkout-dp')?.addEventListener('input', onSim);
      $('#checkout-rate')?.addEventListener('input', onSim);
    } catch (err) { console.error('[marketplace] bind checkout gagal:', err); }

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
      // Harga min/maks manual (debounce agar tidak render tiap ketikan).
      let priceT = null;
      const onPrice = () => {
        clearTimeout(priceT);
        priceT = setTimeout(() => {
          buyState.min = $('#buy-min')?.value ? Number($('#buy-min').value) : '';
          buyState.max = $('#buy-max')?.value ? Number($('#buy-max').value) : '';
          safe(renderBuy, 'render-beli-harga-manual')();
        }, 350);
      };
      $('#buy-min')?.addEventListener('input', onPrice);
      $('#buy-max')?.addEventListener('input', onPrice);
    } catch (err) { console.error('[marketplace] bind buy-price gagal:', err); }
    try {
      $('#buy-loc')?.addEventListener('change', (e) => { buyState.loc = e.target.value; safe(renderBuy, 'render-beli-loc')(); });
    } catch (err) { console.error('[marketplace] bind buy-loc gagal:', err); }
    try {
      $('#buy-year')?.addEventListener('change', (e) => { buyState.year = e.target.value; safe(renderBuy, 'render-beli-year')(); });
    } catch (err) { console.error('[marketplace] bind buy-year gagal:', err); }
    try {
      $('#buy-reset')?.addEventListener('click', resetBuyFilters);
    } catch (err) { console.error('[marketplace] bind buy-reset gagal:', err); }

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
      $('#displayname-save')?.addEventListener('click', () => {
        if (!store() || typeof store().setDisplayName !== 'function') { toast('Data belum siap. Muat ulang halaman.'); return; }
        const v = ($('#displayname-input')?.value || '').trim();
        if (v.length < 2) { toast('Nama tampilan minimal 2 karakter.'); return; }
        store().setDisplayName(v);
        toast(`Nama tampilan disimpan: ${v}.`);
      });
      $('#displayname-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); $('#displayname-save')?.click(); }
      });
    } catch (err) { console.error('[marketplace] bind displayname gagal:', err); }

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
        window.dispatchEvent(new CustomEvent('marketplace:resetbuy'));
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
    // Reset filter Beli saat data di-reset dari Pengaturan.
    window.addEventListener('marketplace:resetbuy', () => {
      try {
        buyState.q = ''; buyState.cat = 'all'; buyState.sort = 'new';
        buyState.min = ''; buyState.max = ''; buyState.loc = 'all'; buyState.year = 'all';
      } catch { /* abaikan */ }
    });

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
    try { bindGuide(); } catch (err) { console.error('[marketplace] bindGuide gagal:', err); }
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
