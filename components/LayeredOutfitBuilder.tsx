/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WardrobeItem, ItemCategory, ModelType } from '../types';
import { CheckCircleIcon, SparklesIcon, TrashIcon, UploadCloudIcon } from './icons';
import { compressImage } from '../lib/utils';

interface LayeredOutfitBuilderProps {
  wardrobe: WardrobeItem[];
  selectedModelType: ModelType;
  onGenerateLayeredOutfit: (selectedItems: WardrobeItem[], modelType: ModelType) => void;
  onUpdateWardrobe: (items: WardrobeItem[]) => void;
  onDeleteItem: (itemId: string) => void;
  onModelTypeChange: (modelType: ModelType) => void;
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
}

const CATEGORIES: { key: ItemCategory; label: string; icon: string; description: string }[] = [
  { key: 'top', label: 'Tops', icon: '👕', description: 'Shirts, t-shirts, hoodies, jackets' },
  { key: 'bottom', label: 'Bottoms', icon: '👖', description: 'Pants, jeans, shorts, skirts' },
  { key: 'shoes', label: 'Shoes', icon: '👟', description: 'Sneakers, boots, dress shoes' },
  { key: 'face', label: 'Face/Identity', icon: '👤', description: 'Swap faces while keeping body/clothing' },
  { key: 'hair', label: 'Hair/Hairstyle', icon: '💇', description: 'Change hairstyles independently' },
  { key: 'jewelry', label: 'Jewelry', icon: '💍', description: 'Necklaces, rings, earrings, bracelets' },
  { key: 'eyewear', label: 'Eyewear', icon: '👓', description: 'Glasses, sunglasses, reading glasses' },
  { key: 'bags', label: 'Bags', icon: '👜', description: 'Handbags, backpacks, purses, briefcases' },
  { key: 'watches', label: 'Watches', icon: '⌚', description: 'Wristwatches, smartwatches, luxury timepieces' },
  { key: 'accessories', label: 'Other Accessories', icon: '🧢', description: 'Hats, belts, scarves, ties' },
  { key: 'held', label: 'Held Items', icon: '☕', description: 'Items to hold like phones, laptops, coffee' },
];

