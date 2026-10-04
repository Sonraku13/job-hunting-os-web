'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface BillingPaymentCardProps {
  userEmail: string;
}

export function BillingPaymentCard({ userEmail }: BillingPaymentCardProps) {
  const [method, setMethod] = useState<'bca' | 'qris'>('bca');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const bcaNumber = '1040669015';
  const bcaName = 'YUSUF WIBISONO';
  const price = 'Rp 25.000';

  const handleCopyBca = () => {
    navigator.clipboard.writeText(bcaNumber);
    setCopied(true);
    showToast('Nomor rekening BCA berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const waMessage = encodeURIComponent(
    `Halo Mas Yusuf, saya ingin konfirmasi pembayaran paket PAID Job Hunting OS (${price}/bulan).\n\nEmail Akun: ${userEmail}\nMetode: ${
      method === 'bca' ? 'Transfer BCA' : 'QRIS'
    }\n\nBerikut saya lampirkan bukti transfer pembayarannya. Mohon bantuannya untuk aktivasi. Terima kasih!`
  );

  const waLink = `https://wa.me/6289617581900?text=${waMessage}`;

  return (
    <Card className="border-emerald-900/50 bg-gradient-to-b from-zinc-950 to-zinc-900/80">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="inline-block rounded-full bg-emerald-950 border border-emerald-700/80 px-3 py-1 font-mono text-xs text-emerald-400 font-semibold mb-2">
            PRO PLAN • UNLIMITED PRODUCTIVITY
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Upgrade ke Paket Pro</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Dapatkan kuota scraping & AI ekstra besar untuk mencari kerja secara intensif
          </p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-3xl font-extrabold text-emerald-400">{price}</div>
          <div className="text-xs text-zinc-500 font-mono">/ bulan (akses 30 hari)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Kolom Kiri: Keuntungan Paket */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-zinc-200">Keuntungan Paket Pro:</h3>
          <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>AI Kuota:</strong> 100x / hari (Match Score, Cover Letter, Email)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Scraping Kuota:</strong> 50x / hari (LinkedIn & Jobstreet)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Bisa pantau semua portal lowongan tanpa batas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Auto-scraping harian via Cron scheduler aktif</span>
            </li>
          </ul>

          <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3.5 mt-4">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Alur Pembayaran:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-400 font-mono">
              <li>Pilih transfer BCA atau scan QRIS</li>
              <li>Lakukan pembayaran sebesar <strong>{price}</strong></li>
              <li>Klik tombol konfirmasi WhatsApp di bawah</li>
              <li>Kirim bukti transfer, akun akan diaktifkan dalam hitungan menit</li>
            </ol>
          </div>
        </div>

        {/* Kolom Kanan: Pilihan Metode Pembayaran */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('bca')}
              className={`flex-1 rounded-lg border py-2 px-3 text-xs font-mono font-medium transition-all ${
                method === 'bca'
                  ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 shadow-sm'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Transfer Bank BCA
            </button>
            <button
              type="button"
              onClick={() => setMethod('qris')}
              className={`flex-1 rounded-lg border py-2 px-3 text-xs font-mono font-medium transition-all ${
                method === 'qris'
                  ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 shadow-sm'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Scan QRIS (Semua E-Wallet)
            </button>
          </div>

          {method === 'bca' ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase">Bank BCA</span>
                <span className="rounded bg-blue-950/80 border border-blue-800 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                  Transfer Antarbank / BCA
                </span>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Nomor Rekening:</div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2.5">
                  <span className="text-lg font-mono font-bold tracking-wider text-zinc-100">
                    {bcaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBca}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-mono text-zinc-200 transition-colors"
                  >
                    {copied ? '✓ Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-0.5">Atas Nama:</div>
                <div className="text-sm font-semibold text-zinc-200">{bcaName}</div>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-0.5">Nominal Transfer:</div>
                <div className="text-base font-bold text-emerald-400">{price}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 text-center">
              <div className="flex items-center justify-between text-left">
                <span className="text-xs font-mono text-zinc-400 uppercase">QRIS Pembayaran</span>
                <span className="rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                  BCA, GoPay, OVO, Dana, ShopeePay
                </span>
              </div>

              <div className="mx-auto w-full max-w-[240px] aspect-square rounded-lg border border-zinc-800 bg-white p-2.5 flex items-center justify-center overflow-hidden shadow-md">
                {/* Gambar QRIS dari folder public/qris.png */}
                <img
                  src="/qris.png"
                  alt="QRIS Pembayaran Job Hunting OS"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback jika file qris.png belum dimasukkan user
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.qris-fallback')) {
                      const div = document.createElement('div');
                      div.className = 'qris-fallback text-zinc-800 text-xs p-3 text-center';
                      div.innerHTML = '<strong>QRIS Siap</strong><br/><span style="font-size:10px; color:#555;">Simpan file QRIS Anda sebagai<br/><code>public/qris.png</code></span>';
                      parent.appendChild(div);
                    }
                  }}
                />
              </div>

              <div className="text-xs text-zinc-400">
                Pindai kode QRIS di atas dengan aplikasi m-Banking atau E-Wallet apa saja.
              </div>

              <div className="text-sm font-semibold text-zinc-200">
                Nominal: <span className="text-emerald-400 font-bold">{price}</span>
              </div>
            </div>
          )}

          {/* Tombol Konfirmasi WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-4 text-sm transition-all shadow-lg shadow-emerald-950/50 hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.507 14.307l-.009.075c-.301-.15-1.782-.879-2.057-.979-.275-.1-.475-.15-.675.15-.2.3-.775.979-.95 1.179-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.41-1.486-.891-.795-1.492-1.777-1.667-2.077-.175-.3-.019-.462.131-.611.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.585-.492-.505-.675-.514-.175-.009-.375-.009-.575-.009s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.899 1.225 3.1c.15.2 2.115 3.23 5.124 4.53 1.956.845 2.721.848 3.693.704.593-.088 1.782-.729 2.032-1.433.25-.704.25-1.309.175-1.433-.075-.125-.275-.2-.575-.35zm-5.467 7.693c-1.922 0-3.805-.516-5.456-1.493l-.391-.232-4.053 1.063 1.082-3.951-.254-.405c-1.072-1.708-1.638-3.689-1.638-5.719 0-5.918 4.814-10.732 10.735-10.732 2.868 0 5.564 1.116 7.59 3.142 2.025 2.026 3.141 4.723 3.141 7.59 0 5.919-4.815 10.737-10.736 10.737zm8.397-19.129c-2.243-2.243-5.225-3.478-8.397-3.478-6.541 0-11.863 5.322-11.863 11.864 0 2.091.547 4.133 1.586 5.932l-1.685 6.155 6.297-1.652c1.734.945 3.691 1.443 5.688 1.443 6.542 0 11.864-5.322 11.864-11.864 0-3.172-1.236-6.154-3.479-8.396z" />
            </svg>
            <span>Konfirmasi Pembayaran via WhatsApp</span>
          </a>
          <p className="text-[11px] text-zinc-500 text-center font-mono">
            Nomor Admin: 0896-1758-1900 (Yusuf Wibisono)
          </p>
        </div>
      </div>
    </Card>
  );
}
