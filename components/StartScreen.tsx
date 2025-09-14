/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage, compressImage } from '../lib/utils';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const checkImageDimensions = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
          if (img.width < 256 || img.height < 256) {
              reject(new Error('Image is too small. Please use an image at least 256x256 pixels.'));
          } else {
              resolve();
          }
          URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
          reject(new Error('Could not load image to check dimensions. It might be corrupted.'));
          URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
  });
};

const validateApiKey = (key: string): boolean => {
  // Replicate API keys typically start with 'r8_'
  return key.startsWith('r8_') && key.length > 10;
};

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [replicateKey, setReplicateKey] = useState('');
  const [isKeySubmitted, setIsKeySubmitted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    const savedKey = localStorage.getItem('replicate_api_key');
    if (savedKey) {
      setReplicateKey(savedKey);
      setIsKeySubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleKeySave = () => {
    const trimmedKey = replicateKey.trim();
    if (!trimmedKey) {
        setError('Please enter a valid Replicate API Key.');
        return;
    }
    
    if (!validateApiKey(trimmedKey)) {
        setError('Invalid API key format. Replicate keys usually start with "r8_".');
        return;
    }

    localStorage.setItem('replicate_api_key', trimmedKey);
    setIsKeySubmitted(true);
    setError(null);
  };
  
  const handleClearKey = () => {
      localStorage.removeItem('replicate_api_key');
      setReplicateKey('');
      setIsKeySubmitted(false);
      reset();
  };


  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 10MB.`);
        return;
    }
    
    if (!navigator.onLine) {
        setError('No internet connection. Please check your connection and try again.');
        return;
    }

    try {
        await checkImageDimensions(file);
    } catch (dimError: any) {
        setError(dimError.message);
        return;
    }

    setIsGenerating(true);
    setGeneratedModelUrl(null);
    setError(null);
    setGenerationProgress(10);

    try {
        console.log('Original file:', { name: file.name, size: file.size, type: file.type });
        
        const compressedFile = await compressImage(file);
        console.log('Compressed file:', { name: compressedFile.name, size: compressedFile.size, type: compressedFile.type });
        
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(compressedFile);
        });
        console.log('Data URL length:', dataUrl.length);
        console.log('Data URL prefix:', dataUrl.substring(0, 50) + '...');

        setUserImageUrl(dataUrl);

        const result = await generateModelImage(compressedFile, { backgroundColor });
        setGeneratedModelUrl(result);
        setGenerationProgress(100);
    } catch (err) {
        console.error('Full error:', err);
        setError(getFriendlyErrorMessage(err, 'Failed to create model'));
        setUserImageUrl(null);
        setGenerationProgress(0);
    } finally {
        setIsGenerating(false);
    }
  }, [backgroundColor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
    setGenerationProgress(0);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const renderContent = () => {
    if (!isKeySubmitted) {
      return (
        <motion.div
            key="api-key-screen"
            className="w-full max-w-md mx-auto p-4 text-center"
            variants={screenVariants}
            initial="initial" animate="animate" exit="exit"
        >
            <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
              API Key Required
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              This app uses the Replicate API to generate images. Please enter your API key to continue. You can get one from the{' '}
              <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                Replicate website
              </a>.
            </p>
            <div className="mt-8">
              <label htmlFor="replicate-key" className="sr-only">Replicate API Key</label>
              <input
                  id="replicate-key"
                  type="password"
                  value={replicateKey}
                  onChange={(e) => setReplicateKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleKeySave()}
                  placeholder="r8_..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 text-center font-mono"
              />
            </div>
            <button 
              onClick={handleKeySave} 
              className="mt-6 w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
            >
              Save and Continue
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4" role="alert">{error}</p>}
        </motion.div>
      )
    }

    if (!userImageUrl) {
      return (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 relative"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="absolute top-0 right-0 p-4 text-xs z-10">
              <button onClick={handleClearKey} className="font-semibold text-gray-500 dark:text-gray-400 hover:underline">
                  Change API Key
              </button>
          </div>

          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-lg p-4 rounded-lg transition-colors duration-300 ${isDragOver ? 'bg-gray-100 dark:bg-gray-800/50' : ''}`}
            >
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                Create Your Model for Any Look.
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Ever wondered how an outfit would look on you? Stop guessing. Upload a photo and see for yourself. Our AI creates your personal model, ready to try on anything.
              </p>
              <hr className="my-8 border-gray-200 dark:border-gray-800" />
              <div className="w-full space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Choose a background for your model
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBackgroundColor('white')}
                      className={`w-full px-4 py-3 text-sm font-semibold rounded-md transition-colors border ${
                        backgroundColor === 'white'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-black'
                          : 'bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      White Background
                    </button>
                    <button
                      onClick={() => setBackgroundColor('black')}
                      className={`w-full px-4 py-3 text-sm font-semibold rounded-md transition-colors border ${
                        backgroundColor === 'black'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-black'
                          : 'bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Black Background
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-start w-full gap-3">
                  <label htmlFor="image-upload-start" className="w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors">
                    <UploadCloudIcon className="w-5 h-5 mr-3" />
                    {isDragOver ? 'Drop your image here' : 'Upload Photo or Drag & Drop'}
                  </label>
                  <input id="image-upload-start" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Select a clear, full-body photo (min 256x256). Face-only photos also work, but full-body is preferred for best results.</p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">By uploading, you agree not to create harmful, explicit, or unlawful content. This service is for creative and responsible use only.</p>
                  {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2" role="alert">{error}</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <Compare
              firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
              secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
              slideMode="drag"
              className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-gray-800"
            />
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="compare"
        className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
              The New You
            </h1>
            <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
              Drag the slider to see your transformation.
            </p>
          </div>
          
          {isGenerating && (
            <div className="w-full max-w-sm mt-6" role="status" aria-live="polite">
              <div className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300 font-serif mb-2">
                <Spinner />
                <span>Generating your model...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gray-800 dark:bg-gray-300 h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && 
            <div className="text-center md:text-left text-red-600 dark:text-red-400 max-w-md mt-6" role="alert">
              <p className="font-semibold">Generation Failed</p>
              <p className="text-sm mb-4">{error}</p>
              <button onClick={reset} className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline">Try Again</button>
            </div>
          }
          
          <AnimatePresence>
            {generatedModelUrl && !isGenerating && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center gap-4 mt-8"
              >
                <button 
                  onClick={reset}
                  className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Use Different Photo
                </button>
                <button 
                  onClick={() => onModelFinalized(generatedModelUrl)}
                  className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
                >
                  Proceed to Styling &rarr;
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="md:w-1/2 w-full flex items-center justify-center">
          <div 
            className={`relative rounded-[1.25rem] transition-all duration-700 ease-in-out ${isGenerating ? 'border border-gray-300 dark:border-gray-700 animate-pulse' : 'border border-transparent'}`}
          >
            <Compare
              firstImage={userImageUrl}
              secondImage={generatedModelUrl ?? userImageUrl}
              slideMode="drag"
              className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200 dark:bg-gray-800"
            />
          </div>
        </div>
      </motion.div>
    );
  }


  return (
    <AnimatePresence mode="wait">
      {renderContent()}
    </AnimatePresence>
  );
};

export default StartScreen;