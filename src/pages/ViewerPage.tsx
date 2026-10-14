import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firestoreUtils } from '@/lib/firestore';
import { PanoViewer } from '@/components/viewer/PanoViewer';
import { TourShareModal } from '@/components/viewer/TourShareModal';
import { Modal, Button, Badge } from '@/components/ui';
import type { Tour, Scene, Hotspot } from '@/types';
import {
  Share2,
  Compass,
  Layers,
  ChevronUp,
  ChevronDown,
  Info,
  ExternalLink,
  Loader2,
  AlertCircle,
  Home,
  X,
  Play,
  RotateCw,
} from 'lucide-react';

export function ViewerPage() {
  const { tourId } = useParams<{ tourId: string }>();

  const [tour, setTour] = useState<Tour | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedInfoHotspot, setSelectedInfoHotspot] = useState<Hotspot | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  // Load tour data
  useEffect(() => {
    if (!tourId) return;

    let isMounted = true;
    setLoading(true);

    firestoreUtils
      .getTourWithScenes(tourId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setTour(data.tour);
          setScenes(data.scenes);
          setHotspots(data.hotspots);

          // Select start scene
          const start = data.scenes.find((s) => s.id === data.tour.startSceneId) || data.scenes[0];
          if (start) {
            setActiveSceneId(start.id);
          }

          if (data.tour.settings?.introScreen?.enabled) {
            setShowIntro(true);
          }
        } else {
          setError('Virtual tour not found or is unavailable.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching tour:', err);
        setError('Failed to load virtual tour.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tourId]);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const activeHotspots = hotspots.filter((h) => h.sourceSceneId === activeScene?.id);

  // Handle Hotspot Click: Navigation or Info
  const handleHotspotClick = useCallback(
    (hotspot: Hotspot) => {
      if (hotspot.type === 'navigation' && hotspot.destinationSceneId) {
        // Teleport to destination scene!
        setActiveSceneId(hotspot.destinationSceneId);
      } else if (hotspot.type === 'info') {
        setSelectedInfoHotspot(hotspot);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-950 text-white gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
          <RotateCw className="w-6 h-6 text-primary-400 absolute animate-pulse" />
        </div>
        <p className="text-sm font-medium tracking-wide">Loading 360° Experience...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-950 text-white p-6 text-center">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tour Unavailable</h2>
        <p className="text-sm text-dark-400 max-w-md mb-6">
          {error || 'This 360 virtual tour does not exist or has been removed.'}
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
        >
          Explore PanoTour
        </Link>
      </div>
    );
  }

  const settings = tour.settings || {};

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark-950 select-none">
      {/* 360 Canvas */}
      {activeScene ? (
        <PanoViewer
          key={activeScene.id}
          imageUrl={activeScene.imageUrl}
          hotspots={activeHotspots}
          settings={settings}
          initialYaw={activeScene.initialYaw || 0}
          initialPitch={activeScene.initialPitch || 0}
          initialZoom={activeScene.initialZoom || 1}
          onHotspotClick={handleHotspotClick}
        />
      ) : (
        <div className="h-full flex items-center justify-center text-dark-500">
          No scenes configured.
        </div>
      )}

      {/* Top Header Watermark / Brand Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-dark-950/80 border border-dark-800/80 backdrop-blur-xl shadow-2xl">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Brand Logo" className="h-7 w-auto object-contain rounded" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide leading-tight">
              {tour.title}
            </h1>
            <p className="text-[11px] text-dark-400 leading-tight">
              {activeScene?.title || settings.brandName || '360° Virtual Tour'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Right Actions: Share & Filmstrip Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {(settings.showShareButton ?? true) && (
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="p-2.5 rounded-xl bg-dark-900/85 border border-dark-700/60 backdrop-blur-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors shadow-2xl"
            title="Share & Embed Tour"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {scenes.length > 1 && (settings.showThumbnails ?? true) && (
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border backdrop-blur-xl text-xs font-semibold transition-all shadow-2xl ${
              showThumbnails
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                : 'bg-dark-900/85 border-dark-700/60 text-dark-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Scenes ({scenes.length})</span>
            {showThumbnails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Bottom Scene Thumbnail Drawer */}
      {scenes.length > 1 && (settings.showThumbnails ?? true) && showThumbnails && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[90vw] overflow-x-auto no-scrollbar pointer-events-auto">
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-dark-950/85 border border-dark-800/80 backdrop-blur-2xl shadow-2xl">
            {scenes.map((scene, idx) => {
              const isActive = scene.id === activeScene?.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`group relative flex-shrink-0 flex flex-col items-center rounded-xl overflow-hidden transition-all duration-200 ${
                    isActive
                      ? 'ring-2 ring-primary-500 scale-105 shadow-xl'
                      : 'opacity-70 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <div className="w-20 sm:w-24 h-14 sm:h-16 bg-dark-900 overflow-hidden relative">
                    <img
                      src={scene.thumbnailUrl || scene.imageUrl}
                      alt={scene.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <p className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-semibold text-white truncate text-left">
                      {scene.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Hotspot Modal */}
      <Modal
        isOpen={Boolean(selectedInfoHotspot)}
        onClose={() => setSelectedInfoHotspot(null)}
        title={selectedInfoHotspot?.title || 'Point of Interest'}
        description="Scene Details"
        size="md"
      >
        <div className="space-y-4">
          {selectedInfoHotspot?.description && (
            <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
              {selectedInfoHotspot.description}
            </p>
          )}

          {selectedInfoHotspot?.externalUrl && (
            <div className="pt-2">
              <a
                href={selectedInfoHotspot.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors"
              >
                <span>Learn More / Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-dark-800">
            <Button size="sm" variant="secondary" onClick={() => setSelectedInfoHotspot(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <TourShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tourId={tour.id}
        tourTitle={tour.title}
      />
    </div>
  );
}
