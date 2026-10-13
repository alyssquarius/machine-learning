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

  // Daftar kota se-Indonesia untuk dropdown (seperti kategori).
  // Dikelompokkan per provinsi agar mudah dipilih; dipakai form Jual + filter Beli.
  const CITY_GROUPS = {
    'Aceh': ['Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam', 'Meulaboh', 'Bireuen', 'Takengon', 'Tapaktuan'],
    'Sumatera Utara': ['Medan', 'Binjai', 'Tebing Tinggi', 'Pematang Siantar', 'Tanjung Balai', 'Sibolga', 'Gunungsitoli', 'Padangsidimpuan', 'Kisaran', 'Lubuk Pakam', 'Stabat', 'Balige'],
    'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Solok', 'Padang Panjang', 'Sawahlunto', 'Batusangkar', 'Lubuk Sikaping'],
    'Riau': ['Pekanbaru', 'Dumai', 'Bengkalis', 'Tembilahan', 'Pangkalan Kerinci', 'Bangkinang', 'Duri', 'Siak', 'Selat Panjang'],
    'Kepulauan Riau': ['Batam', 'Tanjung Pinang', 'Bintan', 'Karimun', 'Natuna', 'Anambas', 'Lingga'],
    'Jambi': ['Jambi', 'Sungai Penuh', 'Muara Bungo', 'Kuala Tungkal', 'Bangko', 'Sarolangun', 'Muara Bulian'],
    'Sumatera Selatan': ['Palembang', 'Prabumulih', 'Lubuk Linggau', 'Pagar Alam', 'Kayu Agung', 'Baturaja', 'Muara Enim', 'Sekayu', 'Lahat'],
    'Kep. Bangka Belitung': ['Pangkal Pinang', 'Tanjung Pandan', 'Sungailiat', 'Toboali', 'Muntok', 'Koba'],
    'Bengkulu': ['Bengkulu', 'Curup', 'Manna', 'Arga Makmur', 'Kepahiang', 'Mukomuko'],
    'Lampung': ['Bandar Lampung', 'Metro', 'Kalianda', 'Kotabumi', 'Pringsewu', 'Bandar Jaya', 'Liwa', 'Sukadana', 'Blambangan Umpu'],
    'Banten': ['Serang', 'Cilegon', 'Tangerang', 'Tangerang Selatan', 'Pandeglang', 'Rangkasbitung', 'Tigaraksa', 'Labuan'],
    'DKI Jakarta': ['Jakarta', 'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Selatan', 'Kepulauan Seribu'],
    'Jawa Barat': ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cimahi', 'Cirebon', 'Sukabumi', 'Tasikmalaya', 'Banjar', 'Karawang', 'Cianjur', 'Garut', 'Sumedang', 'Purwakarta', 'Subang', 'Indramayu', 'Kuningan', 'Majalengka', 'Cikarang', 'Soreang'],
    'Jawa Tengah': ['Semarang', 'Surakarta', 'Salatiga', 'Pekalongan', 'Tegal', 'Magelang', 'Kudus', 'Purwokerto', 'Cilacap', 'Kebumen', 'Klaten', 'Demak', 'Kendal', 'Jepara', 'Pati', 'Rembang', 'Blora', 'Sragen', 'Boyolali', 'Pemalang', 'Brebes', 'Slawi', 'Purwodadi', 'Temanggung', 'Wonosobo', 'Banjarnegara'],
    'DI Yogyakarta': ['Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul', 'Wates', 'Wonosari'],
    'Jawa Timur': ['Surabaya', 'Malang', 'Batu', 'Kediri', 'Blitar', 'Madiun', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Lumajang', 'Jember', 'Banyuwangi', 'Sidoarjo', 'Gresik', 'Lamongan', 'Tuban', 'Bojonegoro', 'Ngawi', 'Ponorogo', 'Tulungagung', 'Trenggalek', 'Situbondo', 'Bondowoso', 'Pamekasan', 'Sampang', 'Sumenep', 'Bangkalan', 'Nganjuk', 'Jombang', 'Bangil'],
    'Bali': ['Denpasar', 'Badung', 'Gianyar', 'Singaraja', 'Tabanan', 'Klungkung', 'Bangli', 'Negara', 'Karangasem', 'Ubud'],
    'Nusa Tenggara Barat': ['Mataram', 'Bima', 'Dompu', 'Sumbawa Besar', 'Praya', 'Selong', 'Taliwang', 'Gerung'],
    'Nusa Tenggara Timur': ['Kupang', 'Maumere', 'Ende', 'Larantuka', 'Labuan Bajo', 'Waingapu', 'Atambua', 'Ruteng', 'Bajawa', 'Kalabahi', 'Soe'],
    'Kalimantan Barat': ['Pontianak', 'Singkawang', 'Ketapang', 'Sambas', 'Sintang', 'Putussibau', 'Bengkayang', 'Mempawah', 'Ngabang'],
    'Kalimantan Tengah': ['Palangka Raya', 'Sampit', 'Pangkalan Bun', 'Muara Teweh', 'Kuala Kapuas', 'Kasongan', 'Buntok', 'Kuala Kurun'],
    'Kalimantan Selatan': ['Banjarmasin', 'Banjarbaru', 'Martapura', 'Barabai', 'Kandangan', 'Amuntai', 'Tanjung', 'Batulicin', 'Kotabaru', 'Pelaihari', 'Marabahan'],
    'Kalimantan Timur': ['Samarinda', 'Balikpapan', 'Bontang', 'Tenggarong', 'Sangatta', 'Tanjung Redeb', 'Penajam', 'Sendawar', 'Tanah Grogot', 'Melak'],
    'Kalimantan Utara': ['Tanjung Selor', 'Tarakan', 'Nunukan', 'Malinau', 'Tana Tidung'],
    'Sulawesi Utara': ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Tondano', 'Tahuna', 'Boroko', 'Amurang'],
    'Gorontalo': ['Gorontalo', 'Limboto', 'Tilamuta', 'Marisa', 'Suwawa'],
    'Sulawesi Tengah': ['Palu', 'Luwuk', 'Poso', 'Toli-Toli', 'Ampana', 'Parigi', 'Buol', 'Donggala', 'Banggai'],
    'Sulawesi Barat': ['Mamuju', 'Polewali', 'Majene', 'Pasangkayu', 'Mamasa', 'Topoyo'],
    'Sulawesi Selatan': ['Makassar', 'Parepare', 'Palopo', 'Watampone', 'Bulukumba', 'Sengkang', 'Pinrang', 'Sidenreng', 'Maros', 'Sungguminasa', 'Takalar', 'Jeneponto', 'Bantaeng', 'Sinjai', 'Barru', 'Pangkajene', 'Enrekang', 'Masamba'],
    'Sulawesi Tenggara': ['Kendari', 'Bau-Bau', 'Unaaha', 'Kolaka', 'Raha', 'Pasar Wajo', 'Andoolo', 'Wangi-Wangi', 'Lasusua'],
    'Maluku': ['Ambon', 'Tual', 'Masohi', 'Namlea', 'Piru', 'Dobo', 'Saumlaki', 'Bula', 'Tiakur'],
    'Maluku Utara': ['Ternate', 'Tidore Kepulauan', 'Tobelo', 'Labuha', 'Jailolo', 'Maba', 'Sanana', 'Morotai'],
    'Papua': ['Jayapura', 'Sentani', 'Biak', 'Serui', 'Keerom', 'Sarmi', 'Jayawijaya', 'Waropen'],
    'Papua Barat': ['Manokwari', 'Fak-Fak', 'Kaimana', 'Bintuni', 'Ransiki', 'Teminabuan'],
    'Papua Tengah': ['Nabire', 'Timika', 'Enarotali', 'Waghete', 'Mulia', 'Ilaga'],
    'Papua Pegunungan': ['Wamena', 'Dekai', 'Oksibil', 'Tiom', 'Karubaga', 'Kobakma', 'Elelim'],
    'Papua Selatan': ['Merauke', 'Tanah Merah', 'Kepi', 'Agats', 'Mindiptana'],
    'Papua Barat Daya': ['Sorong', 'Aimas', 'Waisai', 'Fef', 'Ayamaru', 'Kumurkek'],
  };
  window.CITY_GROUPS = CITY_GROUPS;
  window.INDONESIA_CITIES = Object.values(CITY_GROUPS).flat().sort((a, b) => a.localeCompare(b, 'id'));

  // Kategori resmi (whitelist) agar tidak bisa disuntik via console.
  const CATEGORIES = ['SUV', 'Sedan', 'MPV', 'Hatchback', 'Listrik', 'Lainnya'];
  function cleanCategory(c, fallback) {
    return CATEGORIES.includes(c) ? c : (fallback || 'Lainnya');
  }
  function imageFor(category, explicit) {
    const url = safeImageUrl(explicit);
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

  // Escape HTML untuk semua input pengguna (judul, nama, catatan) agar tidak
  // bisa menyuntik <script> via listing/tawaran/checkout (stored XSS).
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  window.escHtml = esc;

  // Hanya izinkan URL foto http/https (tolak javascript:/data: dsb).
  function safeImageUrl(u) {
    const s = String(u || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s) && s.length <= 500) return s;
    return '';
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
  if (!Array.isArray(cars)) cars = clone(SEED_CARS);
  // Normalisasi tiap baris agar data rusak/tampering di localStorage tidak bikin crash/XSS.
  // - id harus string, title/price/year/km/location/category/status dibersihkan ke default aman.
  // - offers harus array berisi entri valid (id/amount/ts/status whitelist).
  const STATUSES = ['done', 'running', 'queued', 'failed'];
  cars = cars.filter((c) => c && typeof c.id === 'string').map((c) => {
    const o = { ...c };
    o.title = String(o.title || 'Mobil').slice(0, 80);
    o.price = Math.max(0, Number(o.price) || 0);
    const my = new Date().getFullYear();
    o.year = Math.min(my, Math.max(1990, Number(o.year) || my));
    o.km = Math.max(0, Number(o.km) || 0);
    o.location = String(o.location || '-').slice(0, 60) || '-';
    o.category = CATEGORIES.includes(o.category) ? o.category : 'Lainnya';
    o.status = STATUSES.includes(o.status) ? o.status : 'queued';
    o.interest = Math.max(0, Math.min(100, Number(o.interest) || 0));
    o.badge = String(o.badge || '').slice(0, 24);
    o.image = typeof o.image === 'string' ? o.image.slice(0, 500) : '';
    o.description = typeof o.description === 'string' ? o.description.slice(0, 500) : '';
    o.createdAt = Number(o.createdAt) > 0 ? Number(o.createdAt) : Date.now();
    o.offers = Array.isArray(o.offers) ? o.offers.filter((x) => x && typeof x.id === 'string').map((x) => ({
      id: String(x.id),
      amount: Math.max(0, Number(x.amount) || 0),
      note: String(x.note || '').slice(0, 140),
      ts: Number(x.ts) > 0 ? Number(x.ts) : Date.now(),
      status: ['pending', 'accepted', 'rejected'].includes(x.status) ? x.status : 'pending',
    })) : [];
    if (o.purchase && typeof o.purchase === 'object') {
      const p = o.purchase;
      o.purchase = {
        method: ['tunai', 'kredit', 'tawar'].includes(p.method) ? p.method : 'tunai',
        dp: Math.max(0, Number(p.dp) || 0),
        tenor: Math.max(0, Number(p.tenor) || 0),
        rate: Math.max(0, Math.min(30, Number(p.rate) || 0)),
        installment: Math.max(0, Number(p.installment) || 0),
        name: String(p.name || '').slice(0, 60),
        phone: String(p.phone || '').slice(0, 20),
        ts: Number(p.ts) > 0 ? Number(p.ts) : Date.now(),
      };
    } else {
      delete o.purchase;
    }
    return o;
  });
  let favs = load(LS_FAVS, SEED_FAVS);
  if (!Array.isArray(favs)) favs = [];
  let hist = load(LS_HIST, SEED_HIST);
  if (!Array.isArray(hist)) hist = [];
  let settings = load(LS_SET, {});
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
  settings = Object.assign({ target: 10, displayName: '', notifRead: 0 }, settings);

  // Bersihkan data lama dari localStorage: teks riwayat boleh punya <b> saja,
  // tag lain (mis. <script>/<img> dari input lama) dinetralkan agar render aman.
  hist = hist.filter((h) => h && typeof h.text === 'string').map((h) => ({
    ...h,
    text: String(h.text).replace(/<(?!b>|\/b>)/gi, '&lt;'),
  }));

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
      const list = this.offersFor(id).filter((o) => o.status === 'pending');
      if (!list.length) return null;
      return list.reduce((a, b) => (b.amount > a.amount ? b : a));
    },
    makeOffer(id, amount, note) {
      const car = cars.find((c) => c.id === id);
      // Hanya mobil yang sedang dijual (running) yang bisa ditawar.
      if (!car || car.status !== 'running') return null;
      const val = Number(amount) || 0;
      if (val < 1000000) return null;
      car.offers = car.offers || [];
      const offer = { id: uid('o'), amount: val, note: (note || '').trim().slice(0, 140), ts: Date.now(), status: 'pending' };
      car.offers.unshift(offer);
      car.interest = Math.max(0, Math.min(100, (car.interest || 50) + 1));
      this.log('tawar', `Penawaran ${window.fmtRp(val)} untuk <b>${esc(car.title)}</b>`, true, car.id);
      persist();
      return offer;
    },
    decideOffer(id, offerId, accept) {
      const car = cars.find((c) => c.id === id);
      if (!car || !car.offers) return null;
      // Jangan proses bila mobil sudah terjual / tawaran sudah diputus.
      if (car.status === 'done') return null;
      const offer = car.offers.find((o) => o.id === offerId);
      if (!offer || offer.status !== 'pending') return null;
      offer.status = accept ? 'accepted' : 'rejected';
      if (accept) {
        // Tolak tawaran pending lain agar tidak nyangkut setelah terjual.
        car.offers.forEach((o) => { if (o.id !== offer.id && o.status === 'pending') o.status = 'rejected'; });
        car.price = offer.amount;
        car.status = 'done';
        car.badge = 'Terjual';
        car.purchase = {
          method: 'tawar', dp: 0, tenor: 0, rate: 0,
          installment: 0, name: (offer.note || '').trim().slice(0, 60),
          phone: '', ts: Date.now(),
        };
        this.log('beli', `Penawaran ${window.fmtRp(offer.amount)} untuk <b>${esc(car.title)}</b> diterima`, true, car.id);
      } else {
        this.log('batal', `Penawaran ${window.fmtRp(offer.amount)} untuk <b>${esc(car.title)}</b> ditolak`, true, car.id);
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
      this.log('favorit', on ? `Mobil <b>${esc(car.title)}</b> ditambahkan ke favorit` : `Mobil <b>${esc(car.title)}</b> dihapus dari favorit`, true);
      persist();
      return on;
    },

    add(data) {
      const category = cleanCategory(data.category, 'SUV');
      const maxYear = new Date().getFullYear();
      const yearNum = Math.min(maxYear, Math.max(1990, Number(data.year) || maxYear));
      const car = {
        id: uid('c'),
        title: String(data.title || '').trim().slice(0, 80),
        price: Math.max(0, Number(data.price) || 0),
        year: yearNum,
        km: Math.max(0, Number(data.km) || 0),
        location: String(data.location || '-').slice(0, 60) || '-',
        category,
        status: 'queued',
        interest: 50,
        badge: 'Baru',
        image: imageFor(category, data.image),
        description: String(data.description || '').trim().slice(0, 500),
        createdAt: Date.now(),
      };
      cars.unshift(car);
      this.log('jual', `Mobil baru <b>${esc(car.title)}</b> ditambahkan, menunggu verifikasi`, true);
      persist();
      return car;
    },

    update(id, patch) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      // Whitelist agar tidak bisa menyuntik field sembarang via console.
      const allowed = ['title', 'price', 'year', 'km', 'location', 'category', 'status', 'badge', 'image', 'description', 'interest'];
      const clean = {};
      Object.keys(patch || {}).forEach((k) => {
        if (allowed.includes(k)) clean[k] = patch[k];
      });
      if (typeof clean.title === 'string') clean.title = clean.title.trim().slice(0, 80);
      if (clean.price != null) clean.price = Math.max(0, Number(clean.price) || 0);
      if (clean.year != null) { const my = new Date().getFullYear(); clean.year = Math.min(my, Math.max(1990, Number(clean.year) || my)); }
      if (clean.km != null) clean.km = Math.max(0, Number(clean.km) || 0);
      if (typeof clean.location === 'string') clean.location = clean.location.trim().slice(0, 60) || '-';
      if (typeof clean.description === 'string') clean.description = clean.description.trim().slice(0, 500);
      if (typeof clean.image === 'string') {
        const t = clean.image.trim();
        // Kosong = hapus (render pakai fallback kategori). Non-http (javascript:/data:) dibuang.
        if (!t) clean.image = '';
        else {
          const s = safeImageUrl(t);
          if (s) clean.image = s;
          else delete clean.image;
        }
      }
      if (typeof clean.badge === 'string') clean.badge = clean.badge.trim().slice(0, 24);
      if (clean.status != null && !['done', 'running', 'queued', 'failed'].includes(clean.status)) delete clean.status;
      if (clean.interest != null) clean.interest = Math.max(0, Math.min(100, Number(clean.interest) || 0));
      Object.assign(car, clean);
      persist();
      return car;
    },

    remove(id) {
      const car = cars.find((c) => c.id === id);
      if (!car) return false;
      cars = cars.filter((c) => c.id !== id);
      favs = favs.filter((f) => f !== id);
      this.log('hapus', `Listing <b>${esc(car.title)}</b> dihapus`, true);
      persist();
      return true;
    },

    setStatus(id, status) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      // Whitelist status agar tidak bisa diisi sembarang via console.
      if (!['done', 'running', 'queued', 'failed'].includes(status)) return null;
      car.status = status;
      const label = { done: 'terjual', running: 'ditayangkan', queued: 'menunggu verifikasi', failed: 'ditolak' }[status] || status;
      this.log('status', `Mobil <b>${esc(car.title)}</b> ${label}`, true);
      persist();
      return car;
    },

    // ---------- Edit listing ----------
    edit(id, data) {
      const car = cars.find((c) => c.id === id);
      if (!car) return null;
      const title = String(data.title || '').trim().slice(0, 80);
      const price = Number(data.price) || 0;
      const year = Number(data.year) || car.year;
      const maxYear = new Date().getFullYear();
      if (title.length < 4 || !price || price < 1000000 || !year || year < 1990 || year > maxYear) return null;
      car.title = title;
      car.price = price;
      car.year = year;
      car.km = Math.max(0, Number(data.km) || 0);
      car.location = String(data.location || '').trim().slice(0, 60) || '-';
      car.category = cleanCategory(data.category, car.category);
      if (Object.prototype.hasOwnProperty.call(data, 'image')) {
        const img = safeImageUrl(data.image);
        // Kosong = pertahankan foto lama (jangan timpa jadi string kosong).
        // Khusus reset eksplisit, panggil update(id, {image: ''}).
        if (img) car.image = img;
      }
      car.description = String(data.description || '').trim().slice(0, 500);
      this.log('jual', `Listing <b>${esc(car.title)}</b> diperbarui`, true);
      persist();
      return car;
    },

    buy(id, opts = {}) {
      const car = cars.find((c) => c.id === id);
      // Hanya yang masih dijual yang bisa dibeli (queued/failed/done ditolak).
      if (!car || car.status !== 'running') return false;
      car.status = 'done';
      car.badge = 'Terjual';
      const method = opts.method === 'kredit' ? 'kredit' : 'tunai';
      car.purchase = {
        method,
        dp: Math.max(0, Number(opts.dp) || 0),
        tenor: Math.max(0, Number(opts.tenor) || 0),
        rate: Math.max(0, Number(opts.rate) || 0),
        installment: Math.max(0, Number(opts.installment) || 0),
        name: String(opts.name || '').trim().slice(0, 60),
        phone: String(opts.phone || '').trim().slice(0, 20),
        ts: Date.now(),
      };
      if (method === 'kredit') {
        this.log('beli', `Mobil <b>${esc(car.title)}</b> dibeli kredit — DP ${window.fmtRp(car.purchase.dp)}, ${car.purchase.tenor}× ${window.fmtRp(car.purchase.installment)}/bln`, true, car.id);
      } else {
        this.log('beli', `Mobil <b>${esc(car.title)}</b> berhasil dibeli tunai (${window.fmtRp(car.price)})`, true, car.id);
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
    soldThisMonth() {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return this.soldEvents().filter((ts) => ts >= start).length;
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
      const allowed = ['beli', 'jual', 'tawar', 'favorit', 'status', 'verifikasi', 'batal', 'hapus'];
      const t = allowed.includes(type) ? type : 'status';
      hist.unshift({ id: uid('h'), type: t, text: String(text ?? ''), ts: Date.now(), carId: carId || null });
      hist = hist.slice(0, 60);
      if (!silent) persist();
      else {
        save(LS_HIST, hist);
        save(LS_CARS, cars);
        save(LS_FAVS, favs);
        emit();
      }
    },

    getTarget() { try { return Number(settings.target) || 10; } catch { return 10; } },
    setTarget(n) { const v = Math.max(1, Math.min(100, Math.round(Number(n) || 10))); settings.target = v; persist(); return v; },

    // ---------- Visibilitas widget dashboard (bisa di-hide) ----------
    getHiddenWidgets() { try { return Array.isArray(settings.hiddenWidgets) ? [...settings.hiddenWidgets] : []; } catch { return []; } },
    isWidgetHidden(id) { try { return (settings.hiddenWidgets || []).includes(id); } catch { return false; } },
    setWidgetHidden(id, hidden) {
      const list = new Set(Array.isArray(settings.hiddenWidgets) ? settings.hiddenWidgets : []);
      if (hidden) list.add(id); else list.delete(id);
      settings.hiddenWidgets = [...list];
      persist();
    },
    toggleWidget(id) {
      const hidden = !(settings.hiddenWidgets || []).includes(id);
      this.setWidgetHidden(id, hidden);
      return hidden;
    },
    showAllWidgets() { settings.hiddenWidgets = []; persist(); },

    // ---------- Profil lokal + notifikasi (terintegrasi dashboard) ----------
    getDisplayName() { try { return (settings.displayName || '').trim(); } catch { return ''; } },
    setDisplayName(n) {
      settings.displayName = (n || '').trim().slice(0, 40);
      persist();
      return settings.displayName;
    },
    getNotifRead() { try { return Number(settings.notifRead) || 0; } catch { return 0; } },
    markNotifsRead() { settings.notifRead = Date.now(); persist(); },
    unreadCount() {
      const read = this.getNotifRead();
      if (!hist.length) return 0;
      return hist.filter((h) => h.ts > read).length;
    },
    clearHistory() { hist = []; persist(); },
    exportHistoryCSV() {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['waktu', 'tipe', 'teks']];
      this.history().forEach((h) => {
        rows.push([new Date(h.ts).toLocaleString('id-ID'), h.type, String(h.text ?? '').replace(/<[^>]+>/g, '')]);
      });
      return rows.map((r) => r.map(q).join(',')).join('\n');
    },

    reset() {
      cars = clone(SEED_CARS);
      favs = [...SEED_FAVS];
      hist = clone(SEED_HIST).map((h) => ({ ...h, ts: Date.now() - (now - h.ts) }));
      settings = { target: 10, displayName: '', notifRead: Date.now() };
      persist();
    },

    // ---------- Aksi tambahan yang kurang ----------
    duplicate(id) {
      const src = cars.find((c) => c.id === id);
      if (!src) return null;
      const car = clone(src);
      car.id = uid('c');
      car.title = String(src.title || 'Mobil').slice(0, 70) + ' (Salinan)';
      car.status = 'queued';
      car.badge = 'Baru';
      car.offers = [];
      delete car.purchase;
      car.createdAt = Date.now();
      cars.unshift(car);
      this.log('jual', `Listing <b>${esc(car.title)}</b> diduplikat dari <b>${esc(src.title)}</b>`, true, car.id);
      persist();
      return car;
    },
    clearFavs() {
      const n = favs.length;
      favs = [];
      if (n) this.log('favorit', `${n} mobil dihapus dari favorit`, true);
      persist();
      return n;
    },
  };
})();
