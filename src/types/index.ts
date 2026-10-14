export interface User {
  id: string;
  displayName: string | null;
  email: string;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tour {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  status: 'draft' | 'published' | 'unpublished';
  visibility: 'public' | 'unlisted' | 'private';
  startSceneId: string | null;
  settings: TourSettings;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface TourSettings {
  autoRotate: boolean;
  autoRotateSpeed: number;
  showThumbnails: boolean;
  showSceneTitles: boolean;
  showCompass: boolean;
  showZoomControls: boolean;
  showFullscreenButton: boolean;
  showShareButton: boolean;
  showQRCode: boolean;
  defaultZoom: number;
  maxZoom: number;
  minZoom: number;
  backgroundColor: string;
  hotspotColor: string;
  hotspotSize: number;
  logoUrl: string | null;
  brandName: string | null;
  introScreen: IntroScreen | null;
}

export interface IntroScreen {
  enabled: boolean;
  title: string;
  description: string;
  backgroundImageUrl: string | null;
  buttonText: string;
}

export interface Scene {
  id: string;
  tourId: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  order: number;
  initialYaw: number;
  initialPitch: number;
  initialZoom: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hotspot {
  id: string;
  tourId: string;
  sourceSceneId: string;
  destinationSceneId: string | null;
  type: 'navigation' | 'info';
  yaw: number;
  pitch: number;
  title: string;
  description: string;
  icon: string;
  style: HotspotStyle;
  externalUrl: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotspotStyle {
  size: number;
  color: string;
  pulse: boolean;
  showArrow: boolean;
  arrowDirection: 'auto' | 'fixed';
  customIcon: string | null;
  label: string | null;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
  hoverScale: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  sceneId?: string;
}

export interface TourWithScenes extends Tour {
  scenes: Scene[];
  hotspots: Hotspot[];
}

export interface ViewerState {
  currentSceneId: string | null;
  yaw: number;
  pitch: number;
  zoom: number;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EditorState {
  tourId: string | null;
  currentSceneId: string | null;
  selectedHotspotId: string | null;
  mode: 'view' | 'edit' | 'hotspot-placement' | 'preview';
  hotspotType: 'navigation' | 'info' | null;
  yaw: number;
  pitch: number;
  zoom: number;
  isDirty: boolean;
  isSaving: boolean;
}

export const DEFAULT_TOUR_SETTINGS: TourSettings = {
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
};

export const DEFAULT_HOTSPOT_STYLE: HotspotStyle = {
  size: 1,
  color: '#22c55e',
  pulse: true,
  showArrow: true,
  arrowDirection: 'auto',
  customIcon: null,
  label: null,
  labelPosition: 'bottom',
  hoverScale: 1.2,
};

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MIN_ASPECT_RATIO = 1.8;
export const MAX_ASPECT_RATIO = 2.2;
export const IDEAL_ASPECT_RATIO = 2.0;