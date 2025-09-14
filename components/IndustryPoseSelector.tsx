/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { POSE_CATEGORIES, POSE_INSTRUCTIONS, INDUSTRY_METADATA } from '../lib/poses';

export const IndustryPoseSelector: React.FC<{
  currentPoseIndex: number;
  onPoseSelect: (index: number) => void;
  availablePoseKeys: string[];
  isLoading: boolean;
}> = ({ currentPoseIndex, onPoseSelect, availablePoseKeys, isLoading }) => {
  const [filter, setFilter] = useState('all-all'); // e.g., 'industry-ecommerce', 'category-health'
  const [searchQuery, setSearchQuery] = useState('');

  const getIndustryRecommendations = useCallback((industry: string) => {
    const recommendations = {
      'fashion': ['ecommerce', 'beauty', 'editorial', 'lifestyle'],
      'healthcare': ['health', 'professional', 'corporate'],
      'tech': ['technology', 'professional', 'corporate'],
      'automotive': ['automotive', 'productAds', 'lifestyle'],
      'food': ['food', 'productAds', 'lifestyle'],
      'beauty': ['beauty', 'productAds', 'lifestyle'],
      'finance': ['finance', 'professional', 'corporate'],
      'education': ['education', 'professional', 'corporate'],
      'entertainment': ['entertainment', 'editorial', 'lifestyle'],
      'fitness': ['sports', 'health', 'lifestyle'],
      'media': ['entertainment', 'editorial', 'corporate'],
      'events': ['seasonal', 'lifestyle', 'corporate']
    };
    return recommendations[industry as keyof typeof recommendations] || ['professional'];
  }, []);

  const { filterType, filterValue } = useMemo(() => {
    const [type, ...valueParts] = filter.split('-');
    return { filterType: type, filterValue: valueParts.join('-') };
  }, [filter]);

  const filteredPoses = useMemo(() => {
    let posesSource: string[] = POSE_INSTRUCTIONS;

    if (filterType === 'industry') {
      const recommendedCategories = getIndustryRecommendations(filterValue);
      posesSource = recommendedCategories.flatMap(cat => POSE_CATEGORIES[cat as keyof typeof POSE_CATEGORIES] || []);
    } else if (filterType === 'category') {
      posesSource = POSE_CATEGORIES[filterValue as keyof typeof POSE_CATEGORIES] || [];
    }
    
    if (searchQuery) {
      posesSource = posesSource.filter(pose => 
        pose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return posesSource.map(pose => ({
      instruction: pose,
      index: POSE_INSTRUCTIONS.indexOf(pose),
      isGenerated: availablePoseKeys.includes(pose),
      category: Object.keys(POSE_CATEGORIES).find(cat => 
        POSE_CATEGORIES[cat as keyof typeof POSE_CATEGORIES].includes(pose)
      )
    }));
  }, [filterType, filterValue, searchQuery, availablePoseKeys, getIndustryRecommendations]);

  return (
    <div className="industry-pose-selector">
      {/* Enhanced Header with Stats */}
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="font-bold text-2xl text-gray-800 dark:text-gray-200">{POSE_INSTRUCTIONS.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Poses</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">{Object.keys(POSE_CATEGORIES).length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-green-600 dark:text-green-400">
              {availablePoseKeys.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Generated</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-purple-600 dark:text-purple-400">{filteredPoses.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Filtered</div>
          </div>
        </div>
      </div>

      {/* Unified Filter Section */}
      <div className="mb-4 space-y-3">
        {/* Unified Filter Dropdown */}
        <div>
          <label htmlFor="pose-filter" className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Filter Poses</label>
          <div className="relative">
            <select
              id="pose-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
            >
              <option value="all-all">All Poses ({POSE_INSTRUCTIONS.length})</option>
              <optgroup label="By Industry">
                {Object.keys(INDUSTRY_METADATA).map(industry => (
                  <option key={industry} value={`industry-${industry}`}>
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="By Category">
                {Object.entries(POSE_CATEGORIES).map(([category, poses]) => (
                  <option key={category} value={`category-${category}`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({poses.length})
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
            </div>
          </div>
        </div>
        
        {/* Enhanced Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search poses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pose Display */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 -mr-2">
        {filteredPoses.map(({ instruction, index, isGenerated, category }) => (
          <button
            key={index}
            onClick={() => onPoseSelect(index)}
            disabled={isLoading}
            className={`
              w-full relative p-3 text-left rounded-lg border transition-all duration-200
              ${currentPoseIndex === index 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md' 
                : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block leading-tight">
                  {instruction}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {category}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    #{index + 1}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {isGenerated && (
                  <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center" title="Generated">
                    <svg className="w-2 h-2 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {currentPoseIndex === index && (
                  <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full" title="Current Selection" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Enhanced No Results State */}
      {filteredPoses.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-medium mb-2">No poses found</p>
          <p className="text-sm mb-4">Try adjusting your search or filter.</p>
          <button
              onClick={() => {
                setFilter('all-all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset Filters
            </button>
        </div>
      )}
    </div>
  );
};

export default IndustryPoseSelector;