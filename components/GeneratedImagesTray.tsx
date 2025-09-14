/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { GalleryImage } from '../types';
import { motion } from 'framer-motion';

interface GeneratedImagesTrayProps {
  images: GalleryImage[];
  onImageSelect: (outfitIndex: number, poseIndex: number) => void;
  currentImageUrl: string | null;
}

const GeneratedImagesTray: React.FC<GeneratedImagesTrayProps> = ({ images, onImageSelect, currentImageUrl }) => {
  if (images.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-3">Generated Gallery</h2>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <motion.button
            key={image.url}
            onClick={() => {
              if (image.outfitIndex !== undefined && image.poseIndex !== undefined && image.poseIndex > -1) {
                onImageSelect(image.outfitIndex, image.poseIndex);
              }
            }}
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 dark:focus:ring-gray-200 dark:focus:ring-offset-gray-950 ${
              currentImageUrl === image.url
                ? 'border-blue-500'
                : 'border-gray-200/80 dark:border-gray-700/80 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Select image ${image.name}`}
            aria-pressed={currentImageUrl === image.url}
          >
            <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
            {currentImageUrl === image.url && (
                <div className="absolute inset-0 bg-blue-500/20 pointer-events-none"></div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default GeneratedImagesTray;
