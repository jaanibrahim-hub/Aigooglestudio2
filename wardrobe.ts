/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted for easy access
export const defaultWardrobe: WardrobeItem[] = [
  // Tops (5 items)
  {
    id: 'gemini-sweat',
    name: 'Gemini Sweat',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/gemini-sweat-2.png',
    category: 'top',
    isPermanent: true,
  },
  {
    id: 'gemini-tee',
    name: 'Gemini Tee',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/Gemini-tee.png',
    category: 'top',
    isPermanent: true,
  },
  {
    id: 'black-tshirt',
    name: 'Black T-Shirt',
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
    category: 'top',
    isPermanent: true,
  },
  {
    id: 'white-shirt',
    name: 'White Dress Shirt',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop&crop=center',
    category: 'top',
    isPermanent: true,
  },
  {
    id: 'blue-hoodie',
    name: 'Blue Hoodie',
    url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&crop=center',
    category: 'top',
    isPermanent: true,
  },

  // Bottoms (5 items)
  {
    id: 'classic-jeans',
    name: 'Classic Jeans',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/jeans.png',
    category: 'bottom',
    isPermanent: true,
  },
  {
    id: 'black-pants',
    name: 'Black Pants',
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center',
    category: 'bottom',
    isPermanent: true,
  },
  {
    id: 'cargo-shorts',
    name: 'Cargo Shorts',
    url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop&crop=center',
    category: 'bottom',
    isPermanent: true,
  },
  {
    id: 'blue-jeans',
    name: 'Blue Jeans',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center',
    category: 'bottom',
    isPermanent: true,
  },
  {
    id: 'khaki-chinos',
    name: 'Khaki Chinos',
    url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop&crop=center',
    category: 'bottom',
    isPermanent: true,
  },

  // Shoes (5 items)
  {
    id: 'white-sneakers',
    name: 'White Sneakers',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/sneakers.png',
    category: 'shoes',
    isPermanent: true,
  },
  {
    id: 'black-sneakers',
    name: 'Black Sneakers',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
    category: 'shoes',
    isPermanent: true,
  },
  {
    id: 'brown-boots',
    name: 'Brown Boots',
    url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=400&fit=crop&crop=center',
    category: 'shoes',
    isPermanent: true,
  },
  {
    id: 'dress-shoes',
    name: 'Black Dress Shoes',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop&crop=center',
    category: 'shoes',
    isPermanent: true,
  },
  {
    id: 'canvas-shoes',
    name: 'Canvas Shoes',
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
    category: 'shoes',
    isPermanent: true,
  },

  // Face/Identity (5 items) - NEW CATEGORY
  {
    id: 'face-male-1',
    name: 'Professional Man',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/face-male-professional.jpg',
    category: 'face',
    isPermanent: true,
  },
  {
    id: 'face-female-1',
    name: 'Professional Woman',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/face-female-professional.jpg',
    category: 'face',
    isPermanent: true,
  },
  {
    id: 'face-male-2',
    name: 'Young Man',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/face-male-young.jpg',
    category: 'face',
    isPermanent: true,
  },
  {
    id: 'face-female-2',
    name: 'Young Woman',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/face-female-young.jpg',
    category: 'face',
    isPermanent: true,
  },
  {
    id: 'face-kid-1',
    name: 'Kid Face',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/face-kid.jpg',
    category: 'face',
    isPermanent: true,
  },

  // Hair/Hairstyle (5 items) - NEW CATEGORY
  {
    id: 'hair-short-male',
    name: 'Short Male Hair',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/hair-short-male.jpg',
    category: 'hair',
    isPermanent: true,
  },
  {
    id: 'hair-long-female',
    name: 'Long Female Hair',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/hair-long-female.jpg',
    category: 'hair',
    isPermanent: true,
  },
  {
    id: 'hair-curly',
    name: 'Curly Hair',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/hair-curly.jpg',
    category: 'hair',
    isPermanent: true,
  },
  {
    id: 'hair-buzz-cut',
    name: 'Buzz Cut',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/hair-buzz-cut.jpg',
    category: 'hair',
    isPermanent: true,
  },
  {
    id: 'hair-bob',
    name: 'Bob Cut',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/hair-bob-cut.jpg',
    category: 'hair',
    isPermanent: true,
  },

  // Jewelry (5 items) - EXPANDED CATEGORY
  {
    id: 'chain-necklace',
    name: 'Chain Necklace',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/necklace.png',
    category: 'jewelry',
    isPermanent: true,
  },
  {
    id: 'pearl-necklace',
    name: 'Pearl Necklace',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/pearl-necklace.jpg',
    category: 'jewelry',
    isPermanent: true,
  },
  {
    id: 'gold-earrings',
    name: 'Gold Earrings',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/gold-earrings.jpg',
    category: 'jewelry',
    isPermanent: true,
  },
  {
    id: 'silver-ring',
    name: 'Silver Ring',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/silver-ring.jpg',
    category: 'jewelry',
    isPermanent: true,
  },
  {
    id: 'bracelet',
    name: 'Silver Bracelet',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/silver-bracelet.jpg',
    category: 'jewelry',
    isPermanent: true,
  },

  // Eyewear (5 items) - EXPANDED CATEGORY
  {
    id: 'black-sunglasses',
    name: 'Black Sunglasses',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/black-sunglasses.jpg',
    category: 'eyewear',
    isPermanent: true,
  },
  {
    id: 'reading-glasses',
    name: 'Reading Glasses',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/reading-glasses.jpg',
    category: 'eyewear',
    isPermanent: true,
  },
  {
    id: 'aviator-sunglasses',
    name: 'Aviator Sunglasses',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/aviator-sunglasses.jpg',
    category: 'eyewear',
    isPermanent: true,
  },
  {
    id: 'designer-glasses',
    name: 'Designer Glasses',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/designer-glasses.jpg',
    category: 'eyewear',
    isPermanent: true,
  },
  {
    id: 'sport-sunglasses',
    name: 'Sport Sunglasses',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/sport-sunglasses.jpg',
    category: 'eyewear',
    isPermanent: true,
  },

  // Bags (5 items) - NEW CATEGORY
  {
    id: 'leather-backpack',
    name: 'Leather Backpack',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    category: 'bags',
    isPermanent: true,
  },
  {
    id: 'crossbody-bag',
    name: 'Crossbody Bag',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center',
    category: 'bags',
    isPermanent: true,
  },
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    url: 'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=400&h=400&fit=crop&crop=center',
    category: 'bags',
    isPermanent: true,
  },
  {
    id: 'messenger-bag',
    name: 'Messenger Bag',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    category: 'bags',
    isPermanent: true,
  },
  {
    id: 'clutch-purse',
    name: 'Clutch Purse',
    url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop&crop=center',
    category: 'bags',
    isPermanent: true,
  },

  // Watches (5 items) - NEW CATEGORY
  {
    id: 'digital-watch',
    name: 'Digital Watch',
    url: 'https://images.unsplash.com/photo-1524805444973-bf390e7dcc26?w=400&h=400&fit=crop&crop=center',
    category: 'watches',
    isPermanent: true,
  },
  {
    id: 'luxury-watch',
    name: 'Luxury Watch',
    url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop&crop=center',
    category: 'watches',
    isPermanent: true,
  },
  {
    id: 'sport-watch',
    name: 'Sport Watch',
    url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop&crop=center',
    category: 'watches',
    isPermanent: true,
  },
  {
    id: 'apple-watch',
    name: 'Smart Watch',
    url: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop&crop=center',
    category: 'watches',
    isPermanent: true,
  },
  {
    id: 'vintage-watch',
    name: 'Vintage Watch',
    url: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&h=400&fit=crop&crop=center',
    category: 'watches',
    isPermanent: true,
  },

  // Other Accessories (5 items) - NEW CATEGORY
  {
    id: 'baseball-cap',
    name: 'Baseball Cap',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop&crop=center',
    category: 'accessories',
    isPermanent: true,
  },
  {
    id: 'leather-belt',
    name: 'Leather Belt',
    url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop&crop=center',
    category: 'accessories',
    isPermanent: true,
  },
  {
    id: 'winter-scarf',
    name: 'Winter Scarf',
    url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop&crop=center',
    category: 'accessories',
    isPermanent: true,
  },
  {
    id: 'fedora-hat',
    name: 'Fedora Hat',
    url: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=400&fit=crop&crop=center',
    category: 'accessories',
    isPermanent: true,
  },
  {
    id: 'tie',
    name: 'Neck Tie',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
    category: 'accessories',
    isPermanent: true,
  },

  // Held Items (5 items) - EXPANDED CATEGORY
  {
    id: 'coffee-cup',
    name: 'Coffee Cup',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/coffee.png',
    category: 'held',
    isPermanent: true,
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&crop=center',
    category: 'held',
    isPermanent: true,
  },
  {
    id: 'laptop',
    name: 'Laptop',
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center',
    category: 'held',
    isPermanent: true,
  },
  {
    id: 'book',
    name: 'Book',
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center',
    category: 'held',
    isPermanent: true,
  },
  {
    id: 'briefcase',
    name: 'Briefcase',
    url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop&crop=center',
    category: 'held',
    isPermanent: true,
  }
];