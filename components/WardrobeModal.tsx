/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem, ItemCategory, ModelType } from '../types';
import { UploadCloudIcon, CheckCircleIcon, TrashIcon } from './icons';
import { compressImage } from '../lib/utils';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  onUpdateWardrobe: (items: WardrobeItem[]) => void;
  onDeleteItem: (itemId: string) => void;
  selectedModelType: ModelType;
  onModelTypeChange: (modelType: ModelType) => void;
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

const CATEGORIES: { key: ItemCategory; label: string; icon: string }[] = [
    { key: 'top', label: 'Tops', icon: '👕' },
    { key: 'bottom', label: 'Bottoms', icon: '👖' },
    { key: 'shoes', label: 'Shoes', icon: '👟' },
    { key: 'face', label: 'Face/Identity', icon: '👤' },
    { key: 'hair', label: 'Hair/Hairstyle', icon: '💇' },
    { key: 'jewelry', label: 'Jewelry', icon: '💍' },
    { key: 'eyewear', label: 'Eyewear', icon: '👓' },
    { key: 'bags', label: 'Bags', icon: '👜' },
    { key: 'watches', label: 'Watches', icon: '⌚' },
    { key: 'accessories', label: 'Other Accessories', icon: '🧢' },
    { key: 'held', label: 'Held Items', icon: '☕' },
];

const MODEL_TYPES: { key: ModelType; label: string; icon: string }[] = [
    { key: 'man', label: 'Man', icon: '👨' },
    { key: 'woman', label: 'Woman', icon: '👩' },
    { key: 'kid', label: 'Kid', icon: '🧒' },
];

const WardrobePanel: React.FC<WardrobePanelProps> = ({ 
    onGarmentSelect, 
    activeGarmentIds, 
    isLoading, 
    wardrobe, 
    onUpdateWardrobe, 
    onDeleteItem,
    selectedModelType,
    onModelTypeChange 
}) => {
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

    const handleDeleteItem = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        if (isLoading) return;
        onDeleteItem(itemId);
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
                    isPermanent: false,
                };

                // Add to wardrobe
                const updatedWardrobe = [...wardrobe, customGarmentInfo];
                onUpdateWardrobe(updatedWardrobe);
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

    const getCategoryDescription = (category: ItemCategory): string => {
        switch (category) {
            case 'face': return 'Swap faces with different people while keeping body/clothing';
            case 'hair': return 'Change hairstyles independently of face swapping';
            case 'jewelry': return 'Add necklaces, rings, earrings, bracelets';
            case 'eyewear': return 'Add glasses, sunglasses, reading glasses';
            case 'bags': return 'Add handbags, backpacks, purses, briefcases';
            case 'watches': return 'Add wristwatches, smartwatches, luxury timepieces';
            case 'accessories': return 'Add hats, belts, scarves, ties, and other accessories';
            case 'held': return 'Add items to hold like phones, laptops, coffee, books';
            default: return '';
        }
    };

  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-4">Wardrobe</h2>
        
        {/* Model Type Selection */}
        <div className="mb-6">
            <h3 className="text-lg font-serif text-gray-800 dark:text-gray-200 mb-3">Model Type</h3>
            <div className="grid grid-cols-3 gap-2">
                {MODEL_TYPES.map((modelType) => (
                    <button
                        key={modelType.key}
                        onClick={() => onModelTypeChange(modelType.key)}
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedModelType === modelType.key
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span className="text-lg">{modelType.icon}</span>
                        {modelType.label}
                    </button>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Better fitting logic - AI understands target demographic and age-appropriate sizing
            </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 overflow-x-auto">
            <div className="flex border-b border-gray-200 dark:border-gray-700 min-w-max">
                {CATEGORIES.map(category => (
                    <button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeCategory === category.key
                                ? 'border-b-2 border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span className="text-base">{category.icon}</span>
                        {category.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Category Description */}
        {getCategoryDescription(activeCategory) && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    {getCategoryDescription(activeCategory)}
                </p>
            </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                return (
                    <div key={item.id} className="relative group">
                        <button
                            onClick={() => handleGarmentClick(item)}
                            disabled={isLoading}
                            className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 dark:focus:ring-gray-200 w-full disabled:opacity-60 disabled:cursor-not-allowed ${
                                isActive
                                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                            aria-label={`Select ${item.name}`}
                        >
                            <img 
                                src={item.url} 
                                alt={item.name} 
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                            </div>
                            {isActive && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                    <CheckCircleIcon className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                        
                        {/* Delete Button (only for non-permanent items) */}
                        {!item.isPermanent && (
                            <button
                                onClick={(e) => handleDeleteItem(e, item.id)}
                                disabled={isLoading}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                                aria-label={`Delete ${item.name}`}
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                );
            })}
            
            {/* Upload Button */}
            <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
                <input 
                    id="custom-garment-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                    onChange={handleFileChange} 
                    disabled={isLoading}
                />
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