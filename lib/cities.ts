export const CATEGORIES = [
  "SUV",
  "Sedan",
  "MPV",
  "Hatchback",
  "Listrik",
  "Wagon",
  "Coupe",
  "Van",
  "Pickup",
  "Lainnya",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CITY_GROUPS: Record<string, string[]> = {
  Aceh: ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam", "Meulaboh", "Bireuen", "Takengon", "Tapaktuan"],
  "Sumatera Utara": ["Medan", "Binjai", "Tebing Tinggi", "Pematang Siantar", "Tanjung Balai", "Sibolga", "Gunungsitoli", "Padangsidimpuan", "Kisaran", "Lubuk Pakam", "Stabat", "Balige"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Payakumbuh", "Pariaman", "Solok", "Padang Panjang", "Sawahlunto", "Batusangkar", "Lubuk Sikaping"],
  Riau: ["Pekanbaru", "Dumai", "Bengkalis", "Tembilahan", "Pangkalan Kerinci", "Bangkinang", "Duri", "Siak", "Selat Panjang"],
  "Kepulauan Riau": ["Batam", "Tanjung Pinang", "Bintan", "Karimun", "Natuna", "Anambas", "Lingga"],
  Jambi: ["Jambi", "Sungai Penuh", "Muara Bungo", "Kuala Tungkal", "Bangko", "Sarolangun", "Muara Bulian"],
  "Sumatera Selatan": ["Palembang", "Prabumulih", "Lubuk Linggau", "Pagar Alam", "Kayu Agung", "Baturaja", "Muara Enim", "Sekayu", "Lahat"],
  "Kep. Bangka Belitung": ["Pangkal Pinang", "Tanjung Pandan", "Sungailiat", "Toboali", "Muntok", "Koba"],
  Bengkulu: ["Bengkulu", "Curup", "Manna", "Arga Makmur", "Kepahiang", "Mukomuko"],
  Lampung: ["Bandar Lampung", "Metro", "Kalianda", "Kotabumi", "Pringsewu", "Bandar Jaya", "Liwa", "Sukadana", "Blambangan Umpu"],
  Banten: ["Serang", "Cilegon", "Tangerang", "Tangerang Selatan", "Pandeglang", "Rangkasbitung", "Tigaraksa", "Labuan"],
  "DKI Jakarta": ["Jakarta", "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Timur", "Jakarta Selatan", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi", "Cirebon", "Sukabumi", "Tasikmalaya", "Banjar", "Karawang", "Cianjur", "Garut", "Sumedang", "Purwakarta", "Subang", "Indramayu", "Kuningan", "Majalengka", "Cikarang", "Soreang"],
  "Jawa Tengah": ["Semarang", "Surakarta", "Salatiga", "Pekalongan", "Tegal", "Magelang", "Kudus", "Purwokerto", "Cilacap", "Kebumen", "Klaten", "Demak", "Kendal", "Jepara", "Pati", "Rembang", "Blora", "Sragen", "Boyolali", "Pemalang", "Brebes", "Slawi", "Purwodadi", "Temanggung", "Wonosobo", "Banjarnegara"],
  "DI Yogyakarta": ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul", "Wates", "Wonosari"],
  "Jawa Timur": ["Surabaya", "Malang", "Batu", "Kediri", "Blitar", "Madiun", "Mojokerto", "Pasuruan", "Probolinggo", "Lumajang", "Jember", "Banyuwangi", "Sidoarjo", "Gresik", "Lamongan", "Tuban", "Bojonegoro", "Ngawi", "Ponorogo", "Tulungagung", "Trenggalek", "Situbondo", "Bondowoso", "Pamekasan", "Sampang", "Sumenep", "Bangkalan", "Nganjuk", "Jombang", "Bangil"],
  Bali: ["Denpasar", "Badung", "Gianyar", "Singaraja", "Tabanan", "Klungkung", "Bangli", "Negara", "Karangasem", "Ubud"],
  "Nusa Tenggara Barat": ["Mataram", "Bima", "Dompu", "Sumbawa Besar", "Praya", "Selong", "Taliwang", "Gerung"],
  "Nusa Tenggara Timur": ["Kupang", "Maumere", "Ende", "Larantuka", "Labuan Bajo", "Waingapu", "Atambua", "Ruteng", "Bajawa", "Kalabahi", "Soe"],
  "Kalimantan Barat": ["Pontianak", "Singkawang", "Ketapang", "Sambas", "Sintang", "Putussibau", "Bengkayang", "Mempawah", "Ngabang"],
  "Kalimantan Tengah": ["Palangka Raya", "Sampit", "Pangkalan Bun", "Muara Teweh", "Kuala Kapuas", "Kasongan", "Buntok", "Kuala Kurun"],
  "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru", "Martapura", "Barabai", "Kandangan", "Amuntai", "Tanjung", "Batulicin", "Kotabaru", "Pelaihari", "Marabahan"],
  "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang", "Tenggarong", "Sangatta", "Tanjung Redeb", "Penajam", "Sendawar", "Tanah Grogot", "Melak"],
  "Kalimantan Utara": ["Tanjung Selor", "Tarakan", "Nunukan", "Malinau", "Tana Tidung"],
  "Sulawesi Utara": ["Manado", "Bitung", "Tomohon", "Kotamobagu", "Tondano", "Tahuna", "Boroko", "Amurang"],
  Gorontalo: ["Gorontalo", "Limboto", "Tilamuta", "Marisa", "Suwawa"],
  "Sulawesi Tengah": ["Palu", "Luwuk", "Poso", "Toli-Toli", "Ampana", "Parigi", "Buol", "Donggala", "Banggai"],
  "Sulawesi Barat": ["Mamuju", "Polewali", "Majene", "Pasangkayu", "Mamasa", "Topoyo"],
  "Sulawesi Selatan": ["Makassar", "Parepare", "Palopo", "Watampone", "Bulukumba", "Sengkang", "Pinrang", "Sidenreng", "Maros", "Sungguminasa", "Takalar", "Jeneponto", "Bantaeng", "Sinjai", "Barru", "Pangkajene", "Enrekang", "Masamba"],
  "Sulawesi Tenggara": ["Kendari", "Bau-Bau", "Unaaha", "Kolaka", "Raha", "Pasar Wajo", "Andoolo", "Wangi-Wangi", "Lasusua"],
  Maluku: ["Ambon", "Tual", "Masohi", "Namlea", "Piru", "Dobo", "Saumlaki", "Bula", "Tiakur"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan", "Tobelo", "Labuha", "Jailolo", "Maba", "Sanana", "Morotai"],
  Papua: ["Jayapura", "Sentani", "Biak", "Serui", "Keerom", "Sarmi", "Jayawijaya", "Waropen"],
  "Papua Barat": ["Manokwari", "Fak-Fak", "Kaimana", "Bintuni", "Ransiki", "Teminabuan"],
  "Papua Tengah": ["Nabire", "Timika", "Enarotali", "Waghete", "Mulia", "Ilaga"],
  "Papua Pegunungan": ["Wamena", "Dekai", "Oksibil", "Tiom", "Karubaga", "Kobakma", "Elelim"],
  "Papua Selatan": ["Merauke", "Tanah Merah", "Kepi", "Agats", "Mindiptana"],
  "Papua Barat Daya": ["Sorong", "Aimas", "Waisai", "Fef", "Ayamaru", "Kumurkek"],
};

export const INDONESIA_CITIES: string[] = Object.values(CITY_GROUPS)
  .flat()
  .sort((a, b) => a.localeCompare(b, "id"));

export function cleanCategory(c: unknown, fallback: Category = "Lainnya"): Category {
  return (CATEGORIES as readonly string[]).includes(c as string)
    ? (c as Category)
    : fallback;
}
