// Widget dashboard (data dari CarStore). Grafik digambar dengan SVG murni.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt = (n, d = 0) =>
    n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const store = () => window.CarStore;
  const rp = (n) => (window.fmtRp ? window.fmtRp(n) : 'Rp ' + Number(n || 0).toLocaleString('id-ID'));
  const ago = (ts) => (window.timeAgo ? window.timeAgo(ts) : '');

  // ---------- Ikon ----------
  const ICONS = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    database: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    cpu: 'M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 7h10v10H7V7z',
    flask: 'M9 3h6M10 3v6.5L4.5 19a1.5 1.5 0 001.3 2.25h12.4a1.5 1.5 0 001.3-2.25L14 9.5V3M7.5 15h9',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    chevron: 'M19 9l-7 7-7-7',
    trend: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    plus: 'M12 4v16m8-8H4',
    x: 'M6 18L18 6M6 6l12 12',
    tag: 'M7 7h.01M7 3h5.586a1 1 0 01.707.293l7.414 7.414a1 1 0 010 1.414l-5.586 5.586a1 1 0 01-1.414 0L5.293 10.293A1 1 0 015 9.586V4a1 1 0 011-1z',
    cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    history: 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m0-5v5h5',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    edit: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  };

  function paintIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((svg) => {
      const d = ICONS[svg.dataset.icon];
      if (!d) return;
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.8');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
    });
  }

  // ---------- Angka bergerak ----------
  function countUp(el) {
    const target = Number(el.dataset.count);
    const d = Number(el.dataset.decimals) || 0;
    if (reduce) {
      el.textContent = fmt(target, d);
      return;
    }
    const t0 = performance.now();
    const dur = 1000;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)), d);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- KPI (dari CarStore) ----------
  const TONES = {
    ink: { chip: 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950', hex: '#09090b' },
    stone: { chip: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200', hex: '#52525b' },
    gray: { chip: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300', hex: '#a1a1aa' },
    line: { chip: 'bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800', hex: '#d4d4d8' },
  };
  const sparkOf = (v) => {
    const b = Math.max(2, Number(v) || 0);
    return [b - 2, b - 1, b - 1, b, b, b, b].map((x) => Math.max(0, x));
  };

  function renderKpis() {
    const box = $('#kpis');
    if (!box || !store()) return;
    const s = store().stats();
    const revenue = store().totalRevenue();
    const pendingOffers = store().pendingOffersCount();
    const KPIS = [
      { label: 'Total Listing', value: s.total, delta: `${s.active} aktif`, icon: 'database', tone: 'ink', spark: sparkOf(s.total) },
      { label: 'Terjual', value: s.sold, delta: `${s.pending} menunggu`, icon: 'check', tone: 'stone', spark: sparkOf(s.sold) },
      { label: 'Tawaran Masuk', value: pendingOffers, delta: 'menunggu putusan', icon: 'tag', tone: 'gray', spark: sparkOf(pendingOffers) },
      { label: 'Omzet Terjual', value: revenue, money: true, delta: `${s.sold} unit`, icon: 'cart', tone: 'line', spark: sparkOf(s.sold) },
    ];
    box.innerHTML = KPIS.map((k, i) => {
      const t = TONES[k.tone];
      const val = k.money
        ? `<span class="text-2xl" data-count="${k.value}" data-decimals="0">0</span>`
        : `<span data-count="${k.value}" data-decimals="${k.decimals || 0}">0</span>${k.suffix || ''}`;
      return `<div class="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:bg-gray-50 dark:hover:bg-zinc-800/60">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-zinc-400">${k.label}</p>
          <span class="flex h-10 w-10 items-center justify-center rounded-lg ${t.chip}"><svg data-icon="${k.icon}" class="h-5 w-5"></svg></span>
        </div>
        <p class="mt-3 ${k.money ? '' : 'text-3xl'} font-bold tracking-tight text-slate-900 dark:text-zinc-100">${val}${k.money ? '' : ''}</p>
        ${k.money ? `<p class="text-xs text-gray-500 dark:text-zinc-400 mt-1" data-money-label="${k.value}">${rp(k.value)}</p>` : ''}
        <div class="mt-2 flex items-end justify-between gap-2">
          <span class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-zinc-950 dark:bg-white px-2 py-0.5 text-xs font-medium text-white dark:text-zinc-950"><svg data-icon="trend" class="h-3.5 w-3.5"></svg>${k.delta}</span>
          ${sparkline(k.spark, t.hex, i)}
        </div></div>`;
    }).join('');
    paintIcons(box);
    box.querySelectorAll('[data-count]').forEach((el) => {
      if (Number(el.dataset.count) > 100000) {
        // Nilai rupiah: tampil ringkas agar tidak overflow
        const v = Number(el.dataset.count);
        el.textContent = v >= 1e9 ? (v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M' : fmt(v);
        const lbl = el.closest('div')?.parentElement?.querySelector('[data-money-label]');
        return;
      }
      countUp(el);
    });
  }

  function sparkline(values, hex, id) {
    const w = 120, h = 36, p = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const pts = values.map((v, i) => [
      p + (i * (w - 2 * p)) / (values.length - 1),
      h - p - ((v - min) / (max - min || 1)) * (h - 2 * p),
    ]);
    const line = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" class="h-9 w-28" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="sg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hex}" stop-opacity=".25"/><stop offset="1" stop-color="${hex}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#sg${id})"/>
      <path d="${line}" fill="none" stroke="${hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // ---------- Grafik garis: pakai data nyata CarStore ----------
  // Sumbu kiri = unit terjual kumulatif, sumbu kanan = minat rata-rata (%).
  // Bila belum ada penjualan, tampil data jujur (flat 0) + pesan kosong.
  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  function bucketize(events, n, spanMs, labels) {
    const counts = new Array(n).fill(0);
    const end = Date.now();
    const start = end - spanMs;
    events.forEach((ts) => {
      if (ts < start || ts > end) return;
      const i = Math.min(n - 1, Math.floor(((ts - start) / spanMs) * n));
      counts[i] += 1;
    });
    const cum = [];
    let acc = 0;
    counts.forEach((c) => { acc += c; cum.push(acc); });
    return { cum, labels };
  }
  function labelsFor(range, n) {
    if (range === '7H') return DAYS.slice(-n);
    if (range === '30H') {
      const out = [];
      for (let i = 0; i < n; i++) out.push(`H${Math.round(((i + 1) * 30) / n)}`);
      return out;
    }
    const out = [];
    for (let i = 0; i < n; i++) out.push(`M${i + 1}`);
    return out;
  }
  function avgInterest() {
    if (!store()) return 0;
    const all = store().all();
    if (!all.length) return 0;
    return all.reduce((a, c) => a + (Number(c.interest) || 0), 0) / all.length;
  }
  function series(range) {
    const conf = { '7H': { n: 7, span: 7 * 864e5 }, '30H': { n: 10, span: 30 * 864e5 }, '90H': { n: 12, span: 90 * 864e5 } }[range] || { n: 7, span: 7 * 864e5 };
    const sold = store() ? store().soldEvents() : [];
    const { cum, labels } = bucketize(sold, conf.n, conf.span, labelsFor(range, conf.n));
    const total = cum.length ? cum[cum.length - 1] : 0;
    const scale = Math.max(1, total);
    const acc = cum.map((v) => +(total === 0 ? 0 : (v / scale) * 100).toFixed(1));
    const base = avgInterest();
    const loss = labels.map((_, i) => +(base * (1 - (i / Math.max(1, labels.length - 1)) * 0.08)).toFixed(2));
    return { acc, loss, labels, n: labels.length, soldTotal: total };
  }

  const W = 640, H = 280, PL = 44, PR = 44, PT = 16, PB = 32;
  const smooth = (pts) =>
    pts.map((p, i) => {
      if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      const q = pts[i - 1], mx = ((q[0] + p[0]) / 2).toFixed(1);
      return `C${mx} ${q[1].toFixed(1)} ${mx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[0].toFixed(1)}`;
    }).join(' ');

  let currentRangeState = '7H';

  function renderLine(range = currentRangeState) {
    currentRangeState = range;
    const isDark = document.documentElement.classList.contains('dark');
    const strokeGrid = isDark ? '#27272a' : '#e5e7eb';
    const textFill = isDark ? '#a1a1aa' : '#6b7280';
    const ink = isDark ? '#fafafa' : '#09090b';
    const soft = isDark ? '#71717a' : '#a1a1aa';

    const s = series(range);
    const x = (i) => PL + (i * (W - PL - PR)) / (s.n - 1);
    const yAcc = (v) => PT + ((100 - v) / 50) * (H - PT - PB);
    const yLoss = (v) => PT + (1 - v) * (H - PT - PB);
    const accPts = s.acc.map((v, i) => [x(i), yAcc(v)]);
    const lossPts = s.loss.map((v, i) => [x(i), yLoss(v)]);
    const accPath = smooth(accPts);
    const area = `${accPath} L${x(s.n - 1)} ${H - PB} L${x(0)} ${H - PB} Z`;

    let grid = '';
    for (let i = 0; i < 5; i++) {
      const y = PT + (i * (H - PT - PB)) / 4;
      grid += `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}" stroke="${strokeGrid}" stroke-dasharray="4 4"/>
        <text x="${PL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${textFill}">${100 - i * 12.5}%</text>
        <text x="${W - PR + 8}" y="${y + 4}" font-size="11" fill="${textFill}">${(1 - i * 0.25).toFixed(2)}</text>`;
    }
    const xl = s.labels.map((l, i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="${textFill}">${l}</text>`).join('');

    const box = $('#line-chart');
    if (!box) return;
    // Data belum ada: tampil jujur, jangan grafik palsu.
    if (!s.soldTotal) {
      box.innerHTML = `<div class="flex h-72 flex-col items-center justify-center gap-2 text-center">
        <p class="text-sm font-semibold text-gray-700 dark:text-zinc-200">Belum ada penjualan tercatat</p>
        <p class="text-xs text-gray-500 dark:text-zinc-400 max-w-xs">Grafik terisi otomatis setelah ada mobil terjual (Beli / Terima tawaran / Tandai Terjual).</p>
        <a href="#/beli" class="mt-2 rounded-lg bg-zinc-950 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-950">Lihat Mobil Dijual</a>
      </div>`;
      return;
    }
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="h-auto w-full touch-pan-y" role="img" aria-label="Grafik penjualan dan minat">
      <defs><linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ink}" stop-opacity=".14"/><stop offset="1" stop-color="${ink}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${xl}
      <path id="acc-area" d="${area}" fill="url(#accFill)" style="opacity:0;transition:opacity .8s ease .3s"/>
      <path class="draw" pathLength="1" d="${accPath}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <path class="draw" pathLength="1" d="${smooth(lossPts)}" fill="none" stroke="${soft}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 5"/>
      <line id="xh" y1="${PT}" y2="${H - PB}" stroke="${textFill}" stroke-dasharray="3 3" style="display:none"/>
      <circle id="dot-acc" r="5" fill="${isDark ? '#09090b' : '#fff'}" stroke="${ink}" stroke-width="3" style="display:none"/>
      <circle id="dot-loss" r="5" fill="${isDark ? '#09090b' : '#fff'}" stroke="${soft}" stroke-width="3" style="display:none"/>
      <rect id="hit" x="${PL}" y="${PT}" width="${W - PL - PR}" height="${H - PT - PB}" fill="transparent"/>
    </svg>
    <div id="tip" class="pointer-events-none absolute z-10 hidden rounded-lg bg-zinc-950 dark:bg-white dark:border dark:border-zinc-200 px-3 py-2 text-xs text-white dark:text-zinc-950 shadow-lg" style="transform:translate(-50%,-120%)"></div>`;

    const svg = $('svg', box);
    const tip = $('#tip', box);
    const hit = $('#hit', box);
    const xh = $('#xh', box), da = $('#dot-acc', box), dl = $('#dot-loss', box);

    const leave = () => {
      tip.classList.add('hidden');
      [xh, da, dl].forEach((e) => (e.style.display = 'none'));
    };
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(s.n - 1, Math.round((px - PL) / ((W - PL - PR) / (s.n - 1)))));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i));
      da.setAttribute('cx', x(i)); da.setAttribute('cy', yAcc(s.acc[i]));
      dl.setAttribute('cx', x(i)); dl.setAttribute('cy', yLoss(s.loss[i]));
      [xh, da, dl].forEach((el) => (el.style.display = ''));
      tip.innerHTML = `<p class="mb-1 font-semibold">${s.labels[i]}</p>
        <p class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-current opacity-90"></span>Terjual ${s.acc[i]}% dari total (${s.soldTotal} unit)</p>
        <p class="flex items-center gap-1.5 opacity-70"><span class="h-2 w-2 rounded-full bg-current opacity-60"></span>Minat ${fmt(s.loss[i], 1)}%</p>`;
      tip.classList.remove('hidden');
      const left = Math.max(60, Math.min(r.width - 60, (x(i) / W) * r.width));
      tip.style.left = `${left}px`;
      tip.style.top = `${(yAcc(s.acc[i]) / H) * r.height}px`;
    });
    hit.addEventListener('pointerleave', leave);

    // Animasi menggambar garis
    const lines = box.querySelectorAll('.draw');
    const area$ = $('#acc-area', box);
    if (reduce) {
      if (area$) area$.style.opacity = 1;
      return;
    }
    lines.forEach((p) => { p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      lines.forEach((p) => { p.style.transition = 'stroke-dashoffset 1.1s ease-out'; p.style.strokeDashoffset = '0'; });
      if (area$) area$.style.opacity = 1;
    }));
  }

  function initRangeTabs() {
    const tabs = document.querySelectorAll('#range-tabs [data-range]');
    if (!tabs.length) return;
    const set = (range) => {
      tabs.forEach((b) => {
        const on = b.dataset.range === range;
        b.setAttribute('aria-pressed', on);
        b.className = 'rounded-md px-4 py-1.5 text-xs font-medium transition ' +
          (on ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-sm border border-gray-200 dark:border-zinc-700' : 'text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white');
      });
      renderLine(range);
    };
    tabs.forEach((b) => b.addEventListener('click', () => set(b.dataset.range)));
    set('30H');
  }

  // ---------- Donut (dari CarStore) ----------
  const MONO = ['#09090b', '#52525b', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#71717a'];

  function renderDonut() {
    const donutBox = $('#donut');
    if (!donutBox || !store()) return;
    const isDark = document.documentElement.classList.contains('dark');
    const ringBg = isDark ? '#27272a' : '#e5e7eb';
    const dist = store().categoryDist();
    const total = store().stats().total;

    let acc = 0;
    const circles = dist.map((d, i) => {
      const offset = 25 - acc;
      acc += d.pct;
      return `<circle class="seg" data-pct="${d.pct}" cx="21" cy="21" r="15.915" fill="none" stroke="${MONO[i % MONO.length]}" stroke-width="5" stroke-dasharray="0 100" stroke-dashoffset="${offset}" style="transition:stroke-dasharray .9s ease-out"/>`;
    }).join('');

    donutBox.innerHTML = `
      <div class="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 42 42" class="h-full w-full" role="img" aria-label="Distribusi kategori mobil">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="${ringBg}" stroke-width="5"/>${circles}
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-gray-900 dark:text-zinc-100">${total}</span>
          <span class="text-xs text-gray-500 dark:text-zinc-400">mobil</span>
        </div>
      </div>
      <ul class="mt-5 space-y-2.5 text-sm">${dist.map((d, i) => `
        <li class="flex items-center justify-between"><span class="flex items-center gap-2 text-gray-600 dark:text-zinc-300"><span class="h-2.5 w-2.5 rounded-full" style="background:${MONO[i % MONO.length]}"></span>${d.label}</span><span class="font-semibold text-gray-900 dark:text-zinc-100">${d.pct}%</span></li>`).join('')}
      </ul>`;
    const segs = donutBox.querySelectorAll('.seg');
    const go = () => segs.forEach((c) => { const p = Number(c.dataset.pct); c.style.strokeDasharray = `${Math.max(p - 1, 0)} ${101 - p}`; });
    if (reduce) go(); else requestAnimationFrame(() => requestAnimationFrame(go));
  }

  // ---------- Bar pengunjung: dari minat + riwayat nyata ----------
  function visitorWeek() {
    // Skala 0–10 dari minat rata-rata + aktivitas 7 hari terakhir.
    const cars = store() ? store().all() : [];
    const avg = cars.length ? cars.reduce((a, c) => a + (Number(c.interest) || 0), 0) / cars.length : 0;
    const weekAgo = Date.now() - 7 * 864e5;
    const hist = store() ? store().history().filter((h) => h.ts >= weekAgo) : [];
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const out = days.map((d) => [d, 0]);
    hist.forEach((h) => {
      const i = new Date(h.ts).getDay();
      out[i][1] += 1;
    });
    return out.map(([d, n]) => [d, +Math.min(10, (avg / 12) + n * 0.8 + 0.4).toFixed(1)]);
  }

  function renderBars() {
    const HOURS = visitorWeek().map(([d, v]) => [d === 'Min' ? 'Min' : d, v]);
    // Urut Sen..Min agar konsisten dengan label.
    const order = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    HOURS.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    const max = Math.max(...HOURS.map((h) => h[1]), 1);
    const totalEl = $('#hours-total');
    const totalOffers = store() ? store().pendingOffersCount() : 0;
    if (totalEl) totalEl.textContent = fmt(HOURS.reduce((a, h) => a + h[1], 0), 1);
    const total = HOURS.reduce((a, h) => a + h[1], 0);
    const best = HOURS.reduce((a, h) => (h[1] > a[1] ? h : a));
    const statsEl = $('#hours-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div><p class="text-xs text-gray-400 dark:text-zinc-500">Tawaran menunggu</p><p class="font-semibold text-white dark:text-zinc-950">${totalOffers} tawaran</p></div>
        <div class="text-right"><p class="text-xs text-gray-400 dark:text-zinc-500">Hari teramai</p><p class="font-semibold text-white dark:text-zinc-950">${best[0]} &middot; ${fmt(best[1], 1)}</p></div>`;
    }
    const barsEl = $('#bars');
    if (!barsEl) return;
    barsEl.innerHTML = `<div class="flex h-full min-h-[11rem] items-end gap-2 sm:gap-3">${HOURS.map(([day, v]) => `
      <div class="group flex h-full flex-1 flex-col items-center justify-end">
        <span class="mb-1 text-xs font-semibold text-white dark:text-zinc-950 opacity-0 transition group-hover:opacity-100">${fmt(v, 1)}j</span>
        <div class="bar w-full rounded-t-md transition-colors duration-200 ${v === max ? 'bg-white dark:bg-zinc-950' : 'bg-white/40 dark:bg-zinc-950/30 group-hover:bg-white/70 dark:group-hover:bg-zinc-950/60'}" data-px="${Math.round((v / max) * 150)}" style="height:${reduce ? Math.round((v / max) * 150) : 0}px;transition:height .8s cubic-bezier(.2,.8,.2,1),background-color .2s" title="${day}: ${fmt(v, 1)} jam"></div>
        <span class="mt-2 text-xs text-gray-400 dark:text-zinc-500">${day}</span>
      </div>`).join('')}</div>`;
    if (reduce) return;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('#bars .bar').forEach((b, i) => setTimeout(() => (b.style.height = `${b.dataset.px}px`), i * 70))));
  }

  // ---------- Tabel inventaris (dari CarStore) ----------
  const STATUS = {
    done: { label: 'Terjual', cls: 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 ring-zinc-950/20 dark:ring-white/20' },
    running: { label: 'Dijual', cls: 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white ring-zinc-950/20 dark:ring-white/20 border border-gray-200 dark:border-zinc-700' },
    queued: { label: 'Menunggu', cls: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 ring-gray-500/20' },
    failed: { label: 'Ditolak', cls: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 ring-red-600/20 dark:ring-red-400/20' },
  };
  const state = { q: '', status: 'all' };

  function renderTable() {
    const tableBody = $('#table-body');
    if (!tableBody || !store()) return;
    const q = state.q.trim().toLowerCase();
    const all = store().all();
    const rows = all.filter((c) =>
      (state.status === 'all' || c.status === state.status) &&
      (!q || c.title.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)));

    tableBody.innerHTML = rows.map((c) => {
      const st = STATUS[c.status] || STATUS.queued;
      return `<tr class="transition hover:bg-gray-50 dark:hover:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-800 cursor-pointer" data-detail="${c.id}">
        <td class="py-3 px-6"><p class="font-medium text-black dark:text-white">${c.title}</p><p class="text-xs text-gray-500 dark:text-zinc-400">${c.year} • ${Number(c.km || 0).toLocaleString('id-ID')} km • ${c.location}</p></td>
        <td class="py-3 px-6 font-semibold text-black dark:text-white">${rp(c.price)}</td>
        <td class="py-3 px-6"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${st.cls}">${st.label}</span></td>
        <td class="py-3 px-6 text-gray-500 dark:text-zinc-400">${ago(c.createdAt)}</td></tr>`;
    }).join('');

    const emptyEl = $('#table-empty');
    if (emptyEl) emptyEl.classList.toggle('hidden', rows.length > 0);
    const countEl = $('#table-count');
    if (countEl) countEl.textContent = `Menampilkan ${rows.length} dari ${all.length} data`;
  }

  function initTable() {
    const topSearch = $('#search'), tableSearch = $('#table-search'), filter = $('#status-filter');
    const onQuery = (src) => {
      state.q = src.value;
      if (topSearch && topSearch !== src) topSearch.value = src.value;
      if (tableSearch && tableSearch !== src) tableSearch.value = src.value;
      renderTable();
    };
    if (topSearch) topSearch.addEventListener('input', () => onQuery(topSearch));
    if (tableSearch) tableSearch.addEventListener('input', () => onQuery(tableSearch));
    if (filter) filter.addEventListener('change', () => { state.status = filter.value; renderTable(); });
    renderTable();
  }

  // ---------- Mobil Populer (dari CarStore) ----------
  // Foto kecil sesuai merek — URL dari store, fallback ke kategori bila kosong.
  const W200 = (n) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(n)}?width=200`;
  const POP_IMAGES = {
    SUV: W200('2015 Toyota Fortuner (New Zealand).jpg'),
    Sedan: W200('Honda Civic e-HEV Sport (XI) – f 30062024.jpg'),
    MPV: W200('2022 Toyota Avanza 1.5 G Toyota Safety Sense W101RE (20220403).jpg'),
    Hatchback: W200('2014 Daihatsu Ayla 1.0 X B100RS (20190615).jpg'),
    Listrik: W200('Hyundai Ioniq 5 AWD Techniq-Paket – f 31122024.jpg'),
    Lainnya: W200('Honda CR-V e-HEV Elegance AWD (VI) – f 14072024.jpg'),
  };
  function renderCourses() {
    const coursesEl = $('#courses');
    if (!coursesEl || !store()) return;
    const list = store().popular(3);
    coursesEl.innerHTML = list.map((c) => {
      const img = (c.image || '').trim() || POP_IMAGES[c.category] || POP_IMAGES.Lainnya;
      return `
      <div class="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 transition hover:border-gray-300 dark:hover:border-zinc-700 cursor-pointer" data-detail="${c.id}">
        <div class="flex gap-3">
          <img src="${img}" alt="${c.title}" loading="lazy" class="h-16 w-20 shrink-0 rounded-md object-cover bg-gray-100 dark:bg-zinc-800" onerror="this.style.display='none'" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-black dark:text-white leading-snug text-sm truncate">${c.title}</p>
              <span class="shrink-0 rounded-full bg-zinc-950 dark:bg-white px-2 py-0.5 text-[11px] font-medium text-white dark:text-zinc-950">${c.badge || c.category}</span>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">${c.year} • ${Number(c.km || 0).toLocaleString('id-ID')} km • ${c.location}</p>
            <div class="mt-1 text-sm font-bold text-black dark:text-white">${rp(c.price)}</div>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800 mr-3">
            <div class="cbar h-full rounded-full bg-zinc-950 dark:bg-white" data-w="${c.interest || 0}" style="width:${reduce ? (c.interest || 0) : 0}%;transition:width 1s ease-out"></div>
          </div>
          <span class="text-xs font-bold text-gray-700 dark:text-zinc-300">${c.interest || 0}% minat</span>
        </div>
      </div>`; }).join('');
    if (reduce) return;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('#courses .cbar').forEach((b) => (b.style.width = `${b.dataset.w}%`))));
  }

  // ---------- Aktivitas & notifikasi (dari CarStore) ----------
  const TONE_BY_TYPE = {
    beli: 'bg-zinc-950 dark:bg-white',
    jual: 'bg-zinc-500',
    tawar: 'bg-zinc-400',
    favorit: 'bg-zinc-400',
    status: 'bg-zinc-500',
    verifikasi: 'bg-zinc-300 dark:bg-zinc-600',
    batal: 'bg-red-500',
    hapus: 'bg-zinc-300 dark:bg-zinc-600',
  };
  const TITLE_BY_TYPE = {
    beli: 'Pembelian', jual: 'Penjualan', tawar: 'Penawaran', favorit: 'Favorit',
    status: 'Status', verifikasi: 'Verifikasi', batal: 'Pembatalan', hapus: 'Dihapus',
  };

  function renderLists() {
    if (!store()) return;
    const hist = store().history();
    const goCar = (h) => h.carId ? ` <a href="#/beli" data-goto-car="${h.carId}" class="font-semibold underline underline-offset-2 hover:opacity-70">Lihat mobil →</a>` : '';
    const actEl = $('#activity');
    if (actEl) {
      const items = hist.slice(0, 5);
      actEl.innerHTML = items.length ? items.map((a, i) => `
        <li class="relative flex gap-3">
          ${i < items.length - 1 ? '<span class="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-zinc-800"></span>' : ''}
          <span class="relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${TONE_BY_TYPE[a.type] || 'bg-zinc-400'}"></span>
          <div><p class="text-sm text-gray-700 dark:text-zinc-300">${a.text}${goCar(a)}</p><p class="text-xs text-gray-400 dark:text-zinc-500">${ago(a.ts)}</p></div>
        </li>`).join('') : '<li class="text-sm text-gray-500 dark:text-zinc-400">Belum ada aktivitas.</li>';
    }
    const notifEl = $('#notif-list');
    if (notifEl) {
      const items = hist.slice(0, 3);
      notifEl.innerHTML = items.length ? items.map((n) => `
        <li class="px-4 py-3 rounded-lg transition hover:bg-gray-50 dark:hover:bg-zinc-800/60"><p class="text-sm font-medium text-gray-900 dark:text-zinc-100">${TITLE_BY_TYPE[n.type] || 'Info'}</p><p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">${n.text}</p><p class="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">${ago(n.ts)}${goCar(n)}</p></li>`).join('')
        : '<li class="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">Tidak ada notifikasi baru</li>';
      paintNotifDot();
    }
  }

  // Dot notifikasi terintegrasi: sembunyi hanya bila semua sudah dibaca.
  function paintNotifDot() {
    const dot = $('#notif-dot');
    if (!dot || !store()) return;
    const unread = typeof store().unreadCount === 'function'
      ? store().unreadCount()
      : (store().history()[0] && (Date.now() - store().history()[0].ts) < 24 * 3600 * 1000 ? 1 : 0);
    // Badge angka bila > 1 agar informatif.
    if (unread > 1) {
      dot.classList.remove('hidden');
      dot.classList.add('flex');
      dot.style.cssText = 'width:auto;min-width:1.25rem;height:1.25rem;padding:0 .3rem;align-items:center;justify-content:center;font-size:10px;font-weight:700;';
      dot.textContent = unread > 9 ? '9+' : String(unread);
    } else {
      dot.classList.toggle('hidden', unread === 0);
      dot.classList.remove('flex');
      dot.style.cssText = '';
      dot.textContent = '';
    }
  }

  // ---------- Banner & target (dari CarStore) ----------
  function greetingName() {
    // Prioritas: nama tampilan lokal (Pengaturan) > nama Supabase > "User".
    try {
      const local = store()?.getDisplayName?.();
      if (local) return local;
    } catch { /* abaikan */ }
    const el = $('#greeting-name');
    const cur = (el?.textContent || '').trim();
    return cur && cur !== 'User' ? cur : 'User';
  }
  function renderGoal() {
    if (!store()) return;
    const s = store().stats();
    const target = store().getTarget();
    const pct = Math.min(100, Math.round((s.sold / Math.max(1, target)) * 100));
    const bar = $('#goal-bar');
    if (bar) {
      if (reduce) bar.style.width = pct + '%';
      else requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = pct + '%')));
    }
    const pctEl = $('#goal-pct');
    if (pctEl) pctEl.textContent = pct + '%';
    const note = $('#goal-note');
    if (note) {
      const sisa = Math.max(0, target - s.sold);
      note.textContent = sisa === 0 ? 'Target bulan ini tercapai! 🎉' : `${sisa} mobil lagi menuju target bulan ini!`;
    }
    const sub = $('#banner-sub');
    if (sub) sub.textContent = `Anda punya ${s.active} mobil aktif dan ${s.sold} terjual. Temukan penawaran terbaik hari ini untuk mobil idamanmu di AutoBuyCars.`;
    const fav = $('#banner-fav');
    if (fav) fav.textContent = `🚗 ${s.favCount} mobil difavoritkan`;
    // Sapaan banner ikut nama tampilan lokal.
    const gname = $('#greeting-name');
    if (gname) gname.textContent = greetingName();
    const navFav = $('#nav-fav-count');
    if (navFav) {
      navFav.textContent = s.favCount;
      navFav.classList.toggle('hidden', s.favCount === 0);
    }
  }

  function refresh() {
    paintIcons();
    renderKpis();
    renderLine();
    renderDonut();
    renderBars();
    renderTable();
    renderCourses();
    renderLists();
    renderGoal();
  }

  window.Dashboard = {
    paintIcons,
    paintNotifDot,
    render() {
      paintIcons();
      renderKpis();
      initRangeTabs();
      renderDonut();
      renderBars();
      initTable();
      renderCourses();
      renderLists();
      renderGoal();
    },
    refresh,
  };

  // Re-render saat tema berubah atau data toko berubah
  window.addEventListener('themechange', () => {
    renderLine();
    renderDonut();
  });
  window.addEventListener('storechange', () => {
    refresh();
  });

  // Ikon statis (sidebar, topbar) bisa dilukis segera.
  paintIcons();
})();
