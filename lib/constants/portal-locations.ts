/**
 * Pemetaan lokasi per job portal.
 *
 * Data di bawah berasal dari harvest langsung ke Zapi (scraper `dealls`),
 * bukan tebakan: tiap `cityId` diambil dari field `location.cityId` pada
 * response lowongan Dealls yang aktif.
 *
 * Tiga portal menerima nama lokasi sebagai teks bebas:
 *   - LinkedIn, Indeed, Jobstreet
 * Dua portal tidak:
 *   - Dealls  -> hanya menerima `city` berupa ANGKA (cityId). Multi-kota dalam
 *                satu panggilan DITOLAK API (comma string -> HTTP 400).
 *   - Glints  -> tidak punya filter kota sama sekali. `locationId` hanya berisi
 *                UUID tingkat kecamatan (level 4) yang berubah-ubah tiap query,
 *                jadi tidak bisa dipetakan ke nama provinsi.
 */

export const PORTALS = [
  'linkedin',
  'jobstreet',
  'indeed',
  'glints',
  'dealls',
] as const;

export type Portal = (typeof PORTALS)[number];

export const PORTAL_LABEL: Record<Portal, string> = {
  linkedin: 'LinkedIn',
  jobstreet: 'Jobstreet',
  indeed: 'Indeed',
  glints: 'Glints',
  dealls: 'Dealls',
};

/**
 * Kota Dealls per provinsi, urut dari kota dengan lowongan terbanyak.
 * Urutan ini penting: kalau kuota habis di tengah, kota yang besar sudah
 * terambil lebih dulu sehingga user dapat hasil paling bernilai.
 */
export const DEALLS_PROVINCE_CITIES: Record<string, { cityId: number; city: string }[]> = {
  'DKI Jakarta': [
    { cityId: 158, city: 'Jakarta Selatan' },
    { cityId: 156, city: 'Jakarta Barat' },
    { cityId: 157, city: 'Jakarta Pusat' },
    { cityId: 160, city: 'Jakarta Utara' },
    { cityId: 49180, city: 'Jakarta' },
    { cityId: 159, city: 'Jakarta Timur' },
  ],
  'Jawa Barat': [
    { cityId: 179, city: 'Bandung' },
    { cityId: 181, city: 'Bekasi' },
    { cityId: 184, city: 'Cirebon' },
    { cityId: 185, city: 'Depok' },
    { cityId: 166, city: 'Cianjur' },
    { cityId: 163, city: 'Bekasi Regency' },
    { cityId: 165, city: 'Ciamis' },
    { cityId: 168, city: 'Garut' },
    { cityId: 174, city: 'Purwakarta' },
    { cityId: 175, city: 'Subang' },
    { cityId: 177, city: 'Sumedang' },
    { cityId: 187, city: 'Tasikmalaya' },
  ],
  'Sulawesi Selatan': [
    { cityId: 420, city: 'Makassar' },
    { cityId: 404, city: 'Gowa' },
    { cityId: 411, city: 'Pangkajene Kepulauan' },
    { cityId: 412, city: 'Pinrang' },
    { cityId: 415, city: 'Soppeng' },
    { cityId: 418, city: 'Toraja Utara' },
    { cityId: 419, city: 'Wajo' },
    { cityId: 421, city: 'Palopo' },
    { cityId: 422, city: 'Parepare' },
    { cityId: 435, city: 'Muna' },
    { cityId: 438, city: 'Baubau' },
  ],
  'Banten': [
    { cityId: 273, city: 'Tangerang Selatan' },
    { cityId: 272, city: 'Tangerang' },
    { cityId: 269, city: 'Tangerang Regency' },
  ],
  'Bali': [
    { cityId: 274, city: 'Badung' },
    { cityId: 276, city: 'Buleleng' },
    { cityId: 279, city: 'Karangasem' },
  ],
  'Aceh': [
    { cityId: 21, city: 'Lhokseumawe' },
    { cityId: 22, city: 'Sabang' },
    { cityId: 1, city: 'Aceh Barat' },
    { cityId: 8, city: 'Aceh Tengah' },
    { cityId: 16, city: 'Pidie' },
  ],
  'Jawa Tengah': [
    { cityId: 218, city: 'Pekalongan' },
    { cityId: 222, city: 'Tegal' },
    { cityId: 205, city: 'Pekalongan Regency' },
  ],
  'Kalimantan Barat': [
    { cityId: 327, city: 'Pontianak' },
    { cityId: 319, city: 'Kubu Raya' },
  ],
  'Kalimantan Selatan': [
    { cityId: 355, city: 'Banjarmasin' },
    { cityId: 356, city: 'Berau' },
  ],
  'Sulawesi Tengah': [
    { cityId: 445, city: 'Gorontalo' },
    { cityId: 451, city: 'Polewali Mandar' },
    { cityId: 448, city: 'Mamuju' },
    { cityId: 397, city: 'Toli-Toli' },
  ],
  'Sulawesi Utara': [
    { cityId: 384, city: 'Manado' },
    { cityId: 385, city: 'Tomohon' },
  ],
  'Sumatera Utara': [{ cityId: 51, city: 'Medan' }],
  'Kepulauan Riau': [{ cityId: 153, city: 'Batam' }],
  'Kalimantan Timur': [{ cityId: 363, city: 'Balikpapan' }],
  'Jawa Timur': [{ cityId: 265, city: 'Surabaya' }],
  'DI Yogyakarta': [{ cityId: 227, city: 'Yogyakarta' }],
  Papua: [{ cityId: 514, city: 'Sorong' }],
};

