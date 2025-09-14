/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem, ItemCategory } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';
import { compressImage } from '../lib/utils';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const urlToFile = async (url: string, filename: string): Promise<File> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
        const blob = await response.blob();
        const mimeType = blob.type || 'image/png';
        return new File([blob], filename, { type: mimeType });
    } catch (error) {
        console.error(`Error converting URL to file for "${filename}":`, error);
        throw new Error(`Failed to load image data. It might be a network or CORS issue.`);
    }
};

const CATEGORIES: { key: ItemCategory; label: string }[] = [
    { key: 'top', label: 'Tops' },
    { key: 'bottom', label: 'Bottoms' },
    { key: 'shoes', label: 'Shoes' },
    { key: 'accessory', label: 'Accessories' },
    { key: 'held', label: 'Held Items' },
];

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<ItemCategory>('top');

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading the garment.';
            setError(errorMessage);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 10MB.`);
                return;
            }
            try {
                const compressedFile = await compressImage(file);
                const customGarmentInfo: WardrobeItem = {
                    id: `custom-${Date.now()}`,
                    name: compressedFile.name,
                    url: URL.createObjectURL(compressedFile),
                    category: activeCategory, // Assign to the currently active category
                };
                onGarmentSelect(compressedFile, customGarmentInfo);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to process image.';
                setError(errorMessage);
            }
        }
    };

    const filteredWardrobe = useMemo(() => 
        wardrobe.filter(item => item.category === activeCategory),
        [wardrobe, activeCategory]
    );

  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-4">Wardrobe</h2>
        
        {/* Category Tabs */}
        <div className="mb-4 overflow-x-auto">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {CATEGORIES.map(category => (
                    <button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key)}
                        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeCategory === category.key
                                ? 'border-b-2 border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
                return (
                    <button
                        key={item.id}
                        onClick={() => handleGarmentClick(item)}
                        disabled={isLoading}
                        className="relative aspect-square border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 dark:focus:ring-gray-200 group disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label={`Select ${item.name}`}
                    >
                        <img src={item.url} alt={item.name} className="w-full h-full object-contain p-2 bg-gray-50 dark:bg-gray-800" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                        </div>
                    </button>
                );
            })}
            <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>
        {filteredWardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">No items in this category. Upload one!</p>
        )}
        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;