// AutoBuyCars - Toko data terpusat (inventaris, favorit, riwayat).
// Disimpan di localStorage agar langsung jalan tanpa migrasi DB,
// dan disiapkan agar mudah dipindah ke tabel Supabase nanti.
(() => {
  'use strict';

  const LS_CARS = 'abc_cars_v2';
  const LS_FAVS = 'abc_favs_v1';
  const LS_HIST = 'abc_hist_v1';
  const LS_SET = 'abc_settings_v1';

  const now = Date.now();
  const H = 3600 * 1000;

  // Foto asli per merek (Wikimedia Commons, diverifikasi 200).
  const W = (n) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(n)}?width=800`;
  const BRAND_IMAGES = {
    fortuner: W('2015 Toyota Fortuner (New Zealand).jpg'),
    crv: W('Honda CR-V e-HEV Elegance AWD (VI) – f 14072024.jpg'),
    ioniq5: W('Hyundai Ioniq 5 AWD Techniq-Paket – f 31122024.jpg'),
    civic: W('Honda Civic e-HEV Sport (XI) – f 30062024.jpg'),
    pajero: W('Mitsubishi Pajero Sport (3rd generation) 1X7A0409.jpg'),
    bmw: W('2019 BMW 318d SE Automatic 2.0 Front.jpg'),
    avanza: W('2022 Toyota Avanza 1.5 G Toyota Safety Sense W101RE (20220403).jpg'),
    ayla: W('2014 Daihatsu Ayla 1.0 X B100RS (20190615).jpg'),
  };

  // Foto bawaan per kategori (Unsplash) — hanya fallback untuk listing baru tanpa URL foto.
  const CATEGORY_IMAGES = {
    SUV: BRAND_IMAGES.fortuner,
    Sedan: BRAND_IMAGES.civic,
    MPV: BRAND_IMAGES.avanza,
    Hatchback: BRAND_IMAGES.ayla,
    Listrik: BRAND_IMAGES.ioniq5,
    Lainnya: BRAND_IMAGES.crv,
  };

  function imageFor(category, explicit) {
    const url = (explicit || '').trim();
    if (url) return url;
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Lainnya;
  }

  const SEED_CARS = [
    { id: 'c-fortuner', title: 'Toyota Fortuner 2.8 GR Sport', price: 485000000, year: 2024, km: 12000, location: 'Jakarta', category: 'SUV', status: 'running', interest: 98, badge: 'Populer', image: BRAND_IMAGES.fortuner, description: 'Kondisi mulus, servis rutin Toyota, pajak panjang.', createdAt: now - 2 * H },
    { id: 'c-crv', title: 'Honda CR-V 2.0 RS e:HEV', price: 519000000, year: 2023, km: 8500, location: 'Surabaya', category: 'SUV', status: 'running', interest: 85, badge: 'Hot Deal', image: BRAND_IMAGES.crv, description: 'Hybrid irit, interior orisinal, kunci cadangan lengkap.', createdAt: now - 5 * H },
    { id: 'c-ioniq5', title: 'Hyundai Ioniq 5 Signature', price: 695000000, year: 2023, km: 15000, location: 'Bandung', category: 'Listrik', status: 'queued', interest: 60, badge: 'Diskon', image: BRAND_IMAGES.ioniq5, description: 'Mobil listrik, baterai sehat, garansi resmi berjalan.', createdAt: now - 26 * H },
    { id: 'c-civic', title: 'Honda Civic RS 1.5 Turbo', price: 465000000, year: 2022, km: 20000, location: 'Jakarta', category: 'Sedan', status: 'done', interest: 92, badge: 'Terjual', image: BRAND_IMAGES.civic, description: 'Terjual dengan verifikasi dan pembayaran penuh.', createdAt: now - 30 * H },
    { id: 'c-pajero', title: 'Mitsubishi Pajero Sport Dakar', price: 445000000, year: 2021, km: 35000, location: 'Semarang', category: 'SUV', status: 'queued', interest: 54, badge: 'Baru', image: BRAND_IMAGES.pajero, description: 'Menunggu verifikasi dokumen oleh tim AutoBuyCars.', createdAt: now - 50 * H },
    { id: 'c-bmw', title: 'BMW 320i Sport', price: 495000000, year: 2020, km: 40000, location: 'Jakarta', category: 'Sedan', status: 'failed', interest: 30, badge: 'Ditolak', image: BRAND_IMAGES.bmw, description: 'Ditolak: dokumen BPKB tidak sesuai data pengajuan.', createdAt: now - 72 * H },
    { id: 'c-avanza', title: 'Toyota Avanza 1.5 G CVT', price: 225000000, year: 2022, km: 25000, location: 'Bekasi', category: 'MPV', status: 'done', interest: 78, badge: 'Terjual', image: BRAND_IMAGES.avanza, description: 'Terjual ke pembeli dari Bekasi, serah terima selesai.', createdAt: now - 96 * H },
    { id: 'c-ayla', title: 'Daihatsu Ayla 1.2 R', price: 145000000, year: 2023, km: 10000, location: 'Depok', category: 'Hatchback', status: 'running', interest: 66, badge: 'Irit', image: BRAND_IMAGES.ayla, description: 'Cocok untuk harian, KM rendah, ban baru.', createdAt: now - 120 * H },
  ];

  const SEED_FAVS = ['c-fortuner', 'c-ioniq5', 'c-crv', 'c-avanza', 'c-ayla'];

  const SEED_HIST = [
    { id: 'h1', type: 'beli', text: 'Mobil <b>Honda Civic RS</b> berhasil terjual', ts: now - 2 * H },
    { id: 'h2', type: 'tawar', text: 'Ada penawaran baru untuk <b>Toyota Fortuner</b>', ts: now - 5 * H },
    { id: 'h3', type: 'jual', text: 'Mobil baru <b>Hyundai Ioniq 5</b> ditambahkan', ts: now - 26 * H },
    { id: 'h4', type: 'verifikasi', text: 'Verifikasi dokumen <b>Mitsubishi Pajero</b> sedang diproses', ts: now - 50 * H },
    { id: 'h5', type: 'batal', text: 'Penawaran pada <b>BMW 320i</b> dibatalkan oleh pembeli', ts: now - 72 * H },
  ];

  function clone(v) {
    try {
      if (typeof structuredClone === 'function') return structuredClone(v);
    } catch { /* abaikan, pakai fallback */ }
    return JSON.parse(JSON.stringify(v));
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      return JSON.parse(raw);
    } catch {
      return clone(fallback);
    }
  }
  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* abaikan: mode privat / penyimpanan diblokir */ }
  }
  function emit() {
    window.dispatchEvent(new CustomEvent('storechange'));
  }

  let cars = load(LS_CARS, SEED_CARS);
  let favs = load(LS_FAVS, SEED_FAVS);
  let hist = load(LS_HIST, SEED_HIST);
  let settings = load(LS_SET, { target: 10 });

  // Samakan favorit dengan id mobil yang masih ada.
  favs = favs.filter((id) => cars.some((c) => c.id === id));

  function persist() {
    save(LS_CARS, cars);
    save(LS_FAVS, favs);
    save(LS_HIST, hist.slice(0, 60));
    save(LS_SET, settings);
    emit();
  }

  const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

  function timeAgo(ts) {
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return 'baru saja';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} mnt lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'Kemarin';
    if (d < 30) return `${d} hari lalu`;
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  window.fmtRp = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');
  window.timeAgo = timeAgo;

  window.CarStore = {
    all() { return [...cars].sort((a, b) => b.createdAt - a.createdAt); },
    get(id) { return cars.find((c) => c.id === id); },
    active() { return cars.filter((c) => c.status === 'running'); },
    history() { return [...hist].sort((a, b) => b.ts - a.ts); },

    stats() {
      const total = cars.length;
      const active = cars.filter((c) => c.status === 'running').length;
      const sold = cars.filter((c) => c.status === 'done').length;
      const pending = cars.filter((c) => c.status === 'queued').length;
      const favCount = favs.filter((id) => cars.some((c) => c.id === id)).length;
      const activeValue = cars.filter((c) => c.status === 'running').reduce((a, c) => a + (c.price || 0), 0);
      return { total, active, sold, pending, favCount, activeValue };
    },

    categoryDist() {
      const cats = {};
      cars.forEach((c) => { cats[c.category || 'Lainnya'] = (cats[c.category || 'Lainnya'] || 0) + 1; });
      const total = cars.length || 1;
      return Object.entries(cats)
        .map(([label, n]) => ({ label, pct: Math.round((n / total) * 100) }))
        .sort((a, b) => b.pct - a.pct);
    },

    popular(limit = 3) {
      return [...cars].sort((a, b) => (b.interest || 0) - (a.interest || 0)).slice(0, limit);
    },

    isFav(id) { return favs.includes(id); },
    favorites() { return favs.map((id) => cars.find((c) => c.id === id)).filter(Boolean); },

    // ---------- Penawaran (tawar harga) ----------
    offersFor(id) {
      const car = cars.find((c) => c.id === id);
      const list = ((car && car.offers) || []).slice().sort((a, b) => b.ts - a.ts);
      return list;
    },
    bestOffer(id) {
      const list = this.offersFor(id);
      if (!list.length) return null;
      return list.reduce((a, b) => (b.amount > a.amount ? b : a));
    },
    makeOffer(id, amount, note) {
      const car = cars.find((c) => c.id === id);
      if (!car || car.status === 'done') return null;
      const val = Number(amount) || 0;
      if (val < 1000000) return null;
      car.offers = car.offers || [];
      const offer = { id: uid('o'), amount: val, note: (note || '').trim(), ts: Date.now(), status: 'pending' };
      car.offers.unshift(offer);
      car.interest = Math.max(0, Math.min(100, (car.interest || 50) + 1));
      this.log('tawar', `Penawaran ${window.fmtRp(val)} untuk <b>${car.title}</b>`, true, car.id);
      persist();
      return offer;
    },
    decideOffer(id, offerId, accept) {
      const car = cars.find((c) => c.id === id);
      if (!car || !car.offers) return null;
      const offer = car.offers.find((o) => o.id === offerId);
      if (!offer) return null;
      offer.status = accept ? 'accepted' : 'rejected';
      if (accept) {
        car.price = offer.amount;
        car.status = 'done';
        car.badge = 'Terjual';
        car.purchase = {
          method: 'tawar', dp: 0, tenor: 0, rate: 0,
          installment: 0, name: (offer.note || '').trim(),
          phone: '', ts: Date.now(),
        };
        this.log('beli', `Penawaran ${window.fmtRp(offer.amount)} untuk <b>${car.title}</b> diterima`, true, car.id);
      } else {
        this.log('batal', `Penawaran ${window.fmtRp(offer.amount)} untuk <b>${car.title}</b> ditolak`, true, car.id);
      }
      persist();
      return offer;
    },

    toggleFav(id) {
      const car = cars.find((c) => c.id === id);
      if (!car) return false;
      const on = !favs.includes(id);
      favs = on ? [...favs, id] : favs.filter((f) => f !== id);
      car.interest = Math.max(0, Math.min(100, (car.interest || 50) + (on ? 1 : -1)));
      this.log('favorit', on ? `Mobil <b>${car.title}</b> ditambahkan ke favorit` : `Mobil <b>${car.title}</b> dihapus dari favorit`, true);
      persist();
      return on;
    },

    add(data) {
      const category = data.category || 'SUV';
      const car = {
        id: uid('c'),
        title: data.title.trim(),
        price: Number(data.price) || 0,
        year: Number(data.year) || new Date().getFullYear(),
        km: Number(data.km) || 0,
        location: data.location || '-',
        category,
        status: 'queued',
        interest: 50,
        badge: 'Baru',
        image: imageFor(category, data.image),
        description: (data.description || '').trim(),
        createdAt: Date.now(),
      };
      cars.unshift(car);
      this.log('jual', `Mobil baru <b>${car.title}</b> ditambahkan, menunggu verifikasi`, true);
      persist();
      return car;
    },

    update(id, patch) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      Object.assign(car, patch);
      persist();
      return car;
    },

    remove(id) {
      const car = cars.find((c) => c.id === id);
      cars = cars.filter((c) => c.id !== id);
      favs = favs.filter((f) => f !== id);
      if (car) this.log('hapus', `Listing <b>${car.title}</b> dihapus`, true);
      persist();
    },

    setStatus(id, status) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      car.status = status;
      const label = { done: 'terjual', running: 'ditayangkan', queued: 'menunggu verifikasi', failed: 'ditolak' }[status] || status;
      this.log('status', `Mobil <b>${car.title}</b> ${label}`, true);
      persist();
      return car;
    },

    // ---------- Edit listing ----------
    edit(id, data) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      const title = (data.title || '').trim();
      const price = Number(data.price) || 0;
      const year = Number(data.year) || car.year;
      if (title.length < 4 || !price || price < 1000000 || !year || year < 1990 || year > 2026) return null;
      car.title = title;
      car.price = price;
      car.year = year;
      car.km = Number(data.km) || 0;
      car.location = (data.location || '').trim() || '-';
      car.category = data.category || car.category;
      const img = (data.image || '').trim();
      if (Object.prototype.hasOwnProperty.call(data, 'image')) car.image = img;
      car.description = (data.description || '').trim();
      this.log('jual', `Listing <b>${car.title}</b> diperbarui`, true);
      persist();
      return car;
    },

    buy(id, opts = {}) {
      const car = cars.find((c) => c.id === id);
      if (!car || car.status === 'done') return false;
      car.status = 'done';
      car.badge = 'Terjual';
      const method = opts.method === 'kredit' ? 'kredit' : 'tunai';
      car.purchase = {
        method,
        dp: Number(opts.dp) || 0,
        tenor: Number(opts.tenor) || 0,
        rate: Number(opts.rate) || 0,
        installment: Number(opts.installment) || 0,
        name: (opts.name || '').trim(),
        phone: (opts.phone || '').trim(),
        ts: Date.now(),
      };
      if (method === 'kredit') {
        this.log('beli', `Mobil <b>${car.title}</b> dibeli kredit — DP ${window.fmtRp(car.purchase.dp)}, ${car.purchase.tenor}× ${window.fmtRp(car.purchase.installment)}/bln`, true, car.id);
      } else {
        this.log('beli', `Mobil <b>${car.title}</b> berhasil dibeli tunai (${window.fmtRp(car.price)})`, true, car.id);
      }
      persist();
      return true;
    },

    // ---------- Ringkasan terintegrasi (dipakai dashboard + marketplace) ----------
    pendingOffersCount() {
      return cars.reduce((a, c) => a + ((c.offers || []).filter((o) => o.status === 'pending').length), 0);
    },
    totalRevenue() {
      return cars.filter((c) => c.status === 'done').reduce((a, c) => a + (Number(c.price) || 0), 0);
    },
    soldEvents() {
      // Waktu terjual: pakai purchase.ts bila ada, sonst createdAt.
      return cars
        .filter((c) => c.status === 'done')
        .map((c) => (c.purchase && c.purchase.ts) || c.createdAt)
        .filter((ts) => ts > 0)
        .sort((a, b) => a - b);
    },
    listedEvents() {
      return cars.map((c) => c.createdAt).filter((ts) => ts > 0).sort((a, b) => a - b);
    },

    log(type, text, silent, carId) {
      hist.unshift({ id: uid('h'), type, text, ts: Date.now(), carId: carId || null });
      hist = hist.slice(0, 60);
      if (!silent) persist();
      else {
        save(LS_HIST, hist);
        save(LS_CARS, cars);
        save(LS_FAVS, favs);
      }
    },

    getTarget() { try { return Number(settings.target) || 10; } catch { return 10; } },
    setTarget(n) { settings.target = Math.max(1, Number(n) || 10); persist(); },

    reset() {
      cars = clone(SEED_CARS);
      favs = [...SEED_FAVS];
      hist = clone(SEED_HIST).map((h) => ({ ...h, ts: Date.now() - (now - h.ts) }));
      settings = { target: 10 };
      persist();
    },
  };
})();
