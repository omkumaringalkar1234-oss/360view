export interface SamplePanorama {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export const SAMPLE_PANORAMAS: SamplePanorama[] = [
  {
    id: 'sample-living-room',
    title: 'Modern Luxury Penthouse',
    category: 'Interior',
    imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=4000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-terrace',
    title: 'Skyline Terrace & Garden',
    category: 'Architecture',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=4000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-gallery',
    title: 'Contemporary Art Gallery',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=4000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-scenic',
    title: 'Alpine Vista Overlook',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=4000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  },
];
