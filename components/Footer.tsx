/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon } from './icons';

const REMIX_SUGGESTIONS = [
  "Remix idea: Generate a shareable lookbook.",
  "Remix idea: Integrate an e-commerce API to find similar items.",
  "Remix idea: Add accessories like hats, sunglasses, or bags.",
  "Remix idea: Create a 'style score' for outfits.",
  "Remix idea: Let users save their favorite outfits.",
  "Remix idea: Generate different colorways for garments.",
];

interface FooterProps {
  isOnDressingScreen?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false, theme, onToggleTheme }) => {
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % REMIX_SUGGESTIONS.length);
    }, 4000); // Change suggestion every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-800/60 p-3 z-50 ${isOnDressingScreen ? 'hidden sm:block' : ''}`}>
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 dark:text-gray-400 max-w-7xl px-4">
        <div className="flex items-center gap-4">
          <p>
            Created by{' '}
            <a 
              href="https://x.com/ammaar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-gray-800 dark:text-gray-200 hover:underline"
            >
              @ammaar
            </a>
          </p>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <SunIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
        <div className="h-4 mt-1 sm:mt-0 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={suggestionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-center sm:text-right"
              >
                {REMIX_SUGGESTIONS[suggestionIndex]}
              </motion.p>
            </AnimatePresence>
        </div>
      </div>
    </footer>
  );
};

export default Footer;