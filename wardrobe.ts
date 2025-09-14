/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted for easy access
export const defaultWardrobe: WardrobeItem[] = [
  // Tops
  {
    id: 'gemini-sweat',
    name: 'Gemini Sweat',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/gemini-sweat-2.png',
    category: 'top',
  },
  {
    id: 'gemini-tee',
    name: 'Gemini Tee',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/Gemini-tee.png',
    category: 'top',
  },
  // Bottoms
  {
    id: 'classic-jeans',
    name: 'Classic Jeans',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/jeans.png',
    category: 'bottom',
  },
  // Shoes
  {
    id: 'white-sneakers',
    name: 'White Sneakers',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/sneakers.png',
    category: 'shoes',
  },
  // Accessories
  {
    id: 'chain-necklace',
    name: 'Chain Necklace',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/necklace.png',
    category: 'accessory',
  },
  // Held Items
  {
    id: 'coffee-cup',
    name: 'Coffee Cup',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/coffee.png',
    category: 'held',
  }
];