/**
 * Alias "Jabodetabek" tidak ada di Dealls sebagai satu entri, jadi dijapidkan
 * ke gabungan kota Jabodetabek yang memang terdata.
 */
const JABODETABEK_CITY_IDS = [
  49180, 156, 157, 158, 159, 160, 181, 185, 269, 272, 273,
];

/** Nama provinsi project yang tidak punya satu pun lowongan Dealls. */
export const DEALLS_UNSUPPORTED = new Set([
  'Sumatera Barat',
  'Sumatera Selatan',
  'Bengkulu',
  'Jambi',
  'Lampung',
  'Riau',
  'Kalimantan Tengah',
  'Kalimantan Utara',
  'Sulawesi Tenggara',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Maluku',
  'Maluku Utara',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
]);

/** Alias dan label besar yang tidak bisa dipakai di Dealls maupun Glints. */
const NON_INDONESIA_LOCATIONS = new Set([
  'Singapore',
  'Malaysia',
  'Australia',
  'New Zealand',
  'Japan',
  'South Korea',
  'Taiwan',
  'Hong Kong',
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'Netherlands',
  'Switzerland',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Remote Global',
  'Jawa-Bali',
  'Sumatera',
  'Kalimantan',
  'Sulawesi',
  'Nusa Tenggara',
]);

/**
 * Padanan nama lokasi project ke nilai `location.region` milik Glints.
 * Glints mengembalikan nama provinsi apa adanya, jadi pencocokannya
 * dilakukan di backend setelah satu panggilan nasional.
 */
export const GLINTS_REGION_ALIASES: Record<string, string[]> = {
  'DKI Jakarta': ['DKI Jakarta', 'Jakarta'],
  'DI Yogyakarta': ['DI Yogyakarta', 'Yogyakarta', 'DI Yogya'],
  'Jawa Barat': ['Jawa Barat', 'West Java'],
  'Jawa Tengah': ['Jawa Tengah', 'Central Java'],
  'Jawa Timur': ['Jawa Timur', 'East Java'],
  'Bali': ['Bali'],
  'Banten': ['Banten'],
  'Aceh': ['Aceh'],
  'Sumatera Utara': ['Sumatera Utara', 'North Sumatra'],
  'Kalimantan Barat': ['Kalimantan Barat', 'West Kalimantan'],
  'Kalimantan Selatan': ['Kalimantan Selatan', 'South Kalimantan'],
  'Kalimantan Timur': ['Kalimantan Timur', 'East Kalimantan'],
  'Sulawesi Utara': ['Sulawesi Utara', 'North Sulawesi'],
  'Sulawesi Selatan': ['Sulawesi Selatan', 'South Sulawesi'],
  'Sulawesi Tengah': ['Sulawesi Tengah', 'Central Sulawesi'],
  'Papua': ['Papua'],
};

/**
 * Bersihkan nama lokasi sebelum dicocokkan ke peta.
 * Hanya merapikan spasi, TIDAK mengganti nama provinsi, karena kunci peta
 * memakai nama persis seperti di daftar lokasi project ("DKI Jakarta").
 */
