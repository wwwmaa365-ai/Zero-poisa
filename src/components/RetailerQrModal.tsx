import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { PlatformSettings, Product, RetailerProfile } from '../types';
import { ZERO_POISA_LOGO } from '../lib/seedData';
import {
  X,
  Download,
  Copy,
  Check,
  Printer,
  QrCode,
  FileImage,
  ExternalLink,
} from 'lucide-react';

interface RetailerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailer: RetailerProfile | null;
  settings: PlatformSettings;
  products: Product[];
  initialProductId?: string;
  onOpenPreview?: (retailerId: string, productId: string) => void;
}

export const RetailerQrModal: React.FC<RetailerQrModalProps> = ({
  isOpen,
  onClose,
  retailer,
  settings,
  products,
  initialProductId = '',
  onOpenPreview,
}) => {
  const [selectedProdId, setSelectedProdId] = useState<string>(initialProductId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedProdId(initialProductId);
  }, [initialProductId, isOpen]);

  const activeProducts = products.filter((p) => p.active);
  const selectedProduct = selectedProdId
    ? activeProducts.find((p) => p.productId === selectedProdId) || null
    : null;

  const referralUrl = retailer
    ? selectedProdId
      ? `https://${settings.domain}/ref/${retailer.retailerId}?product=${encodeURIComponent(
          selectedProdId
        )}`
      : `https://${settings.domain}/ref/${retailer.retailerId}`
    : '';

  useEffect(() => {
    if (!isOpen || !referralUrl) return;
    let cancelled = false;

    QRCode.toDataURL(referralUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, referralUrl]);

  if (!isOpen || !retailer) return null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      // Fallback ignored if clipboard blocked in iframe
    }
    setCopied(true);
    showToast('Referral link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const suffix = selectedProdId ? `_${selectedProdId}` : '';
    link.download = `${settings.platformName.replace(/\s+/g, '-')}-QR-${retailer.retailerId}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('High-resolution QR PNG downloaded.');
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Generate a high-resolution 1080x1440 branded print-ready shop standee PNG
  const handleDownloadPrintablePoster = async () => {
    if (!qrDataUrl) return;
    setDownloadingPoster(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // White card base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 1440);

      // Top royal-blue header gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 320);
      grad.addColorStop(0, '#0e54b7');
      grad.addColorStop(1, '#0a3d8f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 320);

      // Emerald accent strip below header
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 320, 1080, 14);

      // Draw Zero Poisa logo
      try {
        const logoImg = await loadImage(ZERO_POISA_LOGO);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(84, 72, 148, 148, 30);
        ctx.clip();
        ctx.drawImage(logoImg, 84, 72, 148, 148);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(84, 72, 148, 148, 30);
        ctx.stroke();
      } catch {
        // Proceed cleanly even if logo fails to draw on canvas
      }

      // Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(settings.platformName, 264, 142);

      ctx.fillStyle = '#bfdbfe';
      ctx.font = '600 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('Instant Loans · Credit Cards · Zero-Balance Accounts', 264, 198);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '600 26px monospace';
      ctx.fillText(`Verified Partner Desk · ${settings.domain}`, 264, 248);

      // Scan headline
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        selectedProduct ? selectedProduct.title.slice(0, 36) : 'SCAN QR TO APPLY ONLINE',
        540,
        420
      );

      ctx.fillStyle = '#475569';
      ctx.font = '500 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        selectedProduct
          ? `Category: ${selectedProduct.category} · 100% Digital Paperless Process`
          : 'Scan with Google Lens or Phone Camera · 100% Digital KYC',
        540,
        468
      );

      // QR frame box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(230, 515, 620, 620, 36);
      ctx.fill();
      ctx.stroke();

      // Draw crisp QR image inside frame
      const qrImg = await loadImage(qrDataUrl);
      ctx.drawImage(qrImg, 270, 555, 540, 540);

      // Partner Attribution Banner
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(100, 1185, 880, 140, 24);
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(
        `AUTHORIZED PARTNER: ${retailer.name.toUpperCase()} (${retailer.retailerId})`,
        540,
        1242
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 24px monospace';
      ctx.fillText(referralUrl.slice(0, 62), 540, 1292);

      // Footer notice
      ctx.fillStyle = '#64748b';
      ctx.font = '500 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `Powered by ${settings.platformName} (${settings.domain}) · Mobile OTP Consent Required`,
        540,
        1388
      );

      const posterUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = posterUrl;
      const suffix = selectedProdId ? `_${selectedProdId}` : '';
      link.download = `${settings.platformName.replace(/\s+/g, '-')}-Printable-Poster-${retailer.retailerId}${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Print-ready shop poster PNG downloaded.');
    } catch {
      handleDownloadQrPng();
    } finally {
      setDownloadingPoster(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`QR Code for ${retailer.name}`}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0e54b7] to-[#0a3d8f] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={ZERO_POISA_LOGO}
              alt="Zero Poisa Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-white/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">
                {settings.platformName} · Offline Referral QR
              </div>
              <div className="text-xs text-blue-100 font-mono truncate">
                {retailer.name} · ID: {retailer.retailerId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Code modal"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {feedbackMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3.5 py-2.5 text-xs font-medium">
              {feedbackMsg}
            </div>
          )}

          {/* Target Link Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Choose QR Destination (Master Link or Specific Product)
            </label>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1363d1]"
            >
              <option value="">
                All Products — Master Retailer Link (/ref/{retailer.retailerId})
              </option>
              {activeProducts.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.category}: {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Printable Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center space-y-3.5">
            <div className="text-xs font-semibold text-slate-600">
              {selectedProduct
                ? `${selectedProduct.category} · ${selectedProduct.title}`
                : 'Scan with Phone Camera to Explore Offers & Apply'}
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${referralUrl}`}
                  className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-1 max-w-full">
              <div className="text-xs font-bold text-slate-900">
                {retailer.name} ·{' '}
                <span className="font-mono text-emerald-700">{retailer.retailerId}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 break-all px-2">
                {referralUrl}
              </div>
            </div>
          </div>

          {/* Primary Download & Print Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPrintablePoster}
              disabled={!qrDataUrl || downloadingPoster}
              className="min-h-[44px] px-4 py-2.5 bg-[#1363d1] hover:bg-[#0e54b7] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <FileImage className="w-4 h-4 shrink-0" />
              <span>
                {downloadingPoster ? 'Generating Poster...' : 'Download Print Poster'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              disabled={!qrDataUrl}
              className="min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download QR (PNG)</span>
            </button>
          </div>

          {/* Secondary Utility Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee</span>
            </button>

            {onOpenPreview && (
              <button
                type="button"
                onClick={() => {
                  onOpenPreview(
                    retailer.retailerId,
                    selectedProdId || activeProducts[0]?.productId || 'PROD_LOAN_01'
                  );
                  onClose();
                }}
                className="col-span-2 sm:col-span-1 min-h-[40px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
