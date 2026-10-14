import { useEffect, useRef, useState, useCallback } from 'react';
import { Viewer } from 'photo-sphere-viewer';
import MarkersPlugin from 'photo-sphere-viewer/dist/plugins/markers';
import 'photo-sphere-viewer/dist/photo-sphere-viewer.css';
import 'photo-sphere-viewer/dist/plugins/markers.css';
import type { Hotspot, TourSettings } from '@/types';
import { Compass, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, MapPin, Info, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface PanoViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  settings?: Partial<TourSettings>;
  initialYaw?: number;
  initialPitch?: number;
  initialZoom?: number;
  isEditorMode?: boolean;
  activeHotspotId?: string | null;
  onPositionChange?: (yaw: number, pitch: number, zoom: number) => void;
  onViewerClick?: (coords: { yaw: number; pitch: number }) => void;
  onHotspotClick?: (hotspot: Hotspot) => void;
  className?: string;
}

export function PanoViewer({
  imageUrl,
  hotspots = [],
  settings = {},
  initialYaw = 0,
  initialPitch = 0,
  initialZoom = 1,
  isEditorMode = false,
  activeHotspotId = null,
  onPositionChange,
  onViewerClick,
  onHotspotClick,
  className = '',
}: PanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentYaw, setCurrentYaw] = useState(initialYaw);
  const [currentPitch, setCurrentPitch] = useState(initialPitch);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [isAutoRotating, setIsAutoRotating] = useState(settings.autoRotate || false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Viewer | null = null;
    setIsLoading(true);
    setLoadError(null);

    try {
      const PluginClass = (MarkersPlugin as any).MarkersPlugin || MarkersPlugin;

      viewer = new Viewer({
        container: containerRef.current,
        panorama: imageUrl,
        navbar: [], // We supply custom sleek glass controls
        defaultYaw: initialYaw,
        defaultPitch: initialPitch,
        defaultZoomLvl: Math.min(Math.max((initialZoom || 1) * 30, 0), 100),
        minFov: 30,
        maxFov: 90,
        autorotateSpeed: `${(settings.autoRotateSpeed || 0.5) * 2}rpm`,
        mousewheel: true,
        plugins: [
          [PluginClass, {}],
        ],
      } as any);

      viewerRef.current = viewer;

      const markersPlugin = (viewer as any).getPlugin(PluginClass);
      markersPluginRef.current = markersPlugin;

      (viewer as any).on('ready', () => {
        setIsLoading(false);
        if (settings.autoRotate) {
          viewer?.startAutorotate();
          setIsAutoRotating(true);
        }
      });

      viewer.on('position-updated', (_e: any, position: any) => {
        const yaw = position.longitude;
        const pitch = position.latitude;
        setCurrentYaw(yaw);
        setCurrentPitch(pitch);
        onPositionChange?.(yaw, pitch, currentZoom);
      });

      viewer.on('zoom-updated', (_e: any, zoomLevel: number) => {
        const normalizedZoom = zoomLevel / 50;
        setCurrentZoom(normalizedZoom);
        onPositionChange?.(currentYaw, currentPitch, normalizedZoom);
      });

      viewer.on('click', (_e: any, data: any) => {
        if (data.rightclick) return;
        onViewerClick?.({ yaw: data.longitude, pitch: data.latitude });
      });

      if (markersPlugin) {
        markersPlugin.on('select-marker', (_e: any, marker: any) => {
          if (marker.data) {
            onHotspotClick?.(marker.data as Hotspot);
          }
        });
      }

    } catch (err: any) {
      console.error('Failed to initialize 360 viewer:', err);
      setLoadError(err?.message || 'Could not load 360 panorama image.');
      setIsLoading(false);
    }

    return () => {
      try {
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
          markersPluginRef.current = null;
        }
      } catch (e) {
        console.warn('Error destroying viewer:', e);
      }
    };
  }, [imageUrl]);

  // Update hotspots markers
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!plugin) return;

    try {
      plugin.clearMarkers();

      hotspots.forEach((hs) => {
        const isNavigation = hs.type === 'navigation';
        const color = hs.style?.color || settings.hotspotColor || '#22c55e';
        const isSelected = activeHotspotId === hs.id;

        const htmlContent = `
          <div class="group relative flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${isSelected ? 'scale-125' : 'hover:scale-110'}">
            ${hs.style?.pulse ? `
              <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${color}; width: 36px; height: 36px;"></div>
            ` : ''}
            <div class="relative flex items-center justify-center rounded-full shadow-2xl border-2 ${isSelected ? 'border-white ring-4 ring-primary-500/50' : 'border-white/80'}" style="background-color: ${color}; width: 36px; height: 36px;">
              ${isNavigation ? `
                <svg class="w-5 h-5 text-white animate-bounce-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              ` : `
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              `}
            </div>
            ${hs.title ? `
              <div class="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg bg-dark-950/90 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                ${hs.title}
              </div>
            ` : ''}
          </div>
        `;

        plugin.addMarker({
          id: hs.id,
          longitude: hs.yaw,
          latitude: hs.pitch,
          html: htmlContent,
          anchor: 'center center',
          data: hs,
          tooltip: hs.title ? { content: hs.title, position: 'top' } : undefined,
        });
      });
    } catch (e) {
      console.warn('Failed to update markers:', e);
    }
  }, [hotspots, activeHotspotId, settings.hotspotColor]);

  // Controls Handlers
  const handleZoomIn = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.zoom(viewerRef.current.getZoomLevel() + 15);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.zoom(viewerRef.current.getZoomLevel() - 15);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    if (!viewerRef.current) return;
    if (isAutoRotating) {
      viewerRef.current.stopAutorotate();
      setIsAutoRotating(false);
    } else {
      viewerRef.current.startAutorotate();
      setIsAutoRotating(true);
    }
  }, [isAutoRotating]);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.animate({
      longitude: initialYaw,
      latitude: initialPitch,
      zoom: 50,
      speed: '2rpm',
    });
  }, [initialYaw, initialPitch]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-dark-950 select-none ${className}`}>
      {/* 360 Viewer Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950/80 backdrop-blur-md z-30 transition-opacity">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-primary-400">
              <RotateCw className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-white tracking-wide">Rendering 360° Sphere...</p>
          <p className="mt-1 text-xs text-dark-400">Loading high-resolution equirectangular texture</p>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950 p-6 z-40 text-center">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 mb-3">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Failed to Render 360 Scene</h3>
          <p className="text-sm text-dark-400 max-w-md mb-4">{loadError}</p>
          <Button
            size="sm"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
              viewerRef.current?.setPanorama(imageUrl);
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry Loading
          </Button>
        </div>
      )}

      {/* Modern HUD: Compass & Position indicator */}
      {(settings.showCompass ?? true) && !isLoading && !loadError && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900/80 border border-dark-700/60 backdrop-blur-md text-xs text-dark-300 shadow-xl">
            <Compass
              className="w-4 h-4 text-primary-400 transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${-currentYaw * (180 / Math.PI)}deg)` }}
            />
            <span className="font-mono">{Math.round((((currentYaw * (180 / Math.PI)) % 360) + 360) % 360)}°</span>
            {isEditorMode && (
              <span className="text-dark-500 font-mono border-l border-dark-700 pl-2">
                Pitch: {Math.round(currentPitch * (180 / Math.PI))}°
              </span>
            )}
          </div>
        </div>
      )}

      {/* Modern Floating Control Bar */}
      {!isLoading && !loadError && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-dark-900/85 border border-dark-700/60 backdrop-blur-xl shadow-2xl">
          {(settings.showZoomControls ?? true) && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleToggleAutoRotate}
            className={`p-2 rounded-xl transition-colors ${
              isAutoRotating ? 'text-primary-400 bg-primary-500/20' : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
            title={isAutoRotating ? 'Stop Auto-rotation' : 'Start Auto-rotation'}
          >
            <RotateCw className={`w-4 h-4 ${isAutoRotating ? 'animate-spin-slow' : ''}`} />
          </button>

          {(settings.showFullscreenButton ?? true) && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
