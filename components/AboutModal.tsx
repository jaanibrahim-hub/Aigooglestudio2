/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👗</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">VirtueWear</h2>
                <p className="text-blue-100">Where Style Meets Intelligence</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Story Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                The Story Behind VirtueWear
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-3 text-gray-700 dark:text-gray-300">
                <p>
                  <strong>Hey there, fashion enthusiast! 👋</strong>
                </p>
                <p>
                  Welcome to <strong>VirtueWear</strong> - your AI-powered virtual closet that's about to revolutionize how you experience fashion! 
                  Imagine being able to try on any outfit, in any style, anywhere in the world - from Tokyo street fashion to 
                  Parisian cafe elegance - all without leaving your home. That's exactly what we've built for you!
                </p>
                <p>
                  <strong>🎭 The Magic Behind the Mirror:</strong><br/>
                  Using cutting-edge Google nano-banana AI technology, VirtueWear transforms your photos into a virtual runway. 
                  Upload your picture once, and watch as our AI preserves your unique identity while letting you experiment with 
                  endless fashion possibilities across <strong>11 specialized categories</strong> and <strong>500+ global locations</strong>.
                </p>
                <p>
                  <strong>✨ Why VirtueWear is Different:</strong><br/>
                  Unlike simple photo editors, VirtueWear maintains your facial features, body proportions, and natural appearance 
                  while seamlessly integrating new clothing. It's like having a magic mirror that shows you in any outfit, 
                  anywhere in the world!
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                How VirtueWear Works
              </h3>
              <div className="grid gap-4">
                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Upload Your Photo</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Start by uploading a clear photo of yourself. Our AI creates a full-body model while preserving your unique features.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Build Your Virtual Wardrobe</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload clothing items across 11 categories: tops, bottoms, shoes, jewelry, bags, and more. Each category uses specialized AI processing.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Try On & Pose</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mix and match outfits, then choose from 500+ professional poses in locations worldwide - from Tokyo streets to Parisian cafes!</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Share & Save</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Download your virtual try-on photos or save them to your gallery. Perfect for social media, online shopping, or planning outfits!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                What Makes VirtueWear Special
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> AI-powered identity preservation
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> 11 specialized clothing categories
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> 500+ location-based poses
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> Background transformations
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> Face-only replacement technology
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> Multi-item outfit coordination
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> Professional styling results
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✅</span> No subscription required
                </div>
              </div>
            </div>

            {/* Creator Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-2xl">👨‍💻</span>
                Meet the Creator
              </h3>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    UY
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Usman Yousaf</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Engineer & Fashion Tech Innovator</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>🌟 The Visionary:</strong> Usman is passionate about bridging the gap between artificial intelligence and everyday life. 
                  With a background in AI engineering and a keen eye for fashion technology, he created VirtueWear to democratize fashion experimentation 
                  and make virtual try-on technology accessible to everyone.
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <a 
                    href="https://linkedin.com/in/usman9999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn Profile
                  </a>
                  
                  <a 
                    href="https://topmate.io/deepdive" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Consultation
                  </a>
                  
                  <a 
                    href="https://use1.link/usman" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Other Projects
                  </a>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/30 dark:border-purple-400/30">
              <div className="mb-4">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Ready to Transform Your Style?
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Join thousands of fashion enthusiasts using VirtueWear to explore their style potential!
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Your Fashion Journey ✨
                </button>
                <button
                  onClick={() => window.open('https://linkedin.com/in/usman9999', '_blank')}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium transition-all"
                >
                  Connect with Creator
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AboutModal;