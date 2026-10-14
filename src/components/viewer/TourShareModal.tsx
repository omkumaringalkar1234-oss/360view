import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button, Input } from '@/components/ui';
import { Copy, Check, Code, QrCode, ExternalLink, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui';

interface TourShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle: string;
}

export function TourShareModal({
  isOpen,
  onClose,
  tourId,
  tourTitle,
}: TourShareModalProps) {
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const shareUrl = `${window.location.origin}/tour/${tourId}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" allow="fullscreen; accelerometer; gyroscope; magnetometer; vr" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    addToast({ type: 'success', title: 'Link Copied', message: 'Shareable tour URL copied to clipboard' });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    addToast({ type: 'success', title: 'Embed Code Copied', message: 'Responsive iframe code copied to clipboard' });
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Virtual Tour"
      description={`Share "${tourTitle}" with clients or embed on your website`}
      size="md"
    >
      <div className="space-y-6">
        {/* Direct Link */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400">
            Direct Link
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400">
              Embed on Website
            </label>
            <span className="text-[11px] text-dark-500">Responsive iframe</span>
          </div>
          <div className="relative rounded-xl bg-dark-900 border border-dark-800 p-3">
            <pre className="text-xs text-dark-300 font-mono overflow-x-auto whitespace-pre-wrap break-all pr-16 max-h-20">
              {embedCode}
            </pre>
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyEmbed}
                className="h-8 px-2.5 text-xs"
                leftIcon={copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
              >
                {copiedEmbed ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="space-y-3 pt-4 border-t border-dark-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400">
            <QrCode className="w-4 h-4 text-primary-400" />
            <span>Scan to View on Mobile / VR Headset</span>
          </div>
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
            <div className="p-2.5 bg-white rounded-xl shadow-lg flex-shrink-0">
              <QRCodeSVG
                value={shareUrl}
                size={110}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="space-y-1.5 text-xs text-dark-300">
              <p className="font-semibold text-white">Instant Mobile Viewing</p>
              <p className="text-dark-400 text-[11px] leading-relaxed">
                Scan with any smartphone camera to open the 360° virtual tour with gyroscope orientation support.
              </p>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300 font-medium pt-1"
              >
                <span>Open in new window</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
