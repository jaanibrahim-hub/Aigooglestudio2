/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryImage } from '../types';
// FIX: Import the 'ImageIcon' component to resolve the 'Cannot find name' error.
import { DownloadIcon, XIcon, ImageIcon } from './icons';
import { downloadImage } from '../lib/utils';
import JSZip from 'jszip';

interface GalleryModalProps {
  images: GalleryImage[];
  isOpen: boolean;
  onClose: () => void;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ images, isOpen, onClose }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAll = async () => {
    if (isZipping || images.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      const imagePromises = images.map(async (image) => {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          zip.file(image.name, blob);
        } catch (error) {
            console.error(`Failed to fetch image for zipping: ${image.name}`, error)
        }
      });
      
      await Promise.all(imagePromises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'virtual-try-on-gallery.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error creating zip file', error);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-serif text-gray-800 dark:text-gray-200">Your Creations ({images.length})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAll}
                  disabled={isZipping || images.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <DownloadIcon className="w-4 h-4" />
                  {isZipping ? 'Zipping...' : 'Download All'}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close gallery"
                >
                  <XIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </header>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4">
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <motion.div
                      key={image.url}
                      className="relative aspect-[2/3] group rounded-lg overflow-hidden border dark:border-gray-800"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => downloadImage(image.url, image.name)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/80 text-black rounded-full hover:bg-white transition-colors backdrop-blur-sm"
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">Your Gallery is Empty</h3>
                  <p>Start creating new outfits and poses to see them here.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GalleryModal;