function normalizeProvince(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Kota Dealls untuk satu lokasi project.
 * Mengembalikan array kosong kalau lokasi tidak punya coverage Dealls.
 */
export function getDeallsCities(location: string): { cityId: number; city: string }[] {
  const loc = location.trim();

  if (loc === 'Jabodetabek') {
    const seen = new Set<number>();
    const all = JABODETABEK_CITY_IDS.map((cityId) => {
      for (const cities of Object.values(DEALLS_PROVINCE_CITIES)) {
        const hit = cities.find((c) => c.cityId === cityId);
        if (hit) return hit;
      }
      return { cityId, city: `city ${cityId}` };
    });
    return all.filter((c) => (seen.has(c.cityId) ? false : (seen.add(c.cityId), true)));
  }

  if (NON_INDONESIA_LOCATIONS.has(loc)) return [];
  if (loc === 'Indonesia') {
    return Object.values(DEALLS_PROVINCE_CITIES).flat();
  }
  if (loc === 'Remote Indonesia') return [];

  return DEALLS_PROVINCE_CITIES[normalizeProvince(loc)] ?? [];
}

/** True kalau lokasi punya coverage Dealls. */
export function deallsSupports(location: string): boolean {
  return getDeallsCities(location).length > 0;
}

/** True kalau lokasi punya coverage Glints (nama provinsi Indonesia). */
export function glintsSupports(location: string): boolean {
  const loc = location.trim();
  if (NON_INDONESIA_LOCATIONS.has(loc)) return false;
  if (loc === 'Indonesia' || loc === 'Remote Indonesia') return true;
  return (GLINTS_REGION_ALIASES[normalizeProvince(loc)]?.length ?? 0) > 0;
}

/** Portal yang menerima nama lokasi sebagai teks. */
export function portalSupportsLocation(portal: Portal, location: string): boolean {
  if (portal === 'dealls') return deallsSupports(location);
  if (portal === 'glints') return glintsSupports(location);
  return true;
}

export interface CreditLine {
  portal: Portal;
  location: string;
  /** Label yang ditampilkan ke user, mis. "Jawa Barat (12 kota)". */
  label: string;
  credits: number;
  /** Untuk Dealls: daftar kota yang akan dipanggil satu per satu. */
  deallsCities?: { cityId: number; city: string }[];
}

export interface CreditEstimate {
  lines: CreditLine[];
  total: number;
  warnings: string[];
  blocking: string[];
}

/**
 * Hitung jumlah credit sebelum scraping dimulai.
 *
 * Aturan:
 *  - LinkedIn / Indeed / Jobstreet : 1 credit per lokasi (1 halaman).
 *  - Dealls  : 1 credit per KOTA. API menolak multi-kota dalam satu panggilan,
 *              jadi tiap kota butuh panggilan sendiri.
 *  - Glints  : 1 credit flat per sesi. Panggilan-nya nasional (`country=ID`),
 *              lokasi hanya dipakai memfilter hasil di backend. Satu panggilan
 *              sudah mencakup semua lokasi yang dipilih.
 */
export function estimateCredits(portals: Portal[], locations: string[]): CreditEstimate {
  const lines: CreditLine[] = [];
  const warnings: string[] = [];
  const blocking: string[] = [];
  const unsupportedDealls: string[] = [];
  const unsupportedGlints: string[] = [];
  let glintsCounted = false;

  for (const portal of portals) {
    if (portal === 'glints') {
      // Flat: cukup satu panggilan untuk seluruh lokasi.
      const covered = locations.filter(glintsSupports);
      const dropped = locations.filter((l) => !glintsSupports(l));
      if (dropped.length > 0) unsupportedGlints.push(...dropped);
      if (covered.length > 0) {
        lines.push({
          portal,
          location: covered.join(', '),
          label: `Glints nasional, difilter ke ${covered.length} lokasi`,
          credits: 1,
        });
        glintsCounted = true;
      }
      continue;
    }

    for (const location of locations) {
      if (portal === 'dealls') {
        const cities = getDeallsCities(location);
        if (cities.length === 0) {
          unsupportedDealls.push(location);
          continue;
        }
        lines.push({
          portal,
          location,
          label: `${location} (${cities.length} kota)`,
          credits: cities.length,
          deallsCities: cities,
        });
        continue;
      }

      lines.push({
        portal,
        location,
        label: location,
        credits: 1,
      });
    }
  }

  if (unsupportedDealls.length > 0) {
    warnings.push(
      `Dealls tidak punya lowongan di: ${[...new Set(unsupportedDealls)].join(', ')}. Lokasi tersebut dilewati.`
    );
  }
  if (unsupportedGlints.length > 0) {
    warnings.push(
      `Glints hanya mencakup Indonesia, dilewati untuk: ${[...new Set(unsupportedGlints)].join(', ')}.`
    );
  }
  if (glintsCounted && locations.length > 1) {
    warnings.push(
      'Glints tidak bisa difilter per kota lewat API, jadi semua lokasi yang dipilih diproses dalam 1 panggilan dan hanya memakan 1 credit.'
    );
  }

  if (lines.length === 0) {
    blocking.push('Tidak ada kombinasi portal dan lokasi yang didukung.');
  }

  const total = lines.reduce((sum, l) => sum + l.credits, 0);

  return { lines, total, warnings, blocking };
}