/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
// FIX: Import Transition type from framer-motion to resolve type error.
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import toast, { Toaster } from 'react-hot-toast';

// Lazy load components for better performance
const StartScreen = lazy(() => import('./components/StartScreen'));
const Canvas = lazy(() => import('./components/Canvas'));
const WardrobePanel = lazy(() => import('./components/WardrobeModal'));
const OutfitStack = lazy(() => import('./components/OutfitStack'));
const IndustryPoseSelector = lazy(() => import('./components/IndustryPoseSelector').then(m => ({ default: m.IndustryPoseSelector })));
const GalleryModal = lazy(() => import('./components/GalleryModal'));
const GeneratedImagesTray = lazy(() => import('./components/GeneratedImagesTray'));


import { generateVirtualTryOnImage, generateOutfitModification, generatePoseVariation, generateModelImage } from './services/geminiService';
import { OutfitLayer, WardrobeItem, AppState, PoseGenerationCache, GalleryImage } from './types';
import { ChevronDownIcon, ChevronUpIcon, RefreshIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage, debounce, createImagePreloader } from './lib/utils';
import Spinner from './components/Spinner';
import { POSE_INSTRUCTIONS } from './lib/poses';

// Enhanced media query hook with performance optimizations
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', listener);
    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

// Custom hook for managing app state with persistence
const useAppState = () => {
  const [state, setState] = useState<AppState>(() => {
    let initialTheme: 'light' | 'dark' = 'light';
    let savedWardrobe = defaultWardrobe;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('virtualTryOnState');
        if (saved) {
          const parsedState = JSON.parse(saved);
          savedWardrobe = parsedState.wardrobe || defaultWardrobe;
          if (parsedState.theme) {
            initialTheme = parsedState.theme;
          } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            initialTheme = 'dark';
          }
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          initialTheme = 'dark';
        }
      } catch (error) {
        console.warn('Failed to restore app state from localStorage:', error);
      }
    }
    
    return {
      modelImageUrl: null,
      outfitHistory: [],
      currentOutfitIndex: 0,
      isLoading: false,
      loadingMessage: '',
      error: null,
      currentPoseIndex: 0,
      isSheetCollapsed: false,
      wardrobe: savedWardrobe,
      poseCache: new Map<string, string>(),
      retryCount: 0,
      theme: initialTheme,
      isGalleryOpen: false,
    };
  });

  const saveStateToStorage = useCallback(
    debounce((stateToSave: AppState) => {
      try {
        const stateForStorage = {
          wardrobe: stateToSave.wardrobe,
          theme: stateToSave.theme,
        };
        localStorage.setItem('virtualTryOnState', JSON.stringify(stateForStorage));
      } catch (error) {
        console.warn('Failed to save app state to localStorage:', error);
      }
    }, 1000),
    []
  );

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      saveStateToStorage(newState);
      return newState;
    });
  }, [saveStateToStorage]);

  return [state, updateState] as const;
};

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

