/**
 * Daftar lokasi pencarian kerja standar untuk Indonesia (provinsi) & Luar Negeri (negara).
 * Digunakan di SettingsForm (multi-select) dan Manual Scrape Dialog.
 */

export const INDONESIAN_PROVINCES = [
  'Aceh',
  'Bali',
  'Bangka Belitung',
  'Banten',
  'Bengkulu',
  'DI Yogyakarta',
  'DKI Jakarta',
  'Gorontalo',
  'Jambi',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Kalimantan Barat',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Kepulauan Riau',
  'Lampung',
  'Maluku',
  'Maluku Utara',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
  'Riau',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Sulawesi Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Sumatera Utara',
];

// Tambahan alias populer
export const INDONESIA_ALIASES = [
  'Jabodetabek',
  'Jawa-Bali',
  'Sumatera',
  'Kalimantan',
  'Sulawesi',
  'Papua',
  'Maluku',
  'Nusa Tenggara',
  'Remote Indonesia',
];

export const OVERSEAS_COUNTRIES = [
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
];

// Gabungan untuk dropdown multi-select
export const ALL_LOCATION_OPTIONS = [
  { label: '🇮🇩 Indonesia (Semua Provinsi)', value: 'Indonesia', group: 'indonesia' },
  ...INDONESIAN_PROVINCES.map(p => ({ label: `🇮🇩 ${p}`, value: p, group: 'indonesia' })),
  ...INDONESIA_ALIASES.map(a => ({ label: `🇮🇩 ${a}`, value: a, group: 'indonesia' })),
  { label: '🌍 Luar Negeri (Negara)', value: 'Overseas', group: 'overseas', disabled: true },
  ...OVERSEAS_COUNTRIES.map(c => ({ label: `🌍 ${c}`, value: c, group: 'overseas' })),
];

// Helper untuk ambil value array dari string koma (format penyimpanan DB)
export function parseLocations(str: string): string[] {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// Helper untuk format array ke string koma (untuk input value)
export function formatLocations(arr: string[]): string {
  return arr.join(', ');
}