const LayeredOutfitBuilder: React.FC<LayeredOutfitBuilderProps> = ({
  wardrobe,
  selectedModelType,
  onGenerateLayeredOutfit,
  onUpdateWardrobe,
  onDeleteItem,
  onModelTypeChange,
  onGarmentSelect,
  activeGarmentIds,
  isLoading
}) => {
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<ItemCategory | null>('top');
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const MODEL_TYPES: { key: ModelType; label: string; icon: string }[] = [
    { key: 'man', label: 'Man', icon: '👨' },
    { key: 'woman', label: 'Woman', icon: '👩' },
    { key: 'kid', label: 'Kid', icon: '🧒' },
  ];

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

  const handleSingleItemSelect = async (item: WardrobeItem) => {
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

  const handleItemToggle = (item: WardrobeItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        // Check if we already have an item from this category (for clothing categories)
        const clothingCategories: ItemCategory[] = ['top', 'bottom', 'shoes'];
        if (clothingCategories.includes(item.category)) {
          const filtered = prev.filter(selected => selected.category !== item.category);
          return [...filtered, item];
        } else {
          // For accessories/features, allow multiple selections
          return [...prev, item];
        }
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, category: ItemCategory) => {
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
          category: category,
          isPermanent: false,
        };

        // Add to wardrobe
        const updatedWardrobe = [...wardrobe, customGarmentInfo];
        onUpdateWardrobe(updatedWardrobe);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process image.';
        setError(errorMessage);
      }
    }
  };

  const handleDeleteItem = (itemId: string) => {
    // Remove from selected items if it was selected
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    onDeleteItem(itemId);
  };

  const handleGenerate = () => {
    if (selectedItems.length > 0) {
      onGenerateLayeredOutfit(selectedItems, selectedModelType);
    }
  };

  const getItemsByCategory = (category: ItemCategory) => {
    return wardrobe.filter(item => item.category === category);
  };

  const getSelectedItemByCategory = (category: ItemCategory) => {
    return selectedItems.find(item => item.category === category);
  };

  const selectedCount = selectedItems.length;
  const maxItems = 6; // nano-banana's capability

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-4">
          Complete Wardrobe
        </h2>
      </div>

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

      {/* Multi-Selection Header */}
      <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-serif text-gray-800 dark:text-gray-200 mb-2">
          Layered Outfit Builder
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select multiple items to create a complete outfit in one AI generation
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Selected: {selectedCount}/{maxItems}</span>
          <span className="text-blue-500">•</span>
          <span>Model: {selectedModelType}</span>
        </div>
      </div>

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
            Selected Items ({selectedCount})
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {selectedItems.map(item => (
              <div key={item.id} className="relative">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded border-2 border-blue-300 dark:border-blue-600"
                />
                <button
                  onClick={() => handleItemToggle(item)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map(category => {
          const items = getItemsByCategory(category.key);
          const selectedItem = getSelectedItemByCategory(category.key);
          const isExpanded = expandedCategory === category.key;
          
          // ALWAYS show all categories, even if empty

          return (
            <div key={category.key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {category.label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItem && (
                    <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                      <CheckCircleIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-700 dark:text-blue-300">Selected</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Category Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      {items.length === 0 ? (
                        // Empty category - show upload option and message
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No items in this category yet
                          </p>
                          <label 
                            htmlFor={`upload-${category.key}`} 
                            className="inline-flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 transition-colors hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                          >
                            <UploadCloudIcon className="w-8 h-8 mb-2"/>
                            <span className="text-sm font-semibold">Upload {category.label}</span>
                            <span className="text-xs">Add your first item to this category</span>
                            <input 
                              id={`upload-${category.key}`}
                              type="file" 
                              className="hidden" 
                              accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                              onChange={(e) => handleFileChange(e, category.key)} 
                              disabled={isLoading}
                            />
                          </label>
                        </div>
                      ) : (
                        // Category has items - show grid
                        <div className="grid grid-cols-3 gap-3">
                          {items.map(item => {
                        const isSelected = selectedItems.some(selected => selected.id === item.id);
                        const isActive = activeGarmentIds.includes(item.id);
                        return (
                          <div key={item.id} className="relative group">
                            <div className="relative aspect-square">
                              {/* Main item button */}
                              <button
                                onClick={() => handleSingleItemSelect(item)}
                                disabled={isLoading}
                                className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isActive
                                    ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                                    : isSelected
                                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                aria-label={`Apply ${item.name} immediately`}
                              >
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                                
                                {/* Hover overlay with item name */}
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-xs font-bold text-center p-1 mb-1">
                                    {item.name}
                                  </p>
                                  <p className="text-white text-xs opacity-80">
                                    Click: Apply Now
                                  </p>
                                  <p className="text-white text-xs opacity-80">
                                    ✓: Add to Layer
                                  </p>
                                </div>

                                {/* Active indicator */}
                                {isActive && (
                                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                                    <CheckCircleIcon className="w-3 h-3" />
                                  </div>
                                )}
                              </button>

                              {/* Multi-select toggle button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemToggle(item);
                                }}
                                disabled={isLoading || (selectedCount >= maxItems && !isSelected)}
                                className={`absolute top-2 right-2 rounded-full p-1 transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-blue-500 hover:text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                aria-label={`${isSelected ? 'Remove from' : 'Add to'} layered selection`}
                              >
                                <CheckCircleIcon className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Delete Button (only for non-permanent items) */}
                            {!item.isPermanent && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isLoading}
                                className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 z-10"
                                aria-label={`Delete ${item.name}`}
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      
                          {/* Upload Button for this category */}
                          <label 
                            htmlFor={`upload-${category.key}-grid`} 
                            className={`relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'}`}
                          >
                            <UploadCloudIcon className="w-5 h-5 mb-1"/>
                            <span className="text-xs text-center">Upload</span>
                            <input 
                              id={`upload-${category.key}-grid`}
                              type="file" 
                              className="hidden" 
                              accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                              onChange={(e) => handleFileChange(e, category.key)} 
                              disabled={isLoading}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <div className="sticky bottom-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
        <button
          onClick={handleGenerate}
          disabled={isLoading || selectedItems.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-5 h-5" />
          {isLoading ? 'Generating...' : selectedCount > 0 ? `Generate Layered Outfit (${selectedCount} items)` : 'Select Items for Layered Outfit'}
        </button>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          <p>
            <strong>Single Item:</strong> Click any item for immediate try-on
          </p>
          <p>
            <strong>Multi-Layer:</strong> Use ✓ button to select multiple items, then Generate
          </p>
          <p>
            Single API call • AI intelligently layers all selected items • Face/identity preserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default LayeredOutfitBuilder;