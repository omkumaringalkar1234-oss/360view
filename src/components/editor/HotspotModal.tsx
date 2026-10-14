import { useState, useEffect } from 'react';
import type { Hotspot, Scene } from '@/types';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Compass, Info, ArrowRight, Palette, Radio, Trash2, Link as LinkIcon } from 'lucide-react';

interface HotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hotspotData: Partial<Hotspot>) => Promise<void>;
  onDelete?: (hotspotId: string) => Promise<void>;
  hotspot: Partial<Hotspot> | null;
  scenes: Scene[];
  currentSceneId: string;
}

export function HotspotModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  hotspot,
  scenes,
  currentSceneId,
}: HotspotModalProps) {
  const [type, setType] = useState<'navigation' | 'info'>('navigation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationSceneId, setDestinationSceneId] = useState<string>('');
  const [color, setColor] = useState('#22c55e');
  const [pulse, setPulse] = useState(true);
  const [externalUrl, setExternalUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const availableDestinations = scenes.filter((s) => s.id !== currentSceneId);

  useEffect(() => {
    if (hotspot) {
      setType(hotspot.type || 'navigation');
      setTitle(hotspot.title || '');
      setDescription(hotspot.description || '');
      setDestinationSceneId(hotspot.destinationSceneId || (availableDestinations[0]?.id || ''));
      setColor(hotspot.style?.color || '#22c55e');
      setPulse(hotspot.style?.pulse ?? true);
      setExternalUrl(hotspot.externalUrl || '');
    } else {
      setType('navigation');
      setTitle('');
      setDescription('');
      setDestinationSceneId(availableDestinations[0]?.id || '');
      setColor('#22c55e');
      setPulse(true);
      setExternalUrl('');
    }
  }, [hotspot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        type,
        title: title || (type === 'navigation' ? 'Go to scene' : 'Information'),
        description,
        destinationSceneId: type === 'navigation' ? destinationSceneId : null,
        externalUrl: externalUrl || null,
        style: {
          size: 1,
          color,
          pulse,
          showArrow: type === 'navigation',
          arrowDirection: 'auto',
          customIcon: null,
          label: title || null,
          labelPosition: 'bottom',
          hoverScale: 1.2,
        },
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isExisting = Boolean(hotspot?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExisting ? 'Edit Hotspot' : 'Configure New Hotspot'}
      description="Interactive markers placed inside the 360° panorama"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
            Hotspot Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('navigation')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                type === 'navigation'
                  ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-lg shadow-primary-500/5'
                  : 'bg-dark-900 border-dark-800 text-dark-400 hover:text-white hover:border-dark-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${type === 'navigation' ? 'bg-primary-500 text-white' : 'bg-dark-800'}`}>
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Scene Link</p>
                <p className="text-xs text-dark-400">Teleport to another scene</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('info')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                type === 'info'
                  ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-lg shadow-primary-500/5'
                  : 'bg-dark-900 border-dark-800 text-dark-400 hover:text-white hover:border-dark-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${type === 'info' ? 'bg-primary-500 text-white' : 'bg-dark-800'}`}>
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Info Card</p>
                <p className="text-xs text-dark-400">Show rich description</p>
              </div>
            </button>
          </div>
        </div>

        {/* Destination Scene (if Navigation) */}
        {type === 'navigation' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400">
              Destination Scene
            </label>
            {availableDestinations.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                You only have 1 scene in this tour. Add another scene to link them together!
              </div>
            ) : (
              <select
                value={destinationSceneId}
                onChange={(e) => setDestinationSceneId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availableDestinations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Title */}
        <Input
          label="Label / Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'navigation' ? 'e.g. Master Bedroom' : 'e.g. Architecture Detail'}
          required
        />

        {/* Description (for Info) */}
        {type === 'info' && (
          <Textarea
            label="Description / Details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context or explanation for viewers..."
            rows={3}
          />
        )}

        {/* External URL (optional) */}
        {type === 'info' && (
          <Input
            label="Optional Link (URL)"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://example.com/details"
            leftIcon={<LinkIcon className="w-4 h-4" />}
          />
        )}

        {/* Style Options */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dark-800">
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1.5">
              Marker Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-9 rounded-lg bg-dark-900 border border-dark-700 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-dark-300">{color}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs font-semibold text-dark-400">Pulsing Radar Ring</span>
            <input
              type="checkbox"
              checked={pulse}
              onChange={(e) => setPulse(e.target.checked)}
              className="h-4 w-4 rounded border-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-800">
          {isExisting && onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => hotspot?.id && onDelete(hotspot.id)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              {isExisting ? 'Save Changes' : 'Place Hotspot'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
