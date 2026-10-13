/**
 * Batas harian panggilan Zapi.
 *
 * Kuota app (credit user) dan kuota Zapi (biaya kita) adalah dua hal
 * berbeda. Satu credit user = satu panggilan Zapi, jadi total panggilan
 * harian ~ jumlah credit semua user. Kalau jumlah itu melewati paket Zapi,
 * scraping berhenti total untuk semua orang, bukan cuma user yang bermasalah.
 *
 * Karena itu ada pengaman terpisah yang dihitung sebelum memanggil Zapi.
 */

/** Pagu keras. Naikkan hanya kalau kuota paket Zapi ikut dinaikkan. */
export const ZAPI_DAILY_CAP = Number(process.env.ZAPI_DAILY_CAP || 100);

/** ISO string untuk awal hari WIB (UTC+7), dipakai filter `created_at`. */
export function wibDayStartISO(now: Date = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  wib.setUTCHours(0, 0, 0, 0);
  return new Date(wib.getTime() - 7 * 60 * 60 * 1000).toISOString();
}

/** Sisa pagu.call dari jumlah pemakaian yang sudah dihitung pemanggil. */
export function remainingZapiCalls(usedToday: number, cap: number = ZAPI_DAILY_CAP): number {
  return Math.max(0, cap - usedToday);
}

export function isZapiCallAllowed(usedToday: number, cap: number = ZAPI_DAILY_CAP): boolean {
  return remainingZapiCalls(usedToday, cap) > 0;
}