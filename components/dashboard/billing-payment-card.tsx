'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

interface BillingPaymentCardProps {
  userEmail: string;
}

type PlanOption = 'pro_1' | 'pro_3' | 'vip_1' | 'vip_3';

export function BillingPaymentCard({ userEmail }: BillingPaymentCardProps) {
  const [method, setMethod] = useState<'bca' | 'qris'>('bca');
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('pro_1');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const bcaNumber = '1040669015';
  const bcaName = 'YUSUF WIBISONO';

  const planDetails = {
    pro_1: { name: 'PRO', duration: '1 Bulan', priceStr: 'Rp 49.000', description: 'Akses 30 Hari' },
    pro_3: { name: 'PRO', duration: '3 Bulan', priceStr: 'Rp 129.000', description: 'Akses 90 Hari (Lebih Hemat)' },
    vip_1: { name: 'VIP', duration: '1 Bulan', priceStr: 'Rp 99.000', description: 'Akses 30 Hari' },
    vip_3: { name: 'VIP', duration: '3 Bulan', priceStr: 'Rp 249.000', description: 'Akses 90 Hari (Lebih Hemat)' },
  };

  const currentPlan = planDetails[selectedPlan];

  const handleCopyBca = () => {
    navigator.clipboard.writeText(bcaNumber);
    setCopied(true);
    showToast('Nomor rekening BCA berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const waMessage = encodeURIComponent(
    `Halo Mas Yusuf, saya ingin konfirmasi pembayaran paket ${currentPlan.name} Job Hunting OS untuk ${currentPlan.duration} (${currentPlan.priceStr}).\n\nEmail Akun: ${userEmail}\nMetode: ${
      method === 'bca' ? 'Transfer BCA' : 'QRIS'
    }\n\nBerikut saya lampirkan bukti transfer pembayarannya. Mohon bantuannya untuk aktivasi. Terima kasih!`
  );

  const waLink = `https://wa.me/6289617581900?text=${waMessage}`;

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <span className="inline-block rounded-sm bg-[#C1EF7B] border border-[#a5df48] px-3 py-1 font-mono text-xs text-[#0C0B1E] font-semibold mb-2">
            PILIH PAKET LANGGANAN
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--card-foreground)]">Upgrade Akun Anda</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Dapatkan kuota scraping & AI ekstra besar untuk mencari kerja secara intensif
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Kolom Kiri: Pilihan Paket & Keuntungan */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan('pro_1')}
              className={`p-3 text-left border rounded-sm transition-all ${
                selectedPlan === 'pro_1' ? 'border-[#a5df48] bg-[#C1EF7B]/10 ring-1 ring-[#a5df48]' : 'border-[var(--border)] hover:border-zinc-400'
              }`}
            >
              <div className="text-xs font-bold text-[#0C0B1E] mb-1">PRO (1 Bulan)</div>
              <div className="text-sm font-extrabold text-[#0C0B1E]">Rp 49.000</div>
            </button>
            <button
              onClick={() => setSelectedPlan('pro_3')}
              className={`p-3 text-left border rounded-sm transition-all ${
                selectedPlan === 'pro_3' ? 'border-[#a5df48] bg-[#C1EF7B]/10 ring-1 ring-[#a5df48]' : 'border-[var(--border)] hover:border-zinc-400'
              }`}
            >
              <div className="text-xs font-bold text-[#0C0B1E] mb-1">PRO (3 Bulan)</div>
              <div className="text-sm font-extrabold text-[#0C0B1E]">Rp 129.000</div>
              <div className="text-[10px] text-green-600 font-bold mt-0.5">Diskon Hemat!</div>
            </button>
            <button
              onClick={() => setSelectedPlan('vip_1')}
              className={`p-3 text-left border rounded-sm transition-all ${
                selectedPlan === 'vip_1' ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-400' : 'border-[var(--border)] hover:border-zinc-400'
              }`}
            >
              <div className="text-xs font-bold text-[#0C0B1E] mb-1">VIP (1 Bulan)</div>
              <div className="text-sm font-extrabold text-[#0C0B1E]">Rp 99.000</div>
            </button>
            <button
              onClick={() => setSelectedPlan('vip_3')}
              className={`p-3 text-left border rounded-sm transition-all ${
                selectedPlan === 'vip_3' ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-400' : 'border-[var(--border)] hover:border-zinc-400'
              }`}
            >
              <div className="text-xs font-bold text-[#0C0B1E] mb-1">VIP (3 Bulan)</div>
              <div className="text-sm font-extrabold text-[#0C0B1E]">Rp 249.000</div>
              <div className="text-[10px] text-purple-600 font-bold mt-0.5">Diskon Hemat!</div>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-[var(--card-foreground)]">
              Keuntungan Paket {selectedPlan.startsWith('pro') ? 'PRO' : 'VIP'}:
            </h3>
            {selectedPlan.startsWith('pro') ? (
              <ul className="space-y-2.5 font-mono text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0C0B1E] font-bold mt-0.5">✓</span>
                  <span><strong>AI Kuota: 30x / hari</strong> (Parse CV, Cover Letter, Email, Match Score)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0C0B1E] font-bold mt-0.5">✓</span>
                  <span><strong>Scraping Kuota: 10x / hari</strong> (LinkedIn, Jobstreet, Indeed, Glints, Dealls)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0C0B1E] font-bold mt-0.5">✓</span>
                  <span>Simpan lowongan tanpa batas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0C0B1E] font-bold mt-0.5">✓</span>
                  <span>Auto-scraping jadwal harian aktif</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2.5 font-mono text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-0.5">✓</span>
                  <span><strong>AI Kuota: 100x / hari</strong> (Cocok untuk pelamar agresif mass-apply)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-0.5">✓</span>
                  <span><strong>Scraping Kuota: 25x / hari</strong> (Pantau ratusan loker setiap hari di semua portal)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-0.5">✓</span>
                  <span>Semua fitur PRO termasuk</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-0.5">✓</span>
                  <span>Prioritas dukungan & antrean cron otomatis</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pilihan Metode Pembayaran */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('bca')}
              className={`flex-1 rounded-sm border py-2 px-3 text-xs font-mono font-medium transition-all ${
                method === 'bca'
                  ? 'border-[#a5df48] bg-[#C1EF7B] text-[#0C0B1E] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--card)] text-zinc-500 hover:bg-[var(--muted)]'
              }`}
            >
              Transfer Bank BCA
            </button>
            <button
              type="button"
              onClick={() => setMethod('qris')}
              className={`flex-1 rounded-sm border py-2 px-3 text-xs font-mono font-medium transition-all ${
                method === 'qris'
                  ? 'border-[#a5df48] bg-[#C1EF7B] text-[#0C0B1E] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--card)] text-zinc-500 hover:bg-[var(--muted)]'
              }`}
            >
              Scan QRIS (Semua E-Wallet)
            </button>
          </div>

          {method === 'bca' ? (
            <div className="rounded-sm border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 uppercase">Bank BCA</span>
                <span className="rounded-sm bg-[#F1F0FF] border border-[#C1EF7B] px-2 py-0.5 text-[10px] font-mono text-[#0C0B1E]">
                  Transfer Antarbank / BCA
                </span>
              </div>

              <div>
                <div className="text-xs text-zinc-500 mb-1">Nomor Rekening:</div>
                <div className="flex items-center justify-between gap-2 rounded-sm bg-[var(--muted)] border border-[var(--border)] px-3.5 py-2.5">
                  <span className="text-lg font-mono font-bold tracking-wider text-[#0C0B1E]">
                    {bcaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBca}
                    className="rounded-sm bg-[#C1EF7B] hover:bg-[#a5df48] px-3 py-1 text-xs font-mono text-[#0C0B1E] font-semibold transition-colors"
                  >
                    {copied ? '✓ Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-500 mb-0.5">Atas Nama:</div>
                <div className="text-sm font-semibold text-[#0C0B1E]">{bcaName}</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500 mb-0.5">Nominal Transfer:</div>
                <div className="text-base font-bold text-[#0C0B1E]">{currentPlan.priceStr}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 text-center">
              <div className="flex items-center justify-between text-left">
                <span className="text-xs font-mono text-zinc-500 uppercase">QRIS Pembayaran</span>
                <span className="rounded-sm bg-[#F1F0FF] border border-[#C1EF7B] px-2 py-0.5 text-[10px] font-mono text-[#0C0B1E]">
                  BCA, GoPay, OVO, Dana, ShopeePay
                </span>
              </div>

              <div className="mx-auto w-full max-w-[240px] aspect-square rounded-sm border border-[var(--border)] bg-white p-2.5 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src="/qris.webp"
                  alt="QRIS Pembayaran Job Hunting OS"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.endsWith('/qris.webp')) {
                      target.src = '/qris.png';
                      return;
                    }
                    if (target.src.endsWith('/qris.png')) {
                      target.src = '/qris.jpg';
                      return;
                    }
                    if (target.src.endsWith('/qris.jpg')) {
                      target.src = '/qris.jpeg';
                      return;
                    }
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.qris-fallback')) {
                      const div = document.createElement('div');
                      div.className = 'qris-fallback text-zinc-800 text-xs p-3 text-center';
                      div.innerHTML = '<strong>QRIS Siap</strong><br/><span style="font-size:10px; color:#555;">Simpan file QRIS Anda di<br/><code>public/qris.webp</code> atau <code>public/qris.png</code></span>';
                      parent.appendChild(div);
                    }
                  }}
                />
              </div>

              <div className="text-xs text-zinc-500">
                Pindai kode QRIS di atas dengan aplikasi m-Banking atau E-Wallet apa saja.
              </div>

              <div className="text-sm font-semibold text-[#0C0B1E]">
                Nominal: <span className="text-[#0C0B1E] font-bold">{currentPlan.priceStr}</span>
              </div>
            </div>
          )}

          {/* Tombol Konfirmasi WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-sm bg-[#C1EF7B] hover:bg-[#a5df48] text-[#0C0B1E] font-semibold py-3.5 px-4 text-sm transition-all border border-[#a5df48] hover:scale-[1.01] active:scale-[0.99]"
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
