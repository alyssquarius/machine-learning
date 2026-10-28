import type { Car } from '../components/store-provider';

export const DEMO_SEED_KEY = 'abc_demo_catalog_v1';
// Synthetic examples, not market valuations or vehicles offered for sale.
const MODELS: [string, string, string, number, number, number][] = [
  ['Toyota', 'Avanza', 'MPV', 2022, 185, 28000],
  ['Toyota', 'Innova', 'MPV', 2023, 365, 21000],
  ['Toyota', 'Fortuner', 'SUV', 2022, 495, 42000],
  ['Toyota', 'Yaris', 'Hatchback', 2021, 215, 35000],
  ['Toyota', 'Camry', 'Sedan', 2023, 610, 18000],
  ['Honda', 'Brio', 'Hatchback', 2022, 155, 26000],
  ['Honda', 'HR-V', 'SUV', 2023, 345, 16000],
  ['Honda', 'CR-V', 'SUV', 2021, 410, 38000],
  ['Honda', 'Civic', 'Sedan', 2022, 485, 22000],
  ['Suzuki', 'Ertiga', 'MPV', 2022, 195, 31000],
  ['Suzuki', 'XL7', 'SUV', 2023, 225, 19000],
  ['Suzuki', 'Baleno', 'Hatchback', 2021, 165, 44000],
  ['Daihatsu', 'Xenia', 'MPV', 2022, 175, 27000],
  ['Daihatsu', 'Ayla', 'Hatchback', 2023, 125, 17000],
  ['Daihatsu', 'Terios', 'SUV', 2021, 205, 46000],
  ['Mitsubishi', 'Xpander', 'MPV', 2022, 245, 29000],
  ['Mitsubishi', 'Pajero Sport', 'SUV', 2023, 535, 25000],
  ['Mitsubishi', 'Triton', 'Pickup', 2021, 315, 56000],
  ['Nissan', 'Livina', 'MPV', 2022, 195, 33000],
  ['Nissan', 'Serena', 'Van', 2021, 325, 41000],
  ['Nissan', 'X-Trail', 'SUV', 2020, 285, 62000],
  ['Hyundai', 'Creta', 'SUV', 2023, 295, 19000],
  ['Hyundai', 'Ioniq 5', 'Listrik', 2023, 625, 14000],
  ['Hyundai', 'Stargazer', 'MPV', 2023, 225, 23000],
  ['Wuling', 'Air ev', 'Listrik', 2023, 165, 11000],
  ['Wuling', 'Almaz', 'SUV', 2022, 235, 32000],
  ['Wuling', 'Confero', 'MPV', 2021, 115, 48000],
  ['Kia', 'Sonet', 'SUV', 2022, 245, 24000],
  ['Kia', 'Grand Carnival', 'Van', 2023, 785, 18000],
  ['Mazda', 'CX-5', 'SUV', 2022, 465, 31000],
  ['Mazda', '6 Estate', 'Wagon', 2021, 495, 36000],
  ['BMW', '320i', 'Sedan', 2022, 685, 25000],
  ['BMW', '420i Coupe', 'Coupe', 2021, 795, 27000],
  ['Mercedes-Benz', 'C200', 'Sedan', 2022, 735, 22000],
  ['Mercedes-Benz', 'CLA200', 'Coupe', 2021, 695, 34000],
  ['BYD', 'Dolphin', 'Listrik', 2024, 325, 9000],
  ['BYD', 'Seal', 'Listrik', 2024, 565, 12000],
  ['Chery', 'Tiggo 7 Pro', 'SUV', 2023, 315, 17000],
  ['Chery', 'Omoda E5', 'Listrik', 2024, 395, 8000],
  ['MG', '4 EV', 'Listrik', 2024, 345, 10000],
  ['Ford', 'Ranger', 'Pickup', 2022, 475, 46000],
  ['Chevrolet', 'Trax', 'SUV', 2019, 155, 67000],
  ['Isuzu', 'D-Max', 'Pickup', 2022, 335, 51000],
  ['Lexus', 'RX300', 'SUV', 2021, 945, 32000],
  ['Peugeot', '3008', 'SUV', 2022, 435, 28000],
  ['Volkswagen', 'Golf', 'Hatchback', 2021, 395, 35000],
  ['Volvo', 'V60', 'Wagon', 2020, 575, 47000],
  ['Subaru', 'BRZ', 'Coupe', 2023, 695, 15000],
  ['Tesla', 'Model 3', 'Listrik', 2023, 785, 20000],
  ['Toyota', 'Hiace', 'Van', 2022, 445, 55000],
];
const DEMO_PHOTOS: Record<string, NonNullable<Car["photoCredit"]>> = {
  "demo-car-001": {
    "author": "Ethan Llamas",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Toyota_Avanza_(PH).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-002": {
    "author": "Chanokchon",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Toyota_Innova_Zenix_2.0_HEV_Premium.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-003": {
    "author": "Captainmorlypogi1959",
    "source": "https://commons.wikimedia.org/wiki/File:Toyota_Fortuner_4x4_Legender_(LTD)_2022.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-004": {
    "author": "LuvsMG481",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Toyota_Yaris_Sport_front.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-005": {
    "author": "EurovisionNim",
    "source": "https://commons.wikimedia.org/wiki/File:2018_Toyota_Camry_(ASV70R)_Ascent_sedan_(2018-08-27)_01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-006": {
    "author": "Gabinbiscuit",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Honda_Brio.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  "demo-car-007": {
    "author": "Alex Neman",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Honda_HR-V_SE_(front).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-008": {
    "author": "EurovisionNim",
    "source": "https://commons.wikimedia.org/wiki/File:2018_Honda_CR-V_(RW_MY18)_%2BSport_2WD_wagon_(2018-10-22)_01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-009": {
    "author": "MercurySable99",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Honda_Civic_LX_Sedan,_front_right.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-010": {
    "author": "RasyaAbhirama13",
    "source": "https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_Sport_2022.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  "demo-car-011": {
    "author": "オーバードライブ83",
    "source": "https://commons.wikimedia.org/wiki/File:2020_Suzuki_XL7_Zeta_1.5_NC22S_(20210307)_01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-012": {
    "author": "Haysnawri10",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Suzuki_Baleno.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-013": {
    "author": "オーバードライブ83",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Daihatsu_Xenia_1.3_R_W100RG_(20220506).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-014": {
    "author": "Andra Febrian",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Daihatsu_Ayla_1.2_R_(Indonesia)_front_view.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-015": {
    "author": "オーバードライブ83",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Daihatsu_Terios_X_1.5_F800RG_(20210821).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-016": {
    "author": "オーバードライブ83",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Mitsubishi_Xpander_Ultimate_1.5_NC2W_(20220221).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-017": {
    "author": "Alex Neman",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Mitsubishi_Pajero_Sport_2.4_Dakar_4x2_(front),_Citraland,_West_Surabaya.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-018": {
    "author": "Ethan Llamas",
    "source": "https://commons.wikimedia.org/wiki/File:Mitsubishi_Triton_2.4_Athlete_4WD_White_Diamond_-_front.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-019": {
    "author": "Ethan Llamas",
    "source": "https://commons.wikimedia.org/wiki/File:Nissan_Livina_1.5_VL_(20221211).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-020": {
    "author": "Kazyakuruma",
    "source": "https://commons.wikimedia.org/wiki/File:Nissan_Serena_(C27)_e-Power_XV_aero,_2021,_front.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  "demo-car-021": {
    "author": "TTTNIS",
    "source": "https://commons.wikimedia.org/wiki/File:2017-2020_Nissan_X-Trail_20X.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  "demo-car-022": {
    "author": "Chanokchon",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Hyundai_Creta_Smart.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-023": {
    "author": "Alexander-93",
    "source": "https://commons.wikimedia.org/wiki/File:Hyundai_Ioniq_5_1X7A7085.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-024": {
    "author": "Andra Febrian",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Hyundai_Stargazer_Prime_(Indonesia)_front_view_01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-025": {
    "author": "Zotyefan",
    "source": "https://commons.wikimedia.org/wiki/File:Wuling_Air_EV_IMG001.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-026": {
    "author": "Alex Neman",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Wuling_Almaz_RS_(front),_Pakuwon_Trade_Center,_West_Surabaya.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-027": {
    "author": "Haysnawri10",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Wuling_Confero.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-028": {
    "author": "Zotyefan",
    "source": "https://commons.wikimedia.org/wiki/File:Kia_Sonet_IMG001.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  "demo-car-029": {
    "author": "MercurySable99",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Kia_Carnival_LX,_front_right.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-030": {
    "author": "EurovisionNim",
    "source": "https://commons.wikimedia.org/wiki/File:2017_Mazda_CX-5_(KF)_Maxx_2WD_wagon_(2018-11-02)_01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-031": {
    "author": "Tokumeigakarinoaoshima",
    "source": "https://commons.wikimedia.org/wiki/File:MAZDA6_WAGON_20S_Black_Tone_Edition_2WD%E3%83%BB6EC-AT_(6BA-GJEFW).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-032": {
    "author": "Tokumeigakarinoaoshima",
    "source": "https://commons.wikimedia.org/wiki/File:Osaka_Auto_Messe_2022_(590)_-_BMW_320i_M_Sport_(G20)_tuned_by_ALLZU_Motorenbau.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-033": {
    "author": "Vauxford",
    "source": "https://commons.wikimedia.org/wiki/File:2021_BMW_420i_M_Sport_Automatic_2.0.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-034": {
    "author": "Charles from Port Chester, New York",
    "source": "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_C-Klasse_(W206)_C_200_(2022)_(53327170733).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  "demo-car-035": {
    "author": "Alexander Migl",
    "source": "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_C118_IMG_4172.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-036": {
    "author": "Alexander-93",
    "source": "https://commons.wikimedia.org/wiki/File:BYD_Dolphin_IAA_2023_1X7A0634.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-037": {
    "author": "Calreyn88",
    "source": "https://commons.wikimedia.org/wiki/File:2024_BYD_Seal_2.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-038": {
    "author": "Throwawayacc222",
    "source": "https://commons.wikimedia.org/wiki/File:2023_Chery_Tiggo7_Pro_Max_grey_front.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  "demo-car-039": {
    "author": "Calreyn88",
    "source": "https://commons.wikimedia.org/wiki/File:2024_Omoda_E5.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-040": {
    "author": "S5A-0043",
    "source": "https://commons.wikimedia.org/wiki/File:(SGP-Singapore)_Showcar_MG4_EV_No-plate_2024-09-14_-_2.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
  },
  "demo-car-041": {
    "author": "Calreyn88",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Ford_Ranger_Raptor.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-042": {
    "author": "Crisco 1492",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Chevrolet_Trax_LT,_Windsor,_Ontario,_2025-07-01.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-043": {
    "author": "Matti Blume",
    "source": "https://commons.wikimedia.org/wiki/File:GIMS_2024,_Le_Grand-Saconnex_(GIMS0114).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  "demo-car-044": {
    "author": "Dinkun Chen",
    "source": "https://commons.wikimedia.org/wiki/File:LEXUS_RX_300_F-SPORT_(AL20)_China.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-045": {
    "author": "Alexander-93",
    "source": "https://commons.wikimedia.org/wiki/File:2021_Peugeot_3008_B_1X7A6965.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-046": {
    "author": "Vauxford",
    "source": "https://commons.wikimedia.org/wiki/File:2020_Volkswagen_Golf_Style_1.5_Front.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-047": {
    "author": "Elise240SX",
    "source": "https://commons.wikimedia.org/wiki/File:2020_Volvo_V60_R-Design_in_Bursting_Blue_Metallic,_front_right,_2024-10-03.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-048": {
    "author": "Ethan Llamas",
    "source": "https://commons.wikimedia.org/wiki/File:Subaru_BRZ_2.4_%27Eyesight%27_2023_(5).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-049": {
    "author": "Alexander-93",
    "source": "https://commons.wikimedia.org/wiki/File:Tesla_Model_3_(2023)_IMG_9488_(cropped).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  "demo-car-050": {
    "author": "Ethan Llamas",
    "source": "https://commons.wikimedia.org/wiki/File:2022_Toyota_Hiace_3.0_Commuter_in_white,_front_right.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  }
};

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Yogyakarta', 'Denpasar', 'Makassar', 'Banda Aceh', 'Tangerang'];

export function createDemoCars(): Car[] {
  return MODELS.map(([brand, model, category, year, millions, km], i) => ({
    id: `demo-car-${String(i + 1).padStart(3, '0')}`,
    title: `${brand} ${model}`, brand, model, category, year,
    price: millions * 1_000_000, km, location: CITIES[i % CITIES.length],
    status: 'running', interest: 0, badge: 'Data demo', isDemo: true,
    image: `/images/demo-cars/demo-car-${String(i + 1).padStart(3, '0')}.jpg`,
    photoCredit: DEMO_PHOTOS[`demo-car-${String(i + 1).padStart(3, '0')}`],
    description: `Data dummy ${brand} ${model} untuk mencoba katalog, filter, favorit, dan simulasi kredit. Harga, tahun, kilometer, dan kota adalah contoh. Foto adalah referensi model ${brand} ${model}, bukan unit asli; warna, varian, dan tahun pada foto dapat berbeda dari contoh spesifikasi. Mobil ini tidak ditawarkan untuk dijual.`,
    sellerId: 'demo-showroom', sellerName: 'Showroom Demo', sellerPhone: '',
    createdAt: Date.UTC(2026, 9, 28, 0, 0) - i * 3_600_000, offers: [],
  }));
}

// Run only on first catalogue load. Stable IDs preserve edits and avoid duplicates.
export function seedDemoCatalog(storage: Pick<Storage, 'getItem' | 'setItem'>): void {
  upgradeDemoPhotos(storage);
  if (storage.getItem(DEMO_SEED_KEY)) return;
  const raw = storage.getItem('abc_cars_shared_v2');
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) return;
  const seen = new Set(parsed.map(c => c?.id));
  storage.setItem('abc_cars_shared_v2', JSON.stringify([...parsed, ...createDemoCars().filter(c => !seen.has(c.id))]));
  storage.setItem(DEMO_SEED_KEY, '1');
}

// Upgrade only the old built-in illustrations; retain user photos, edits, and deletions.
export function upgradeDemoPhotos(storage: Pick<Storage, 'getItem' | 'setItem'>): void {
  const raw=storage.getItem('abc_cars_shared_v2');
  if (!raw) return;
  const parsed:unknown=JSON.parse(raw);
  if (!Array.isArray(parsed)) return;
  const defaults=new Map(createDemoCars().map(c=>[c.id,c]));
  let changed=false;
  const next=parsed.map(c=>{
    const photo=defaults.get(c?.id);
    if (!photo || c.isDemo!==true || !/^\/images\/demo-cars\/[a-z]+\.svg$/.test(c.image || '')) return c;
    if ((c.brand && c.brand!==photo.brand) || (c.model && c.model!==photo.model)) return c;
    // A gallery supplied by the user takes precedence over the old cover.
    if (Array.isArray(c.images) && c.images.some((u:unknown)=>typeof u==='string' && !/^\/images\/demo-cars\/[a-z]+\.svg$/.test(u))) return c;
    changed=true;
    return {...c,image:photo.image,images:[photo.image],photoCredit:photo.photoCredit,
      description:typeof c.description==='string' ? c.description.replace(/Ilustrasi menunjukkan tipe [^.]+, bukan foto unit asli\./,'Foto referensi model, bukan unit asli; warna, varian, dan tahun pada foto dapat berbeda dari contoh spesifikasi.') : photo.description};
  });
  if (changed) storage.setItem('abc_cars_shared_v2',JSON.stringify(next));
}
