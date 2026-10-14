import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { User, Tour, Scene, Hotspot, TourSettings } from '@/types';
import { DEFAULT_TOUR_SETTINGS, DEFAULT_HOTSPOT_STYLE } from '@/types';
import { SAMPLE_PANORAMAS } from '@/utils/samplePanoramas';

const USERS_COLLECTION = 'users';
const TOURS_COLLECTION = 'tours';
const SCENES_COLLECTION = 'scenes';
const HOTSPOTS_COLLECTION = 'hotspots';

// Local storage fallback helpers
const LOCAL_STORAGE_PREFIX = 'panotour_db_';
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

// Seed demo tour if localStorage is empty
function seedDemoDataIfEmpty(userId: string) {
  const existingTours = getLocalItem<Tour[]>('tours', []);
  if (existingTours.length > 0) return;

  const demoTourId = 'demo-tour-showcase';
  const scene1Id = 'scene-penthouse';
  const scene2Id = 'scene-terrace';

  const demoTour: Tour = {
    id: demoTourId,
    ownerId: userId,
    title: 'Luxury Sky Penthouse & Rooftop',
    description: 'Explore this modern penthouse suite and walk out onto the rooftop terrace.',
    coverImageUrl: SAMPLE_PANORAMAS[0].imageUrl,
    status: 'published',
    visibility: 'public',
    startSceneId: scene1Id,
    settings: {
      ...DEFAULT_TOUR_SETTINGS,
      brandName: 'PanoTour Architecture',
      autoRotate: true,
      autoRotateSpeed: 0.3,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  };

  const scene1: Scene = {
    id: scene1Id,
    tourId: demoTourId,
    title: 'Penthouse Living Room',
    imageUrl: SAMPLE_PANORAMAS[0].imageUrl,
    thumbnailUrl: SAMPLE_PANORAMAS[0].thumbnailUrl,
    order: 0,
    initialYaw: 0,
    initialPitch: 0,
    initialZoom: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const scene2: Scene = {
    id: scene2Id,
    tourId: demoTourId,
    title: 'Skyline Terrace',
    imageUrl: SAMPLE_PANORAMAS[1].imageUrl,
    thumbnailUrl: SAMPLE_PANORAMAS[1].thumbnailUrl,
    order: 1,
    initialYaw: 0,
    initialPitch: 0,
    initialZoom: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const hotspot1: Hotspot = {
    id: 'hs-to-terrace',
    tourId: demoTourId,
    sourceSceneId: scene1Id,
    destinationSceneId: scene2Id,
    type: 'navigation',
    yaw: 0.8,
    pitch: -0.1,
    title: 'Walk to Rooftop Terrace',
    description: 'Step out onto the open-air garden terrace overlooking the skyline.',
    icon: 'arrow',
    style: { ...DEFAULT_HOTSPOT_STYLE, color: '#22c55e', pulse: true },
    externalUrl: null,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const hotspot2: Hotspot = {
    id: 'hs-to-penthouse',
    tourId: demoTourId,
    sourceSceneId: scene2Id,
    destinationSceneId: scene1Id,
    type: 'navigation',
    yaw: -1.2,
    pitch: 0,
    title: 'Back to Living Room',
    description: 'Return inside to the main penthouse lounge.',
    icon: 'arrow',
    style: { ...DEFAULT_HOTSPOT_STYLE, color: '#38bdf8', pulse: true },
    externalUrl: null,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const hotspotInfo: Hotspot = {
    id: 'hs-penthouse-info',
    tourId: demoTourId,
    sourceSceneId: scene1Id,
    destinationSceneId: null,
    type: 'info',
    yaw: -0.6,
    pitch: 0.15,
    title: 'Floor-to-Ceiling Windows',
    description: 'Triple-glazed insulated acoustic glass panels with panoramic 270-degree sunset exposures.',
    icon: 'info',
    style: { ...DEFAULT_HOTSPOT_STYLE, color: '#f59e0b', pulse: true },
    externalUrl: 'https://github.com',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setLocalItem('tours', [demoTour]);
  setLocalItem('scenes', [scene1, scene2]);
  setLocalItem('hotspots', [hotspot1, hotspot2, hotspotInfo]);
}

export const firestoreUtils = {
  // User operations
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      const now = Timestamp.now();
      await setDoc(doc(db, USERS_COLLECTION, userData.id), {
        ...userData,
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      // Ignored
    }
  },

  async getUser(userId: string): Promise<User | null> {
    if (!isFirebaseConfigured) return null;
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as User;
    } catch {
      return null;
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch {
      // Ignored
    }
  },

  // Tour operations
  async createTour(tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<string> {
    const tourId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newTour: Tour = {
      ...tourData,
      id: tourId,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
    };

    if (!isFirebaseConfigured) {
      const tours = getLocalItem<Tour[]>('tours', []);
      setLocalItem('tours', [newTour, ...tours]);
      return tourId;
    }

    try {
      const tourRef = doc(db, TOURS_COLLECTION, tourId);
      const now = Timestamp.now();
      await setDoc(tourRef, {
        ...tourData,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      });
      return tourId;
    } catch {
      const tours = getLocalItem<Tour[]>('tours', []);
      setLocalItem('tours', [newTour, ...tours]);
      return tourId;
    }
  },

  async getTour(tourId: string): Promise<Tour | null> {
    if (!isFirebaseConfigured) {
      const tours = getLocalItem<Tour[]>('tours', []);
      return tours.find((t) => t.id === tourId) || null;
    }

    try {
      const docRef = doc(db, TOURS_COLLECTION, tourId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const tours = getLocalItem<Tour[]>('tours', []);
        return tours.find((t) => t.id === tourId) || null;
      }
      return { id: docSnap.id, ...docSnap.data() } as Tour;
    } catch {
      const tours = getLocalItem<Tour[]>('tours', []);
      return tours.find((t) => t.id === tourId) || null;
    }
  },

  async getTourWithScenes(tourId: string): Promise<{ tour: Tour; scenes: Scene[]; hotspots: Hotspot[] } | null> {
    const tour = await this.getTour(tourId);
    if (!tour) return null;

    const scenes = await this.getScenesByTour(tourId);
    const hotspots = await this.getHotspotsByTour(tourId);

    return { tour, scenes, hotspots };
  },

  async getUserTours(userId: string, constraints: QueryConstraint[] = []): Promise<Tour[]> {
    seedDemoDataIfEmpty(userId);

    if (!isFirebaseConfigured) {
      const tours = getLocalItem<Tour[]>('tours', []);
      return tours;
    }

    try {
      const q = query(
        collection(db, TOURS_COLLECTION),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc'),
        ...constraints
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Tour));
      if (fetched.length === 0) {
        return getLocalItem<Tour[]>('tours', []);
      }
      return fetched;
    } catch {
      return getLocalItem<Tour[]>('tours', []);
    }
  },

  async updateTour(tourId: string, data: Partial<Tour>): Promise<void> {
    const tours = getLocalItem<Tour[]>('tours', []);
    setLocalItem(
      'tours',
      tours.map((t) => (t.id === tourId ? { ...t, ...data, updatedAt: new Date() } : t))
    );

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, TOURS_COLLECTION, tourId), {
          ...data,
          updatedAt: Timestamp.now(),
        });
      } catch {
        // Ignored
      }
    }
  },

  async publishTour(tourId: string): Promise<void> {
    await this.updateTour(tourId, {
      status: 'published',
      publishedAt: new Date(),
    });
  },

  async unpublishTour(tourId: string): Promise<void> {
    await this.updateTour(tourId, {
      status: 'unpublished',
    });
  },

  async deleteTour(tourId: string): Promise<void> {
    const tours = getLocalItem<Tour[]>('tours', []);
    setLocalItem('tours', tours.filter((t) => t.id !== tourId));

    const scenes = getLocalItem<Scene[]>('scenes', []);
    setLocalItem('scenes', scenes.filter((s) => s.tourId !== tourId));

    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem('hotspots', hotspots.filter((h) => h.tourId !== tourId));

    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);
        const tourScenes = await this.getScenesByTour(tourId);
        tourScenes.forEach((s) => batch.delete(doc(db, SCENES_COLLECTION, s.id)));
        const tourHotspots = await this.getHotspotsByTour(tourId);
        tourHotspots.forEach((h) => batch.delete(doc(db, HOTSPOTS_COLLECTION, h.id)));
        batch.delete(doc(db, TOURS_COLLECTION, tourId));
        await batch.commit();
      } catch {
        // Ignored
      }
    }
  },

  async duplicateTour(tourId: string, newTitle: string, newOwnerId: string): Promise<string> {
    const original = await this.getTourWithScenes(tourId);
    if (!original) throw new Error('Original tour not found');

    const newTourId = await this.createTour({
      ownerId: newOwnerId,
      title: newTitle,
      description: original.tour.description,
      coverImageUrl: original.tour.coverImageUrl,
      status: 'draft',
      visibility: 'private',
      startSceneId: null,
      settings: original.tour.settings || DEFAULT_TOUR_SETTINGS,
    });

    const sceneIdMap = new Map<string, string>();
    for (const scene of original.scenes) {
      const newSceneId = await this.createScene({
        tourId: newTourId,
        title: scene.title,
        imageUrl: scene.imageUrl,
        thumbnailUrl: scene.thumbnailUrl,
        order: scene.order,
        initialYaw: scene.initialYaw,
        initialPitch: scene.initialPitch,
        initialZoom: scene.initialZoom,
      });
      sceneIdMap.set(scene.id, newSceneId);
    }

    if (original.tour.startSceneId && sceneIdMap.has(original.tour.startSceneId)) {
      await this.updateTour(newTourId, { startSceneId: sceneIdMap.get(original.tour.startSceneId)! });
    }

    for (const hs of original.hotspots) {
      const mappedSource = sceneIdMap.get(hs.sourceSceneId);
      const mappedDest = hs.destinationSceneId ? sceneIdMap.get(hs.destinationSceneId) : null;
      if (mappedSource) {
        await this.createHotspot({
          tourId: newTourId,
          sourceSceneId: mappedSource,
          destinationSceneId: mappedDest || null,
          type: hs.type,
          yaw: hs.yaw,
          pitch: hs.pitch,
          title: hs.title,
          description: hs.description,
          icon: hs.icon,
          style: hs.style,
          externalUrl: hs.externalUrl,
          order: hs.order,
        });
      }
    }

    return newTourId;
  },

  // Scene operations
  async createScene(sceneData: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const sceneId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newScene: Scene = {
      ...sceneData,
      id: sceneId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const scenes = getLocalItem<Scene[]>('scenes', []);
    setLocalItem('scenes', [...scenes, newScene]);

    if (isFirebaseConfigured) {
      try {
        const sceneRef = doc(db, SCENES_COLLECTION, sceneId);
        const now = Timestamp.now();
        await setDoc(sceneRef, {
          ...sceneData,
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        // Ignored
      }
    }

    return sceneId;
  },

  async getScene(sceneId: string): Promise<Scene | null> {
    const scenes = getLocalItem<Scene[]>('scenes', []);
    const local = scenes.find((s) => s.id === sceneId);
    if (local) return local;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, SCENES_COLLECTION, sceneId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as Scene;
      } catch {
        return null;
      }
    }
    return null;
  },

  async getScenesByTour(tourId: string): Promise<Scene[]> {
    const scenes = getLocalItem<Scene[]>('scenes', []);
    const local = scenes.filter((s) => s.tourId === tourId).sort((a, b) => a.order - b.order);
    if (local.length > 0 || !isFirebaseConfigured) return local;

    try {
      const q = query(
        collection(db, SCENES_COLLECTION),
        where('tourId', '==', tourId),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Scene));
    } catch {
      return local;
    }
  },

  async updateScene(sceneId: string, data: Partial<Scene>): Promise<void> {
    const scenes = getLocalItem<Scene[]>('scenes', []);
    setLocalItem(
      'scenes',
      scenes.map((s) => (s.id === sceneId ? { ...s, ...data, updatedAt: new Date() } : s))
    );

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, SCENES_COLLECTION, sceneId), {
          ...data,
          updatedAt: Timestamp.now(),
        });
      } catch {
        // Ignored
      }
    }
  },

  async deleteScene(sceneId: string): Promise<void> {
    const scenes = getLocalItem<Scene[]>('scenes', []);
    setLocalItem('scenes', scenes.filter((s) => s.id !== sceneId));
    await this.deleteHotspotsByScene(sceneId);

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, SCENES_COLLECTION, sceneId));
      } catch {
        // Ignored
      }
    }
  },

  async reorderScenes(tourId: string, sceneIds: string[]): Promise<void> {
    const scenes = getLocalItem<Scene[]>('scenes', []);
    setLocalItem(
      'scenes',
      scenes.map((s) => {
        if (s.tourId === tourId) {
          const idx = sceneIds.indexOf(s.id);
          if (idx !== -1) return { ...s, order: idx };
        }
        return s;
      })
    );
  },

  // Hotspot operations
  async createHotspot(hotspotData: Omit<Hotspot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const hotspotId = `hs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newHotspot: Hotspot = {
      ...hotspotData,
      id: hotspotId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem('hotspots', [...hotspots, newHotspot]);

    if (isFirebaseConfigured) {
      try {
        const hotspotRef = doc(db, HOTSPOTS_COLLECTION, hotspotId);
        const now = Timestamp.now();
        await setDoc(hotspotRef, {
          ...hotspotData,
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        // Ignored
      }
    }

    return hotspotId;
  },

  async getHotspot(hotspotId: string): Promise<Hotspot | null> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    const local = hotspots.find((h) => h.id === hotspotId);
    if (local) return local;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, HOTSPOTS_COLLECTION, hotspotId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as Hotspot;
      } catch {
        return null;
      }
    }
    return null;
  },

  async getHotspotsByTour(tourId: string): Promise<Hotspot[]> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    const local = hotspots.filter((h) => h.tourId === tourId).sort((a, b) => a.order - b.order);
    if (local.length > 0 || !isFirebaseConfigured) return local;

    try {
      const q = query(
        collection(db, HOTSPOTS_COLLECTION),
        where('tourId', '==', tourId),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Hotspot));
    } catch {
      return local;
    }
  },

  async getHotspotsByScene(sceneId: string): Promise<Hotspot[]> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    return hotspots.filter((h) => h.sourceSceneId === sceneId).sort((a, b) => a.order - b.order);
  },

  async updateHotspot(hotspotId: string, data: Partial<Hotspot>): Promise<void> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem(
      'hotspots',
      hotspots.map((h) => (h.id === hotspotId ? { ...h, ...data, updatedAt: new Date() } : h))
    );

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, HOTSPOTS_COLLECTION, hotspotId), {
          ...data,
          updatedAt: Timestamp.now(),
        });
      } catch {
        // Ignored
      }
    }
  },

  async deleteHotspot(hotspotId: string): Promise<void> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem('hotspots', hotspots.filter((h) => h.id !== hotspotId));

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, HOTSPOTS_COLLECTION, hotspotId));
      } catch {
        // Ignored
      }
    }
  },

  async deleteHotspotsByScene(sceneId: string): Promise<void> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem('hotspots', hotspots.filter((h) => h.sourceSceneId !== sceneId));
  },

  async deleteHotspotsByTour(tourId: string): Promise<void> {
    const hotspots = getLocalItem<Hotspot[]>('hotspots', []);
    setLocalItem('hotspots', hotspots.filter((h) => h.tourId !== tourId));
  },
};