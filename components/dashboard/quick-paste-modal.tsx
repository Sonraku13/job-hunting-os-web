'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/context';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobData: any) => void;
}

export function QuickPasteModal({ isOpen, onClose, onSuccess }: QuickPasteModalProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setText('');
    setSourceUrl('');
    setImage(null);
    setImagePreview(null);
    setError(null);
    setShowPreview(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB.');
        return;
      }
      setImage(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) {
      setError('Isi teks atau unggah gambar minimal salah satunya.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (sourceUrl.trim()) formData.append('sourceUrl', sourceUrl.trim());
      if (image) formData.append('image', image);

      const res = await fetch('/api/jobs/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses lowongan');
      }

      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageChange({ target: { files: [file] } } as any);
        }
        break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0B1E]/40" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#0C0B1E]">{t('qp_title')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-[#0C0B1E] transition-colors p-1"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Text Area */}
          <div>
            <label htmlFor="qp-text" className="block text-sm font-semibold text-zinc-800 mb-2">
              {t('qp_text_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="qp-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              placeholder={t('qp_text_placeholder')}
              className="w-full min-h-[140px] rounded-sm border border-zinc-300 bg-white px-4 py-3 font-mono text-sm text-[#0C0B1E] placeholder:text-zinc-500 focus:outline-none focus:border-[#C1EF7B] focus:ring-1 focus:ring-[#C1EF7B] resize-y transition-colors"
              rows={6}
            />
            <p className="mt-1 text-xs text-zinc-500 font-mono">{t('qp_text_hint')}</p>
          </div>

          {/* Source URL */}
          <div>
            <label htmlFor="qp-source" className="block text-sm font-semibold text-zinc-800 mb-2">
              {t('qp_source_label')}
            </label>
            <input
              id="qp-source"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={t('qp_source_placeholder')}
              className="w-full rounded-sm border border-zinc-300 bg-white px-4 py-2.5 font-mono text-sm text-[#0C0B1E] placeholder:text-zinc-500 focus:outline-none focus:border-[#C1EF7B] focus:ring-1 focus:ring-[#C1EF7B] transition-colors"
            />
            <p className="mt-1 text-xs text-zinc-500 font-mono">{t('qp_source_hint')}</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              {t('qp_image_label')}
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
                id="qp-image"
              />
              {imagePreview ? (
                <div className="relative rounded-sm border border-zinc-300 bg-white overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-60 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
                    aria-label="Hapus gambar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="qp-image"
                  className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-zinc-300 bg-white min-h-[140px] cursor-pointer transition-colors hover:border-[#C1EF7B] hover:bg-[#F1F0FF]"
                >
                  <svg
                    className="h-10 w-10 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-zinc-600 font-mono">{t('qp_image_hint')}</p>
                  <p className="text-xs text-zinc-500 font-mono">JPG, PNG, WebP · Maks 5MB</p>
                </label>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-sm bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 font-mono">
              {error}
            </div>
          )}

          {/* Preview Toggle */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full justify-start font-mono text-xs text-zinc-700 hover:text-[#0C0B1E]"
          >
            {showPreview ? 'Sembunyikan Pratinjau' : 'Pratinjau Hasil Ekstraksi'}
          </Button>

          {/* Preview Section */}
          {showPreview && (text || imagePreview) && (
            <div className="rounded-sm border border-zinc-200 bg-[#F1F0FF] p-4 space-y-3 font-mono text-xs">
              <div className="text-zinc-700 font-semibold">Pratinjau Data yang Akan Diekstrak:</div>
              {text && (
                <div>
                  <span className="text-zinc-500">Teks: </span>
                  <span className="text-[#0C0B1E]">{text.slice(0, 200)}{text.length > 200 ? '...' : ''}</span>
                </div>
              )}
              {sourceUrl && (
                <div>
                  <span className="text-zinc-500">Link Asal: </span>
                  <span className="text-[#C1EF7B]">{sourceUrl}</span>
                </div>
              )}
              {imagePreview && image && (
                <div>
                  <span className="text-zinc-500">Gambar: </span>
                  <span className="text-[#0C0B1E]">{image.name} ({Math.round(image.size / 1024)} KB)</span>
                </div>
              )}
              <p className="text-zinc-500 pt-2">
                AI akan mengekstrak: Posisi, Perusahaan, Lokasi, Tipe, Gaji, Deskripsi, Email, WhatsApp, Link Lamaran
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('qp_cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-[#0C0B1E] text-[#C1EF7B] font-bold hover:bg-[#1a1936]">
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('qp_processing')}
                </>
              ) : (
                t('qp_submit')
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}