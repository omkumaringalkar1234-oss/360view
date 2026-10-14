import { useState, useEffect } from 'react';
import type { Tour, TourSettings } from '@/types';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Sliders, Eye, Globe, Lock, Shield, RotateCw, Palette, Image as ImageIcon } from 'lucide-react';

interface TourSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  onSave: (tourData: Partial<Tour>) => Promise<void>;
}

export function TourSettingsModal({
  isOpen,
  onClose,
  tour,
  onSave,
}: TourSettingsModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Tour['visibility']>('public');
  const [settings, setSettings] = useState<TourSettings>({
    autoRotate: false,
    autoRotateSpeed: 0.5,
    showThumbnails: true,
    showSceneTitles: true,
    showCompass: true,
    showZoomControls: true,
    showFullscreenButton: true,
    showShareButton: true,
    showQRCode: true,
    defaultZoom: 1,
    maxZoom: 3,
    minZoom: 0.3,
    backgroundColor: '#020617',
    hotspotColor: '#22c55e',
    hotspotSize: 1,
    logoUrl: null,
    brandName: null,
    introScreen: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tour) {
      setTitle(tour.title || '');
      setDescription(tour.description || '');
      setVisibility(tour.visibility || 'public');
      if (tour.settings) {
        setSettings({ ...settings, ...tour.settings });
      }
    }
  }, [tour, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        title,
        description,
        visibility,
        settings,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tour Settings & Branding"
      description="Configure accessibility, navigation controls, and branding"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Tour Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Waterfront Villa 360 Walkthrough"
            required
          />

          <Textarea
            label="Tour Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell prospective visitors about this space..."
            rows={2}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
            Visibility & Access
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'public', label: 'Public', desc: 'Indexed & viewable by everyone', icon: Globe },
              { id: 'unlisted', label: 'Unlisted', desc: 'Accessible via direct link only', icon: Eye },
              { id: 'private', label: 'Private', desc: 'Visible only to you when logged in', icon: Lock },
            ].map((v) => {
              const Icon = v.icon;
              const isSelected = visibility === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id as Tour['visibility'])}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-lg'
                      : 'bg-dark-900 border-dark-800 text-dark-400 hover:text-white hover:border-dark-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-primary-400' : 'text-dark-500'}`} />
                  <p className="text-xs font-semibold text-white">{v.label}</p>
                  <p className="text-[10px] text-dark-400 leading-tight mt-0.5">{v.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4 pt-4 border-t border-dark-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-400">
            Custom Branding & Watermark
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name"
              value={settings.brandName || ''}
              onChange={(e) => setSettings({ ...settings, brandName: e.target.value || null })}
              placeholder="e.g. Summit Architecture"
            />
            <Input
              label="Logo URL"
              value={settings.logoUrl || ''}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        {/* 360 Controls & Features */}
        <div className="space-y-4 pt-4 border-t border-dark-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-400">
            Viewer Interactivity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'autoRotate', label: 'Auto-Rotate on Load', desc: 'Gently spins camera' },
              { key: 'showCompass', label: 'Heading Compass', desc: 'Displays orientation indicator' },
              { key: 'showThumbnails', label: 'Scene Filmstrip', desc: 'Bottom thumbnail tray' },
              { key: 'showShareButton', label: 'Share & Embed Button', desc: 'Allows viewers to copy link' },
              { key: 'showZoomControls', label: 'Zoom Buttons', desc: 'Floating +/- zoom controls' },
              { key: 'showFullscreenButton', label: 'Fullscreen Toggle', desc: 'Immersive browser view' },
            ].map((feature) => (
              <label
                key={feature.key}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-800 cursor-pointer hover:border-dark-700 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-white">{feature.label}</p>
                  <p className="text-[11px] text-dark-400">{feature.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)[feature.key])}
                  onChange={(e) => setSettings({ ...settings, [feature.key]: e.target.checked })}
                  className="h-4 w-4 rounded border-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Hotspot Default Color */}
        <div className="pt-4 border-t border-dark-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Default Hotspot Color</p>
            <p className="text-[11px] text-dark-400">Color applied to newly created hotspot markers</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.hotspotColor || '#22c55e'}
              onChange={(e) => setSettings({ ...settings, hotspotColor: e.target.value })}
              className="w-10 h-8 rounded-lg bg-dark-900 border border-dark-700 cursor-pointer p-0.5"
            />
            <span className="font-mono text-xs text-dark-300">{settings.hotspotColor}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-dark-800">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            Save Tour Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
}
