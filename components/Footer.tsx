/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon } from './icons';

const APP_TIPS = [
  "💡 AI-powered virtual try-on using Google's nano-banana model",
  "💰 Cost: $0.04 per image • $1 = 25 virtual try-ons",
  "🎨 Upload any garment and see it on your model instantly",
  "👥 Choose model type: Man, Woman, or Kid for better fitting",
  "✨ Multi-layer outfits: Select multiple items for one generation",
  "👤 Face/Identity swap: Change faces while keeping clothing",
  "💇 Hair/Hairstyle: Independent hair changes and styling",
  "🔄 Generated Gallery: View all your created looks in one place",
  "📱 Mobile-friendly: Works perfectly on all devices",
  "🎭 11 categories: Tops, Bottoms, Shoes, Face, Hair, Jewelry & more",
  "🚀 Powered by Replicate API and advanced AI technology",
  "💾 Auto-save: Your wardrobe items persist across sessions",
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
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % APP_TIPS.length);
    }, 5000); // Change tip every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed left-0 top-0 bottom-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-r border-gray-200/60 dark:border-gray-800/60 p-3 z-40 w-16 flex flex-col items-center justify-between ${isOnDressingScreen ? 'hidden sm:flex' : 'flex'}`}>
      {/* Theme Toggle at Top */}
      <button
        onClick={onToggleTheme}
        className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mb-4"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <SunIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Rotating Tips in the Middle */}
      <div className="flex-1 flex items-center justify-center">
        <div className="transform -rotate-90 w-80 text-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={suggestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap"
            >
              {APP_TIPS[suggestionIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Creator Info at Bottom */}
      <div className="transform -rotate-90 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Created by{' '}
          <a 
            href="https://use1.link/usman" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-gray-800 dark:text-gray-200 hover:underline"
          >
            USMANYOUSAF
          </a>
        </p>
      </div>
    </div>
  );
};

export default Footer;