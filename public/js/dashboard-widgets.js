// Widget dashboard (data contoh). Semua grafik digambar dengan SVG murni.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt = (n, d = 0) =>
    n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

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

  // ---------- KPI ----------
  const TONES = {
    indigo: { chip: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400', hex: '#6366f1' },
    violet: { chip: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400', hex: '#8b5cf6' },
    emerald: { chip: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400', hex: '#10b981' },
    amber: { chip: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400', hex: '#f59e0b' },
  };
  const KPIS = [
    { label: 'Dataset', value: 12, delta: '+2 baru', icon: 'database', tone: 'indigo', spark: [4, 5, 5, 7, 8, 9, 12] },
    { label: 'Model dilatih', value: 28, delta: '+5 baru', icon: 'cpu', tone: 'violet', spark: [10, 12, 15, 16, 20, 24, 28] },
    { label: 'Akurasi terbaik', value: 94.2, decimals: 1, suffix: '%', delta: '+1,8%', icon: 'check', tone: 'emerald', spark: [82, 85, 88, 90, 91, 93, 94.2] },
    { label: 'Jam belajar', value: 36, suffix: ' jam', delta: '+4 jam', icon: 'clock', tone: 'amber', spark: [18, 22, 25, 28, 30, 33, 36] },
  ];

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

  function renderKpis() {
    $('#kpis').innerHTML = KPIS.map((k, i) => {
      const t = TONES[k.tone];
      return `<div class="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-zinc-400">${k.label}</p>
          <span class="flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}"><svg data-icon="${k.icon}" class="h-5 w-5"></svg></span>
        </div>
        <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100"><span data-count="${k.value}" data-decimals="${k.decimals || 0}">0</span>${k.suffix || ''}</p>
        <div class="mt-2 flex items-end justify-between gap-2">
          <span class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><svg data-icon="trend" class="h-3.5 w-3.5"></svg>${k.delta}</span>
          ${sparkline(k.spark, t.hex, i)}
        </div></div>`;
    }).join('');
    paintIcons($('#kpis'));
    document.querySelectorAll('#kpis [data-count]').forEach(countUp);
  }

  // ---------- Grafik garis ----------
  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  function series(range) {
    const n = { '7H': 7, '30H': 10, '90H': 12 }[range] || 7;
    const acc = [], loss = [], labels = [];
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      acc.push(+Math.min(97, 94.2 - 30 * Math.exp(-3.2 * k) + Math.sin(i * 1.7) * 1.1).toFixed(1));
      loss.push(+(0.12 + 0.85 * Math.exp(-2.8 * k) + Math.cos(i * 1.3) * 0.02).toFixed(2));
      labels.push(range === '7H' ? DAYS[i] : range === '30H' ? `H${Math.round(((i + 1) * 30) / n)}` : `M${i + 1}`);
    }
    acc[n - 1] = 94.2;
    return { acc, loss, labels, n };
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
    const strokeGrid = isDark ? '#27272a' : '#e2e8f0';
    const textFill = isDark ? '#71717a' : '#94a3b8';

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
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="h-auto w-full touch-pan-y" role="img" aria-label="Grafik akurasi dan loss">
      <defs><linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity=".22"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
      ${grid}${xl}
      <path id="acc-area" d="${area}" fill="url(#accFill)" style="opacity:0;transition:opacity .8s ease .3s"/>
      <path class="draw" pathLength="1" d="${accPath}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round"/>
      <path class="draw" pathLength="1" d="${smooth(lossPts)}" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
      <line id="xh" y1="${PT}" y2="${H - PB}" stroke="${textFill}" stroke-dasharray="3 3" style="display:none"/>
      <circle id="dot-acc" r="5" fill="${isDark ? '#18181b' : '#fff'}" stroke="#6366f1" stroke-width="3" style="display:none"/>
      <circle id="dot-loss" r="5" fill="${isDark ? '#18181b' : '#fff'}" stroke="#f43f5e" stroke-width="3" style="display:none"/>
      <rect id="hit" x="${PL}" y="${PT}" width="${W - PL - PR}" height="${H - PT - PB}" fill="transparent"/>
    </svg>
    <div id="tip" class="pointer-events-none absolute z-10 hidden rounded-lg bg-slate-900 dark:bg-zinc-800 dark:border dark:border-zinc-700 px-3 py-2 text-xs text-white shadow-lg" style="transform:translate(-50%,-120%)"></div>`;

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
        <p class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-indigo-400"></span>Akurasi ${fmt(s.acc[i], 1)}%</p>
        <p class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-rose-400"></span>Loss ${fmt(s.loss[i], 2)}</p>`;
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
    const set = (range) => {
      tabs.forEach((b) => {
        const on = b.dataset.range === range;
        b.setAttribute('aria-pressed', on);
        b.className = 'rounded-md px-4 py-1.5 text-xs font-medium transition ' + 
          (on ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-zinc-700' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white');
      });
      renderLine(range);
    };
    tabs.forEach((b) => b.addEventListener('click', () => set(b.dataset.range)));
    set('30H');
  }

  // ---------- Donut ----------
  const DATASETS = [
    { label: 'Tabular', pct: 40, hex: '#6366f1' },
    { label: 'Gambar', pct: 25, hex: '#8b5cf6' },
    { label: 'Teks', pct: 20, hex: '#06b6d4' },
    { label: 'Time series', pct: 15, hex: '#f59e0b' },
  ];

  function renderDonut() {
    const isDark = document.documentElement.classList.contains('dark');
    const ringBg = isDark ? '#27272a' : '#f1f5f9';

    let acc = 0;
    const circles = DATASETS.map((d) => {
      const offset = 25 - acc;
      acc += d.pct;
      return `<circle class="seg" data-pct="${d.pct}" cx="21" cy="21" r="15.915" fill="none" stroke="${d.hex}" stroke-width="5" stroke-dasharray="0 100" stroke-dashoffset="${offset}" style="transition:stroke-dasharray .9s ease-out"/>`;
    }).join('');
    const donutBox = $('#donut');
    if (!donutBox) return;

    donutBox.innerHTML = `
      <div class="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 42 42" class="h-full w-full" role="img" aria-label="Distribusi dataset">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="${ringBg}" stroke-width="5"/>${circles}
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-gray-900 dark:text-zinc-100">12</span>
          <span class="text-xs text-gray-500 dark:text-zinc-400">dataset</span>
        </div>
      </div>
      <ul class="mt-5 space-y-2.5 text-sm">${DATASETS.map((d) => `
        <li class="flex items-center justify-between"><span class="flex items-center gap-2 text-gray-600 dark:text-zinc-300"><span class="h-2.5 w-2.5 rounded-full" style="background:${d.hex}"></span>${d.label}</span><span class="font-semibold text-gray-900 dark:text-zinc-100">${d.pct}%</span></li>`).join('')}
      </ul>`;
    const segs = document.querySelectorAll('#donut .seg');
    const go = () => segs.forEach((c) => { const p = Number(c.dataset.pct); c.style.strokeDasharray = `${Math.max(p - 1, 0)} ${101 - p}`; });
    if (reduce) go(); else requestAnimationFrame(() => requestAnimationFrame(go));
  }

  // ---------- Bar jam belajar / Pengunjung ----------
  const HOURS = [['Sen', 4.5], ['Sel', 6], ['Rab', 3], ['Kam', 7.5], ['Jum', 5], ['Sab', 8.5], ['Min', 2]];

  function renderBars() {
    const max = Math.max(...HOURS.map((h) => h[1]));
    const totalEl = $('#hours-total');
    if (totalEl) totalEl.textContent = fmt(HOURS.reduce((a, h) => a + h[1], 0), 1);
    const total = HOURS.reduce((a, h) => a + h[1], 0);
    const best = HOURS.reduce((a, h) => (h[1] > a[1] ? h : a));
    const statsEl = $('#hours-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div><p class="text-xs text-gray-400">Rata-rata harian</p><p class="font-semibold text-white">${fmt(total / HOURS.length, 1)} jam</p></div>
        <div><p class="text-xs text-gray-400">Hari terbaik</p><p class="font-semibold text-white">${best[0]} &middot; ${fmt(best[1], 1)} jam</p></div>`;
    }
    const barsEl = $('#bars');
    if (!barsEl) return;
    barsEl.innerHTML = `<div class="flex h-full min-h-[11rem] items-end gap-2 sm:gap-3">${HOURS.map(([day, v]) => `
      <div class="group flex h-full flex-1 flex-col items-center justify-end">
        <span class="mb-1 text-xs font-semibold text-gray-300 opacity-0 transition group-hover:opacity-100">${fmt(v, 1)}j</span>
        <div class="bar w-full rounded-t-lg transition-colors duration-200 ${v === max ? 'bg-gradient-to-t from-indigo-500 to-violet-400' : 'bg-indigo-300/40 group-hover:bg-indigo-400'}" data-px="${Math.round((v / max) * 150)}" style="height:${reduce ? Math.round((v / max) * 150) : 0}px;transition:height .8s cubic-bezier(.2,.8,.2,1),background-color .2s" title="${day}: ${fmt(v, 1)} jam"></div>
        <span class="mt-2 text-xs text-gray-400">${day}</span>
      </div>`).join('')}</div>`;
    if (reduce) return;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('#bars .bar').forEach((b, i) => setTimeout(() => (b.style.height = `${b.dataset.px}px`), i * 70))));
  }

  // ---------- Tabel eksperimen ----------
  const STATUS = {
    done: { label: 'Selesai', cls: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20' },
    running: { label: 'Berjalan', cls: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 ring-amber-600/20' },
    queued: { label: 'Antre', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 ring-slate-500/20' },
    failed: { label: 'Gagal', cls: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 ring-rose-600/20' },
  };
  const EXPERIMENTS = [
    { model: 'Random Forest', dataset: 'Iris', acc: 94.2, status: 'done', time: '2 jam lalu' },
    { model: 'Logistic Regression', dataset: 'Titanic', acc: 81.5, status: 'done', time: '5 jam lalu' },
    { model: 'Neural Network', dataset: 'MNIST', acc: null, status: 'running', time: 'Berjalan 12 mnt' },
    { model: 'K-Means', dataset: 'Mall Customers', acc: null, status: 'queued', time: 'Menunggu' },
    { model: 'Gradient Boosting', dataset: 'House Prices', acc: 89.7, status: 'done', time: 'Kemarin' },
    { model: 'SVM', dataset: 'Titanic', acc: null, status: 'failed', time: '2 hari lalu' },
    { model: 'CNN', dataset: 'CIFAR-10', acc: 87.3, status: 'done', time: '3 hari lalu' },
    { model: 'Naive Bayes', dataset: 'Spam SMS', acc: 96.1, status: 'done', time: '4 hari lalu' },
  ];
  const state = { q: '', status: 'all' };

  function renderTable() {
    const q = state.q.trim().toLowerCase();
    const rows = EXPERIMENTS.filter((e) =>
      (state.status === 'all' || e.status === state.status) &&
      (!q || e.model.toLowerCase().includes(q) || e.dataset.toLowerCase().includes(q)));
    
    const tableBody = $('#table-body');
    if (!tableBody) return;

    tableBody.innerHTML = rows.map((e) => {
      const st = STATUS[e.status];
      const acc = e.acc == null ? '<span class="text-gray-400 dark:text-zinc-600">—</span>'
        : `<div class="flex items-center gap-2"><span class="w-12 font-medium text-gray-900 dark:text-zinc-100">${fmt(e.acc, 1)}%</span><span class="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800 sm:block"><span class="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style="width:${e.acc}%"></span></span></div>`;
      return `<tr class="transition hover:bg-gray-50 dark:hover:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-800">
        <td class="py-3 px-6"><p class="font-medium text-gray-900 dark:text-zinc-100">${e.model}</p><p class="text-xs text-gray-500 dark:text-zinc-400 md:hidden">${e.dataset}</p></td>
        <td class="hidden py-3 px-6 text-gray-600 dark:text-zinc-300 md:table-cell">${e.dataset}</td>
        <td class="py-3 px-6">${acc}</td>
        <td class="py-3 px-6"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${st.cls}">${st.label}</span></td>
        <td class="hidden py-3 px-6 text-gray-500 dark:text-zinc-400 sm:table-cell">${e.time}</td></tr>`;
    }).join('');
    
    const emptyEl = $('#table-empty');
    if (emptyEl) emptyEl.classList.toggle('hidden', rows.length > 0);
    const countEl = $('#table-count');
    if (countEl) countEl.textContent = `Menampilkan ${rows.length} dari ${EXPERIMENTS.length} data`;
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

  // ---------- Kursus / Mobil Populer ----------
  const COURSES = [
    { title: 'Toyota Fortuner 2.8 GR Sport', note: '2024 • 12.000 km • Jakarta', pct: 98, bar: 'from-emerald-500 to-teal-500', badge: 'Populer' },
    { title: 'Honda CR-V 2.0 RS e:HEV', note: '2023 • 8.500 km • Surabaya', pct: 85, bar: 'from-indigo-500 to-blue-500', badge: 'Hot Deal' },
    { title: 'Hyundai Ioniq 5 Signature', note: '2023 • 15.000 km • Bandung', pct: 60, bar: 'from-violet-500 to-fuchsia-500', badge: 'Diskon' },
  ];

  function renderCourses() {
    const coursesEl = $('#courses');
    if (!coursesEl) return;
    coursesEl.innerHTML = COURSES.map((c) => `
      <div class="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm transition hover:border-gray-300 dark:hover:border-zinc-700">
        <div class="flex items-start justify-between gap-2">
          <p class="font-semibold text-gray-900 dark:text-zinc-100 leading-snug text-sm">${c.title}</p>
          <span class="shrink-0 rounded-full bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-zinc-300">${c.badge}</span>
        </div>
        <p class="mt-2 text-xs text-gray-500 dark:text-zinc-400">${c.note}</p>
        <div class="mt-3 flex items-center justify-between">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800 mr-3">
            <div class="cbar h-full rounded-full bg-gradient-to-r ${c.bar}" data-w="${c.pct}" style="width:${reduce ? c.pct : 0}%;transition:width 1s ease-out"></div>
          </div>
          <span class="text-xs font-bold text-gray-700 dark:text-zinc-300">${c.pct}% minat</span>
        </div>
      </div>`).join('');
    if (reduce) return;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('#courses .cbar').forEach((b) => (b.style.width = `${b.dataset.w}%`))));
  }

  // ---------- Aktivitas & notifikasi ----------
  const ACTIVITY = [
    { tone: 'bg-emerald-500', text: 'Mobil <b>Honda Civic RS</b> berhasil terjual', time: '2 jam lalu' },
    { tone: 'bg-indigo-500', text: 'Ada penawaran baru untuk <b>Toyota Fortuner</b>', time: '5 jam lalu' },
    { tone: 'bg-violet-500', text: 'Mobil baru <b>Hyundai Ioniq 5</b> ditambahkan', time: 'Kemarin' },
    { tone: 'bg-amber-500', text: 'Verifikasi dokumen <b>Mitsubishi Pajero</b> sedang diproses', time: 'Kemarin' },
    { tone: 'bg-rose-500', text: 'Penawaran pada <b>BMW 320i</b> dibatalkan oleh pembeli', time: '2 hari lalu' },
  ];
  const NOTIFS = [
    { title: 'Mobil Terjual', body: 'Honda Civic RS telah berhasil diverifikasi dan dibayar', time: '2 jam lalu' },
    { title: 'Penawaran Baru', body: 'Rp 480.000.000 masuk untuk Toyota Fortuner', time: '5 jam lalu' },
    { title: 'Pengingat Target', body: 'Target penjualan bulanan tinggal 4 unit lagi', time: 'Kemarin' },
  ];

  function renderLists() {
    const actEl = $('#activity');
    if (actEl) {
      actEl.innerHTML = ACTIVITY.map((a, i) => `
        <li class="relative flex gap-3">
          ${i < ACTIVITY.length - 1 ? '<span class="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-zinc-800"></span>' : ''}
          <span class="relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${a.tone}"></span>
          <div><p class="text-sm text-gray-700 dark:text-zinc-300">${a.text}</p><p class="text-xs text-gray-400 dark:text-zinc-500">${a.time}</p></div>
        </li>`).join('');
    }
    const notifEl = $('#notif-list');
    if (notifEl) {
      notifEl.innerHTML = NOTIFS.map((n) => `
        <li class="px-4 py-3 rounded-lg transition hover:bg-gray-50 dark:hover:bg-zinc-800/60"><p class="text-sm font-medium text-gray-900 dark:text-zinc-100">${n.title}</p><p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">${n.body}</p><p class="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">${n.time}</p></li>`).join('');
    }
  }

  function renderGoal() {
    const bar = $('#goal-bar');
    if (!bar) return;
    const w = '80%';
    if (reduce) bar.style.width = w;
    else requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = w)));
  }

  window.Dashboard = {
    paintIcons,
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
  };

  // Re-render dynamically when theme changes
  window.addEventListener('themechange', () => {
    if (window.Dashboard && typeof window.Dashboard.render === 'function') {
      renderLine();
      renderDonut();
    }
  });

  // Ikon statis (sidebar, topbar) bisa dilukis segera.
  paintIcons();
})();
