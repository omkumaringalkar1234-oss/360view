import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Tour, Scene, Hotspot } from '@/types';
import { DEFAULT_TOUR_SETTINGS } from '@/types';
import { firestoreUtils } from '@/lib/firestore';
import { storageUtils } from '@/lib/storage';
import { useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

interface TourContextType {
  currentTour: Tour | null;
  scenes: Scene[];
  hotspots: Hotspot[];
  loading: boolean;
  error: string | null;
  fetchTour: (tourId: string) => Promise<void>;
  createTour: (title: string, description: string) => Promise<string>;
  updateTour: (tourId: string, data: Partial<Tour>) => Promise<void>;
  publishTour: (tourId: string) => Promise<void>;
  unpublishTour: (tourId: string) => Promise<void>;
  deleteTour: (tourId: string) => Promise<void>;
  duplicateTour: (tourId: string, newTitle: string) => Promise<string>;
  addScene: (tourId: string, file: File, title: string) => Promise<Scene>;
  updateScene: (sceneId: string, data: Partial<Scene>) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  reorderScenes: (tourId: string, sceneIds: string[]) => Promise<void>;
  addHotspot: (hotspot: Omit<Hotspot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateHotspot: (hotspotId: string, data: Partial<Hotspot>) => Promise<void>;
  deleteHotspot: (hotspotId: string) => Promise<void>;
  clearTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const fetchTour = useCallback(async (tourId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await firestoreUtils.getTourWithScenes(tourId);
      if (result) {
        setCurrentTour(result.tour);
        setScenes(result.scenes);
        setHotspots(result.hotspots);
      } else {
        throw new Error('Tour not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to load tour' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createTour = useCallback(async (title: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('Not authenticated');

      const tourId = await firestoreUtils.createTour({
        ownerId: user.id,
        title,
        description,
        coverImageUrl: null,
        status: 'draft',
        visibility: 'private',
        startSceneId: null,
        settings: DEFAULT_TOUR_SETTINGS,
      });

      const tour = await firestoreUtils.getTour(tourId);
      if (tour) setCurrentTour(tour);
      return tourId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to create tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  const updateTour = useCallback(async (tourId: string, data: Partial<Tour>) => {
    setLoading(true);
    setError(null);
    try {
      await firestoreUtils.updateTour(tourId, data);
      setCurrentTour((prev) => (prev ? { ...prev, ...data } : null));
      addToast({ type: 'success', title: 'Saved', message: 'Tour updated successfully' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to update tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const publishTour = useCallback(async (tourId: string) => {
    setLoading(true);
    setError(null);
    try {
      await firestoreUtils.publishTour(tourId);
      setCurrentTour((prev) => (prev ? { ...prev, status: 'published', publishedAt: new Date() } : null));
      addToast({ type: 'success', title: 'Published', message: 'Tour is now live' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to publish tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const unpublishTour = useCallback(async (tourId: string) => {
    setLoading(true);
    setError(null);
    try {
      await firestoreUtils.unpublishTour(tourId);
      setCurrentTour((prev) => (prev ? { ...prev, status: 'unpublished' } : null));
      addToast({ type: 'success', title: 'Unpublished', message: 'Tour is no longer public' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to unpublish tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const deleteTour = useCallback(async (tourId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Delete images from storage
      await storageUtils.deleteTourImages(tourId);
      // Delete from firestore
      await firestoreUtils.deleteTour(tourId);
      if (currentTour?.id === tourId) {
        setCurrentTour(null);
        setScenes([]);
        setHotspots([]);
      }
      addToast({ type: 'success', title: 'Deleted', message: 'Tour deleted permanently' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentTour, addToast]);

  const duplicateTour = useCallback(async (tourId: string, newTitle: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('Not authenticated');

      const newTourId = await firestoreUtils.duplicateTour(tourId, newTitle, user.id);
      addToast({ type: 'success', title: 'Duplicated', message: 'Tour duplicated successfully' });
      return newTourId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate tour');
      addToast({ type: 'error', title: 'Error', message: 'Failed to duplicate tour' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  const addScene = useCallback(async (tourId: string, file: File, title: string) => {
    setLoading(true);
    setError(null);
    try {
      const { getImageDimensions, generateThumbnail, validateImageFile, isValidPanorama } = await import('@/utils/helpers');
      
      const validation = validateImageFile(file);
      if (!validation.valid) throw new Error(validation.error);

      const dimensions = await getImageDimensions(file);
      const panoramaCheck = isValidPanorama(dimensions.width, dimensions.height);
      if (!panoramaCheck.valid) throw new Error(panoramaCheck.warning);

      // Generate thumbnail
      const thumbnailBlob = await generateThumbnail(file);
      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${file.name}.webp`, { type: 'image/webp' });

      // Upload original
      const sceneId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imagePath = storageUtils.generateTourImagePath(tourId, sceneId, file.name);
      const imageUrl = await storageUtils.uploadImage(file, imagePath);

      // Upload thumbnail
      const thumbnailPath = storageUtils.generateTourThumbnailPath(tourId, sceneId);
      const thumbnailUrl = await storageUtils.uploadImage(thumbnailFile, thumbnailPath);

      // Create scene in firestore
      const order = scenes.length;
      const newScene = await firestoreUtils.createScene({
        tourId,
        title,
        imageUrl,
        thumbnailUrl,
        order,
        initialYaw: 0,
        initialPitch: 0,
        initialZoom: 1,
      });

      const scene = await firestoreUtils.getScene(newScene);
      if (scene) {
        setScenes((prev) => [...prev, scene]);
      }

      if (panoramaCheck.warning) {
        addToast({ type: 'warning', title: 'Panorama Warning', message: panoramaCheck.warning });
      }

      return scene!;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add scene');
      addToast({ type: 'error', title: 'Error', message: 'Failed to add scene' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [scenes.length, addToast]);

  const updateScene = useCallback(async (sceneId: string, data: Partial<Scene>) => {
    setError(null);
    try {
      await firestoreUtils.updateScene(sceneId, data);
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, ...data } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene');
      addToast({ type: 'error', title: 'Error', message: 'Failed to update scene' });
      throw err;
    }
  }, [addToast]);

  const deleteScene = useCallback(async (sceneId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Delete hotspots associated with this scene
      await firestoreUtils.deleteHotspotsByScene(sceneId);
      // Delete scene
      await firestoreUtils.deleteScene(sceneId);
      setScenes((prev) => prev.filter((s) => s.id !== sceneId));
      setHotspots((prev) => prev.filter((h) => h.sourceSceneId !== sceneId && h.destinationSceneId !== sceneId));
      addToast({ type: 'success', title: 'Deleted', message: 'Scene deleted' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scene');
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete scene' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const reorderScenes = useCallback(async (tourId: string, sceneIds: string[]) => {
    setError(null);
    try {
      await firestoreUtils.reorderScenes(tourId, sceneIds);
      // Re-fetch to get updated order
      const updatedScenes = await firestoreUtils.getScenesByTour(tourId);
      setScenes(updatedScenes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder scenes');
      addToast({ type: 'error', title: 'Error', message: 'Failed to reorder scenes' });
      throw err;
    }
  }, [addToast]);

  const addHotspot = useCallback(async (hotspotData: Omit<Hotspot, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      const hotspotId = await firestoreUtils.createHotspot(hotspotData);
      const hotspot = await firestoreUtils.getHotspot(hotspotId);
      if (hotspot) {
        setHotspots((prev) => [...prev, hotspot]);
      }
      return hotspotId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add hotspot');
      addToast({ type: 'error', title: 'Error', message: 'Failed to add hotspot' });
      throw err;
    }
  }, [addToast]);

  const updateHotspot = useCallback(async (hotspotId: string, data: Partial<Hotspot>) => {
    setError(null);
    try {
      await firestoreUtils.updateHotspot(hotspotId, data);
      setHotspots((prev) => prev.map((h) => (h.id === hotspotId ? { ...h, ...data } : h)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hotspot');
      addToast({ type: 'error', title: 'Error', message: 'Failed to update hotspot' });
      throw err;
    }
  }, [addToast]);

  const deleteHotspot = useCallback(async (hotspotId: string) => {
    setError(null);
    try {
      await firestoreUtils.deleteHotspot(hotspotId);
      setHotspots((prev) => prev.filter((h) => h.id !== hotspotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hotspot');
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete hotspot' });
      throw err;
    }
  }, [addToast]);

  const clearTour = useCallback(() => {
    setCurrentTour(null);
    setScenes([]);
    setHotspots([]);
    setError(null);
  }, []);

  return (
    <TourContext.Provider
      value={{
        currentTour,
        scenes,
        hotspots,
        loading,
        error,
        fetchTour,
        createTour,
        updateTour,
        publishTour,
        unpublishTour,
        deleteTour,
        duplicateTour,
        addScene,
        updateScene,
        deleteScene,
        reorderScenes,
        addHotspot,
        updateHotspot,
        deleteHotspot,
        clearTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}