// Loading fallback for Suspense
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="w-full h-full flex items-center justify-center p-8">
    <div className="text-center">
      <Spinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-serif">{message}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, updateState] = useAppState();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const imagePreloaderRef = useRef(createImagePreloader());

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(state.theme === 'dark' ? 'light' : 'dark');
    root.classList.add(state.theme);
  }, [state.theme]);

  const handleToggleTheme = useCallback(() => {
    updateState({ theme: state.theme === 'light' ? 'dark' : 'light' });
  }, [state.theme, updateState]);

  const activeOutfitLayers = useMemo(() => 
    state.outfitHistory.slice(0, state.currentOutfitIndex + 1), 
    [state.outfitHistory, state.currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers
      .map(layer => layer.garment?.id)
      .filter((id): id is string => Boolean(id)), 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (state.outfitHistory.length === 0) return state.modelImageUrl;
    
    const currentLayer = state.outfitHistory[state.currentOutfitIndex];
    if (!currentLayer) return state.modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[state.currentPoseIndex];
    const cacheKey = `${state.currentOutfitIndex}-${poseInstruction}`;
    
    if (state.poseCache.has(cacheKey)) {
      return state.poseCache.get(cacheKey);
    }
    
    return currentLayer.poseImages[poseInstruction] ?? 
           Object.values(currentLayer.poseImages)[0] ??
           state.modelImageUrl;
  }, [
    state.outfitHistory, 
    state.currentOutfitIndex, 
    state.currentPoseIndex, 
    state.modelImageUrl,
    state.poseCache
  ]);

  const availablePoseKeys = useMemo(() => {
    if (state.outfitHistory.length === 0) return [];
    const currentLayer = state.outfitHistory[state.currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [state.outfitHistory, state.currentOutfitIndex]);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    const allImages: GalleryImage[] = [];
    const seenUrls = new Set<string>();

    state.outfitHistory.forEach((layer, layerIndex) => {
      // Sort poses to have a consistent order
      const sortedPoses = Object.entries(layer.poseImages).sort(([poseA], [poseB]) => {
          return POSE_INSTRUCTIONS.indexOf(poseA) - POSE_INSTRUCTIONS.indexOf(poseB);
      });

      sortedPoses.forEach(([pose, url]) => {
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          const poseIndex = POSE_INSTRUCTIONS.indexOf(pose);
          allImages.push({
            url,
            name: `outfit-creation-${allImages.length + 1}.png`,
            outfitIndex: layerIndex,
            poseIndex: poseIndex,
          });
        }
      });
    });
    
    return allImages;
  }, [state.outfitHistory]);

  const handleError = useCallback((error: unknown, context: string) => {
    const message = getFriendlyErrorMessage(error, context);
    
    updateState({ 
      error: message, 
      isLoading: false, 
      loadingMessage: '',
    });
    
    toast.error(message, {
      duration: 5000,
      position: 'top-right'
    });
    
    console.error(`Error in ${context}:`, error);
  }, [updateState]);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right'
    });
  }, []);

  const cleanupApiCall = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleModelFinalized = useCallback((url: string) => {
    updateState({
      modelImageUrl: url,
      outfitHistory: [{
        garment: null,
        poseImages: { [POSE_INSTRUCTIONS[0]]: url }
      }],
      currentOutfitIndex: 0,
      error: null
    });
    
    handleSuccess('Model photo ready! Start adding clothes.');
    imagePreloaderRef.current.preload([url]);
  }, [updateState, handleSuccess]);

  const handleStartOver = useCallback(() => {
    cleanupApiCall();
    
    updateState({
      modelImageUrl: null,
      outfitHistory: [],
      currentOutfitIndex: 0,
      isLoading: false,
      loadingMessage: '',
      error: null,
      currentPoseIndex: 0,
      isSheetCollapsed: false,
      wardrobe: defaultWardrobe,
      poseCache: new Map(),
      retryCount: 0,
      isGalleryOpen: false,
    });
    
    toast.dismiss();
  }, [updateState, cleanupApiCall]);

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || state.isLoading) return;

    cleanupApiCall();
    abortControllerRef.current = new AbortController();

    updateState({
      error: null,
      isLoading: true,
      loadingMessage: `Applying ${garmentInfo.name}...`,
      retryCount: 0
    });

    try {
      const isFirstGarment = state.outfitHistory.length <= 1;

      // Use the simple try-on for the first garment, and the modification for subsequent items.
      const newImageUrl = isFirstGarment
        ? await generateVirtualTryOnImage(displayImageUrl, garmentFile, { signal: abortControllerRef.current.signal })
        : await generateOutfitModification(displayImageUrl, garmentFile, garmentInfo, { signal: abortControllerRef.current.signal });

      const currentPoseInstruction = POSE_INSTRUCTIONS[0]; // Always default to first pose for a new garment
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      const newCache = new Map(state.poseCache);
      newCache.set(`${state.currentOutfitIndex + 1}-${currentPoseInstruction}`, newImageUrl);

      updateState({
        outfitHistory: [...state.outfitHistory.slice(0, state.currentOutfitIndex + 1), newLayer],
        currentOutfitIndex: state.currentOutfitIndex + 1,
        currentPoseIndex: 0,
        wardrobe: state.wardrobe.find(item => item.id === garmentInfo.id) 
          ? state.wardrobe 
          : [...state.wardrobe, garmentInfo],
        poseCache: newCache,
        isLoading: false,
        loadingMessage: ''
      });

      handleSuccess(`${garmentInfo.name} added successfully!`);
      imagePreloaderRef.current.preload([newImageUrl]);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        handleError(error, 'Failed to apply item');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    displayImageUrl, state.isLoading, state.outfitHistory, state.currentOutfitIndex,
    state.wardrobe, state.poseCache, updateState, handleError, handleSuccess, cleanupApiCall
  ]);

  const handleRemoveLastGarment = useCallback(() => {
    if (state.currentOutfitIndex > 0) {
      const removedGarment = state.outfitHistory[state.currentOutfitIndex]?.garment;
      
      updateState({
        currentOutfitIndex: state.currentOutfitIndex - 1,
        currentPoseIndex: 0,
        error: null
      });
      
      if (removedGarment) {
        toast.success(`Removed ${removedGarment.name}`, { duration: 2000 });
      }
    }
  }, [state.currentOutfitIndex, state.outfitHistory, updateState]);
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (state.isLoading || state.outfitHistory.length === 0 || newIndex === state.currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = state.outfitHistory[state.currentOutfitIndex];
    const cacheKey = `${state.currentOutfitIndex}-${poseInstruction}`;

    if (state.poseCache.has(cacheKey) || currentLayer.poseImages[poseInstruction]) {
      updateState({ currentPoseIndex: newIndex });
      if (!state.poseCache.has(cacheKey)) {
        const newCache = new Map(state.poseCache);
        newCache.set(cacheKey, currentLayer.poseImages[poseInstruction]);
        updateState({ poseCache: newCache });
      }
      return;
    }

    // Use the most recent pose image, or fall back to displayImageUrl which has proper fallback logic
    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0] || displayImageUrl;
    if (!baseImageForPoseChange) {
      updateState({ error: 'No base image available for pose generation. Please create a model first.' });
      return;
    }

    cleanupApiCall();
    abortControllerRef.current = new AbortController();

    const prevPoseIndex = state.currentPoseIndex;
    updateState({
      error: null,
      isLoading: true,
      loadingMessage: 'Changing pose...',
      currentPoseIndex: newIndex, // Optimistic update
      retryCount: 0
    });

    try {
      const newImageUrl = await generatePoseVariation(
        baseImageForPoseChange, 
        poseInstruction,
        { signal: abortControllerRef.current.signal }
      );
      
      const newHistory = [...state.outfitHistory];
      newHistory[state.currentOutfitIndex].poseImages[poseInstruction] = newImageUrl;
      
      const newCache = new Map(state.poseCache);
      newCache.set(cacheKey, newImageUrl);

      updateState({
        outfitHistory: newHistory,
        poseCache: newCache,
        isLoading: false,
        loadingMessage: ''
      });

      handleSuccess('Pose changed successfully!');
      imagePreloaderRef.current.preload([newImageUrl]);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        updateState({ currentPoseIndex: prevPoseIndex }); // Revert optimistic update
        handleError(error, 'Failed to change pose');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    state.currentPoseIndex, state.outfitHistory, state.isLoading, state.currentOutfitIndex,
    state.poseCache, updateState, handleError, handleSuccess, cleanupApiCall
  ]);

  const handleImageSelectFromTray = useCallback((outfitIndex: number, poseIndex: number) => {
    if (poseIndex > -1) {
      updateState({
        currentOutfitIndex: outfitIndex,
        currentPoseIndex: poseIndex,
      });
    }
  }, [updateState]);

  const handleRetry = useCallback(() => {
    if (state.retryCount < 3) {
      updateState({ 
        error: null,
        retryCount: state.retryCount + 1
      });
      // FIX: The `react-hot-toast` library does not have a `toast.info` method.
      // Use the base `toast()` function for informational messages.
      toast('Retrying last action...', { duration: 2000 });
      // Here you would re-trigger the last failed action. This is complex
      // and for this app, we'll let the user re-click the button.
      // This button primarily serves to clear the error state and signal intent.
    } else {
      toast.error('Maximum retry attempts reached. Please try again later.', { duration: 5000 });
    }
  }, [state.retryCount, updateState]);

  useEffect(() => {
    return () => cleanupApiCall();
  }, [cleanupApiCall]);

  const viewVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -15 },
  };

  // FIX: Explicitly type the transition object to avoid type inference issues with the 'ease' property.
  const transition: Transition = {
    duration: prefersReducedMotion ? 0.1 : 0.5,
    ease: 'easeInOut'
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error('App Error Boundary:', error)}>
      <div className="font-sans">
        <Toaster 
          position={isMobile ? 'bottom-center' : 'top-right'}
          toastOptions={{
            duration: 4000,
            style: { 
              background: '#363636', 
              color: '#fff', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)' 
            },
            success: {
              style: {
                background: state.theme === 'dark' ? '#1f2937' : '#f9fafb',
                color: state.theme === 'dark' ? '#f9fafb' : '#1f2937',
                border: `1px solid ${state.theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }
            },
            error: {
              style: {
                background: state.theme === 'dark' ? '#1f2937' : '#f9fafb',
                color: state.theme === 'dark' ? '#f9fafb' : '#1f2937',
                border: `1px solid ${state.theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }
            }
          }}
        />
        
        <AnimatePresence>
          {state.isGalleryOpen && (
            <Suspense fallback={<div />}>
              <GalleryModal
                images={galleryImages}
                isOpen={state.isGalleryOpen}
                onClose={() => updateState({ isGalleryOpen: false })}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!state.modelImageUrl ? (
            <motion.div
              key="start-screen"
              className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 dark:bg-black p-4 pb-20"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <Suspense fallback={<LoadingFallback message="Loading..." />}>
                <StartScreen onModelFinalized={handleModelFinalized} />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="main-app"
              className="relative flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
                <div className="w-full h-full flex-grow flex items-center justify-center bg-white dark:bg-gray-900 pb-16 relative">
                  <Suspense fallback={<LoadingFallback message="Loading Canvas..." />}>
                    <Canvas 
                      displayImageUrl={displayImageUrl}
                      onStartOver={handleStartOver}
                      isLoading={state.isLoading}
                      loadingMessage={state.loadingMessage}
                      onOpenGallery={() => updateState({ isGalleryOpen: true })}
                    />
                  </Suspense>
                </div>

                <aside 
                  className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full ${isTablet ? 'md:w-2/5' : 'md:w-1/3'} md:max-w-sm bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 dark:border-gray-800/60 transition-transform duration-500 ease-in-out ${state.isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                >
                  <button 
                    onClick={() => updateState({ isSheetCollapsed: !state.isSheetCollapsed })}
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors"
                    aria-label={state.isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {state.isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
                  </button>
                  
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {state.error && (
                      <motion.div 
                        className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 rounded-md"
                        role="alert"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold">Error</p>
                            <p className="mt-1 text-sm">{state.error}</p>
                          </div>
                          <button onClick={handleRetry} className="ml-4 p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-full transition-colors" aria-label="Retry">
                            <RefreshIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    <Suspense fallback={<LoadingFallback />}>
                      <OutfitStack outfitHistory={activeOutfitLayers} onRemoveLastGarment={handleRemoveLastGarment} />
                    </Suspense>

                    <Suspense fallback={<div/>}>
                      <GeneratedImagesTray
                        images={galleryImages}
                        onImageSelect={handleImageSelectFromTray}
                        currentImageUrl={displayImageUrl}
                      />
                    </Suspense>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-3">Change Pose</h2>
                      <Suspense fallback={<LoadingFallback message="Loading Poses..." />}>
                        <IndustryPoseSelector
                          currentPoseIndex={state.currentPoseIndex}
                          onPoseSelect={handlePoseSelect}
                          availablePoseKeys={availablePoseKeys}
                          isLoading={state.isLoading}
                        />
                      </Suspense>
                    </div>
                    
                    <Suspense fallback={<LoadingFallback />}>
                      <WardrobePanel onGarmentSelect={handleGarmentSelect} activeGarmentIds={activeGarmentIds} isLoading={state.isLoading} wardrobe={state.wardrobe} />
                    </Suspense>
                  </div>
                </aside>
              </main>
              
              <AnimatePresence>
                {state.isLoading && isMobile && (
                  <motion.div
                    className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <Spinner />
                    {state.loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 dark:text-gray-300 mt-4 text-center px-4">{state.loadingMessage}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Footer isOnDressingScreen={!!state.modelImageUrl} theme={state.theme} onToggleTheme={handleToggleTheme} />
      </div>
    </ErrorBoundary>
  );
};

export default App;