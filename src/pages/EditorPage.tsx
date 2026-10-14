import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTour } from '@/context/TourContext';
import { useToast, Button, Badge } from '@/components/ui';
import { PanoViewer } from '@/components/viewer/PanoViewer';
import { SceneManager } from '@/components/editor/SceneManager';
import { HotspotModal } from '@/components/editor/HotspotModal';
import { TourSettingsModal } from '@/components/editor/TourSettingsModal';
import { TourShareModal } from '@/components/viewer/TourShareModal';
import type { Scene, Hotspot, Tour } from '@/types';
import {
  ArrowLeft,
  Compass,
  Info,
  Sliders,
  Share2,
  Eye,
  Check,
  Save,
  Globe,
  Radio,
  Camera,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function EditorPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    currentTour,
    scenes,
    hotspots,
    loading,
    fetchTour,
    updateTour,
    publishTour,
    unpublishTour,
    addScene,
    updateScene,
    deleteScene,
    addHotspot,
    updateHotspot,
    deleteHotspot,
  } = useTour();

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<'navigation' | 'info' | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Partial<Hotspot> | null>(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Current camera angles
  const [cameraYaw, setCameraYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1);

  // Fetch tour on mount
  useEffect(() => {
    if (tourId) {
      fetchTour(tourId);
    }
  }, [tourId, fetchTour]);

  // Set default active scene when scenes load
  useEffect(() => {
    if (scenes.length > 0 && !activeSceneId) {
      const startScene = scenes.find((s) => s.id === currentTour?.startSceneId) || scenes[0];
      setActiveSceneId(startScene.id);
    }
  }, [scenes, currentTour?.startSceneId, activeSceneId]);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const activeHotspots = hotspots.filter((h) => h.sourceSceneId === activeScene?.id);

  // Camera tracking
  const handlePositionChange = useCallback((yaw: number, pitch: number, zoom: number) => {
    setCameraYaw(yaw);
    setCameraPitch(pitch);
    setCameraZoom(zoom);
  }, []);

  // Handle clicking on 360 panorama canvas
  const handleViewerClick = useCallback(
    ({ yaw, pitch }: { yaw: number; pitch: number }) => {
      if (placementMode && activeScene) {
        setSelectedHotspot({
          tourId: currentTour?.id || '',
          sourceSceneId: activeScene.id,
          type: placementMode,
          yaw,
          pitch,
          title: placementMode === 'navigation' ? 'Scene Teleport' : 'Information',
          description: '',
          destinationSceneId: scenes.find((s) => s.id !== activeScene.id)?.id || null,
        });
        setPlacementMode(null);
        setShowHotspotModal(true);
      }
    },
    [placementMode, activeScene, currentTour?.id, scenes]
  );

  // Handle clicking existing hotspot marker
  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setShowHotspotModal(true);
  }, []);

  // Save Hotspot
  const handleSaveHotspot = async (data: Partial<Hotspot>) => {
    if (!currentTour || !activeScene) return;

    try {
      if (selectedHotspot?.id) {
        await updateHotspot(selectedHotspot.id, data);
        addToast({ type: 'success', title: 'Hotspot Updated', message: 'Changes saved successfully.' });
      } else {
        await addHotspot({
          tourId: currentTour.id,
          sourceSceneId: activeScene.id,
          destinationSceneId: data.destinationSceneId || null,
          type: data.type || 'navigation',
          yaw: selectedHotspot?.yaw || cameraYaw,
          pitch: selectedHotspot?.pitch || cameraPitch,
          title: data.title || 'Scene Marker',
          description: data.description || '',
          icon: data.icon || 'arrow',
          style: data.style || {
            size: 1,
            color: '#22c55e',
            pulse: true,
            showArrow: true,
            arrowDirection: 'auto',
            customIcon: null,
            label: null,
            labelPosition: 'bottom',
            hoverScale: 1.2,
          },
          externalUrl: data.externalUrl || null,
          order: activeHotspots.length,
        });
        addToast({ type: 'success', title: 'Hotspot Placed', message: 'Interactive marker added to scene.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save hotspot.' });
    }
  };

  // Delete Hotspot
  const handleDeleteHotspot = async (hotspotId: string) => {
    try {
      await deleteHotspot(hotspotId);
      setShowHotspotModal(false);
      setSelectedHotspot(null);
      addToast({ type: 'success', title: 'Hotspot Deleted', message: 'Marker removed from scene.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete hotspot.' });
    }
  };

  // Add Scene from uploaded file
  const handleAddSceneFile = async (file: File, title: string) => {
    if (!currentTour) return;
    try {
      const newScene = await addScene(currentTour.id, file, title);
      setActiveSceneId(newScene.id);
      addToast({ type: 'success', title: 'Scene Added', message: `Added "${title}" to your tour.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Scene Upload Error', message: err?.message || 'Could not upload image.' });
    }
  };

  // Add Scene from Sample preset
  const handleAddSampleScene = async (sample: { title: string; imageUrl: string; thumbnailUrl: string }) => {
    if (!currentTour) return;
    try {
      // In local demo or fallback, fetch image blob or convert
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${sample.title.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
      const newScene = await addScene(currentTour.id, file, sample.title);
      setActiveSceneId(newScene.id);
      addToast({ type: 'success', title: 'Preset Scene Added', message: `Added "${sample.title}" to your tour.` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not load sample scene.' });
    }
  };

  // Set Current Camera view as Initial angle for scene
  const handleSetInitialView = async (sceneId: string) => {
    try {
      await updateScene(sceneId, {
        initialYaw: cameraYaw,
        initialPitch: cameraPitch,
        initialZoom: cameraZoom,
      });
      addToast({
        type: 'success',
        title: 'Initial View Saved',
        message: 'Current camera direction set as starting view for this scene.',
      });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update initial view.' });
    }
  };

  // Set as Start Scene
  const handleSetStartScene = async (sceneId: string) => {
    if (!currentTour) return;
    try {
      await updateTour(currentTour.id, { startSceneId: sceneId });
      addToast({ type: 'success', title: 'Start Scene Updated', message: 'Default tour entry scene set.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update start scene.' });
    }
  };

  // Publish / Unpublish Tour
  const handleTogglePublish = async () => {
    if (!currentTour) return;
    try {
      if (currentTour.status === 'published') {
        await unpublishTour(currentTour.id);
      } else {
        await publishTour(currentTour.id);
      }
    } catch {
      // toast handled in context
    }
  };

  if (loading && !currentTour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm text-dark-400">Loading 360 Tour Studio...</p>
      </div>
    );
  }

  if (!currentTour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950 text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold mb-2">Tour Not Found</h2>
        <p className="text-sm text-dark-400 mb-6 max-w-sm">
          The requested tour ID does not exist or you do not have permission to edit it.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Studio Header Toolbar */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-dark-800 bg-dark-950/90 backdrop-blur-xl z-30 flex-shrink-0">
        {/* Left: Back & Tour Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-dark-800" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
                {currentTour.title}
              </h1>
              <Badge
                variant={currentTour.status === 'published' ? 'success' : 'outline'}
                dot
                size="sm"
              >
                {currentTour.status === 'published' ? 'Live' : 'Draft'}
              </Badge>
            </div>
            <p className="text-[11px] text-dark-400">
              {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'} • {hotspots.length} {hotspots.length === 1 ? 'Hotspot' : 'Hotspots'}
            </p>
          </div>
        </div>

        {/* Center: Hotspot Placement Mode Buttons */}
        <div className="hidden md:flex items-center gap-2 p-1 rounded-2xl bg-dark-900 border border-dark-800 shadow-inner">
          <button
            type="button"
            onClick={() => setPlacementMode(placementMode === 'navigation' ? null : 'navigation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              placementMode === 'navigation'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>+ Link Hotspot</span>
          </button>

          <button
            type="button"
            onClick={() => setPlacementMode(placementMode === 'info' ? null : 'info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              placementMode === 'info'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>+ Info Card</span>
          </button>
        </div>

        {/* Right: Settings, Preview, Share, Publish */}
        <div className="flex items-center gap-2">
          {activeScene && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSetInitialView(activeScene.id)}
              className="hidden lg:flex"
              title="Save current view orientation as starting angle for this scene"
              leftIcon={<Camera className="w-4 h-4 text-emerald-400" />}
            >
              Set View
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSettingsModal(true)}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Settings
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowShareModal(true)}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/tour/${currentTour.id}`, '_blank')}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Preview
          </Button>

          <Button
            size="sm"
            variant={currentTour.status === 'published' ? 'secondary' : 'primary'}
            onClick={handleTogglePublish}
            leftIcon={<Globe className="w-4 h-4" />}
          >
            {currentTour.status === 'published' ? 'Unpublish' : 'Publish Tour'}
          </Button>
        </div>
      </header>

      {/* Main 360 View Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-dark-950">
        {/* Placement Mode Alert Banner */}
        {placementMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary-500 text-white text-xs font-semibold shadow-2xl animate-bounce-subtle pointer-events-auto">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Click anywhere on the 360° panorama to drop your {placementMode} hotspot</span>
            <button
              type="button"
              onClick={() => setPlacementMode(null)}
              className="ml-2 px-2 py-0.5 rounded-full bg-black/20 hover:bg-black/40 text-[11px]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* 360 Sphere Viewer or Empty State */}
        {activeScene ? (
          <PanoViewer
            key={activeScene.id}
            imageUrl={activeScene.imageUrl}
            hotspots={activeHotspots}
            settings={currentTour.settings}
            initialYaw={activeScene.initialYaw || 0}
            initialPitch={activeScene.initialPitch || 0}
            initialZoom={activeScene.initialZoom || 1}
            isEditorMode
            activeHotspotId={selectedHotspot?.id || null}
            onPositionChange={handlePositionChange}
            onViewerClick={handleViewerClick}
            onHotspotClick={handleHotspotClick}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-dark-900 border border-dark-800 flex items-center justify-center text-dark-500 mb-4 shadow-xl">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No Scenes in this Tour</h3>
            <p className="text-xs text-dark-400 max-w-sm mb-6">
              Add your first 360° equirectangular photo or choose from our realistic architectural presets.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Scene Filmstrip Tray */}
      <footer className="h-20 border-t border-dark-800 bg-dark-950/90 backdrop-blur-xl z-20 flex-shrink-0">
        <SceneManager
          scenes={scenes}
          currentSceneId={activeSceneId}
          startSceneId={currentTour.startSceneId}
          onSelectScene={setActiveSceneId}
          onAddSceneFile={handleAddSceneFile}
          onAddSampleScene={handleAddSampleScene}
          onUpdateScene={updateScene}
          onDeleteScene={deleteScene}
          onSetStartScene={handleSetStartScene}
          onSetInitialView={handleSetInitialView}
        />
      </footer>

      {/* Modals */}
      <HotspotModal
        isOpen={showHotspotModal}
        onClose={() => {
          setShowHotspotModal(false);
          setSelectedHotspot(null);
        }}
        onSave={handleSaveHotspot}
        onDelete={handleDeleteHotspot}
        hotspot={selectedHotspot}
        scenes={scenes}
        currentSceneId={activeScene?.id || ''}
      />

      <TourSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        tour={currentTour}
        onSave={async (data) => {
          if (currentTour) await updateTour(currentTour.id, data);
        }}
      />

      <TourShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tourId={currentTour.id}
        tourTitle={currentTour.title}
      />
    </div>
  );
}
