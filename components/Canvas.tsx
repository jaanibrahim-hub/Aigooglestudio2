/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RotateCcwIcon, ImageIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onOpenGallery: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onOpenGallery }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center">
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center text-center bg-white/60 dark:bg-gray-800/60 border border-gray-300/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 active:scale-95 text-sm backdrop-blur-sm"
        >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Start Over
        </button>
        <button 
            onClick={onOpenGallery}
            className="flex items-center justify-center text-center bg-white/60 dark:bg-gray-800/60 border border-gray-300/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 active:scale-95 text-sm backdrop-blur-sm"
        >
            <ImageIcon className="w-4 h-4 mr-2" />
            View Gallery
        </button>
      </div>

      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl} // Use key to force re-render and trigger animation on image change
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-600 dark:text-gray-400 mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 dark:text-gray-300 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Canvas;