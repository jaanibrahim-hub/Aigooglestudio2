/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type ItemCategory = 'top' | 'bottom' | 'shoes' | 'accessory' | 'held';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: ItemCategory;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

// For the new image gallery
export interface GalleryImage {
  url: string;
  name: string;
  outfitIndex?: number;
  poseIndex?: number;
}

// For caching generated poses
export type PoseGenerationCache = Map<string, string>;

// For state management
export interface AppState {
  modelImageUrl: string | null;
  outfitHistory: OutfitLayer[];
  currentOutfitIndex: number;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  currentPoseIndex: number;
  isSheetCollapsed: boolean;
  wardrobe: WardrobeItem[];
  poseCache: PoseGenerationCache;
  retryCount: number;
  theme: 'light' | 'dark';
  isGalleryOpen: boolean;
}