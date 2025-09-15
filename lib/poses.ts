/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Comprehensive pose instructions with industry-specific categories
export const POSE_CATEGORIES = {
  // Professional & Classic Poses (12 poses)
  professional: [
    "Full frontal view, hands on hips",
    "Slightly turned, 3/4 view", 
    "Side profile view",
    "Arms crossed, confident stance",
    "Hands clasped in front, professional pose",
    "One hand on hip, other arm relaxed",
    "Standing straight, arms at sides",
    "Slight lean forward, confident business pose",
    "Hands behind back, upright posture",
    "Power pose with chest out, chin up",
    "Formal portrait pose, slight smile",
    "Executive stance, hands in front"
  ],

  // E-commerce & Retail Poses (15 poses)
  ecommerce: [
    "Front view, arms naturally at sides for size reference",
    "Back view showing garment details and fit",
    "Side angle highlighting garment silhouette", 
    "Close-up torso shot focusing on fabric texture",
    "Full-length standing for complete outfit display",
    "Hands showing garment pockets or features",
    "Seated pose demonstrating garment flexibility",
    "Walking stride showing movement and drape",
    "Arms slightly raised showing underarm fit",
    "Turning motion showcasing garment flow",
    "Size comparison pose with hands on waist",
    "Layering demonstration with arms positioned to show all pieces",
    "Detail shot focusing on collar, cuffs, or trim",
    "Fit demonstration with one arm bent, one straight",
    "Product showcase pose highlighting key garment features"
  ],

  // Health & Wellness Poses (12 poses)
  health: [
    "Medical consultation standing pose, professional",
    "Wellness checkup relaxed standing position",
    "Healthcare worker confident stance",
    "Patient-friendly approachable pose",
    "Fitness assessment standing straight",
    "Therapy session comfortable seating pose",
    "Mental health supportive open body language",
    "Nutrition consultation friendly pose",
    "Physiotherapy demonstration pose",
    "Yoga instructor peaceful standing meditation",
    "Wellness coach motivational stance",
    "Healthcare professional with caring expression"
  ],

  // Product Advertisement Poses (18 poses)
  productAds: [
    "Holding product at chest level, showcasing item",
    "Using product naturally in daily life context",
    "Demonstrating product functionality with hands",
    "Happy customer testimonial pose with product",
    "Before/after comparison neutral stance",
    "Product unboxing excited expression",
    "Lifestyle integration pose using product casually",
    "Product comparison holding multiple items",
    "Satisfaction guarantee confident pose with product",
    "Gift-giving pose presenting product to camera",
    "Problem-solving demonstration with product in use",
    "Success story celebration pose with product",
    "Expert recommendation professional pose with item",
    "Family-friendly product demonstration pose",
    "Luxury product elegant presentation pose",
    "Tech product modern usage demonstration",
    "Beauty product application demonstration pose",
    "Home product lifestyle integration pose"
  ],

  // Beauty & Cosmetics Poses (14 poses)
  beauty: [
    "Close-up beauty shot, perfect for makeup display",
    "Skincare application gentle touching face",
    "Hair product showcase running fingers through hair",
    "Makeup tutorial step-by-step demonstration pose",
    "Before makeup natural confident pose",
    "After makeup glamorous transformation pose",
    "Skincare routine morning fresh face pose",
    "Beauty product testing curious expression",
    "Salon-quality results satisfaction pose",
    "Anti-aging demonstration touching smooth skin",
    "Color cosmetics vibrant expression pose",
    "Natural beauty minimalist pose",
    "Luxury beauty indulgent spa-like pose",
    "Beauty influencer tutorial pose with product"
  ],

  // Technology & Electronics Poses (12 poses)
  technology: [
    "Using smartphone modern casual pose",
    "Working on laptop professional setup",
    "Gaming enthusiast active engaged pose",
    "Smart home device interaction pose",
    "Wearable technology demonstration on wrist",
    "Video call professional setup pose",
    "Tech troubleshooting focused concentration pose",
    "Innovation showcase presenting device",
    "Digital lifestyle multitasking pose",
    "App demonstration interactive hand gestures",
    "Smart device setup instructional pose",
    "Tech-savvy user confident with multiple devices"
  ],

  // Automotive & Transportation Poses (10 poses)
  automotive: [
    "Car owner proud standing next to vehicle",
    "Driver safety demonstration in driver's seat",
    "Mechanic professional work pose",
    "Road trip adventure excited pose with car",
    "Luxury car lifestyle sophisticated pose",
    "Family car practical usage demonstration",
    "Electric vehicle eco-friendly conscious pose",
    "Car insurance confident protection pose",
    "Auto dealership professional sales pose",
    "Motorcycle rider gear demonstration pose"
  ],

  // Food & Beverage Poses (13 poses)
  food: [
    "Chef presenting signature dish with pride",
    "Food tasting delighted expression",
    "Cooking demonstration action pose",
    "Restaurant server professional presentation",
    "Home cooking family-friendly pose",
    "Healthy eating satisfied expression",
    "Beverage enjoyment refreshed pose",
    "Food photography styling pose",
    "Dining experience sophisticated pose",
    "Comfort food cozy satisfaction pose",
    "Gourmet food appreciation refined pose",
    "Street food casual enjoyment pose",
    "Organic food conscious consumer pose"
  ],

  // Real Estate & Home Poses (11 poses)
  realEstate: [
    "Homeowner proud in front of house",
    "Real estate agent professional presentation",
    "Interior designer showcasing room",
    "Home improvement project completion pose",
    "Garden enthusiast with landscaping",
    "Smart home technology demonstration",
    "Cozy home lifestyle relaxed pose",
    "Luxury real estate sophisticated presentation",
    "First-time buyer excited pose",
    "Home security confident protection pose",
    "Sustainable living eco-conscious pose"
  ],

  // Travel & Hospitality Poses (50 poses) - EXPANDED
  travel: [
    "Tourist excited at landmark destination",
    "Business traveler professional airport pose",
    "Vacation relaxation beach-style pose",
    "Adventure traveler outdoor exploration pose",
    "Luxury travel sophisticated resort pose",
    "Cultural experience immersive local pose",
    "Hotel guest satisfaction comfortable pose",
    "Travel guide expert recommendation pose",
    "Family vacation happy group dynamic",
    "Solo travel confident independent pose",
    "Eco-tourism responsible travel pose",
    "Travel blogger content creation pose",
    // Coffee Shop & Cafe Destinations (8 poses)
    "Cozy coffee shop regular enjoying morning brew with warm interior background",
    "Parisian cafe sidewalk seating with charming street background",
    "Modern minimalist coffee house with clean white brick background",
    "Vintage bookstore cafe with rustic wooden shelves background",
    "Rooftop coffee terrace with city skyline background",
    "Beach cafe tropical setting with ocean view background",
    "Mountain lodge coffee corner with fireplace and wood cabin background",
    "Airport coffee stand with departure gates background",
    // Shopping Districts & Malls (10 poses)
    "Luxury shopping district window browsing with designer store fronts background",
    "Bustling marketplace vendor interaction with colorful market stalls background",
    "Modern shopping mall center court with escalators and stores background",
    "Vintage thrift shopping with retro clothing racks background",
    "Outdoor farmers market with fresh produce stands background",
    "Designer boutique personal shopping with elegant store interior background",
    "Street food market casual dining with food vendor stalls background",
    "Antique shopping browsing with vintage collectibles background",
    "Electronics store tech shopping with modern gadget displays background",
    "Local artisan market crafts shopping with handmade goods background",
    // International City Destinations (12 poses)
    "Tokyo street crossing with neon signs and urban backdrop",
    "London phone booth classic pose with Big Ben in background",
    "New York Times Square energy with bright billboards background",
    "Paris Eiffel Tower romance with classic Parisian architecture background",
    "Rome ancient ruins exploration with Colosseum backdrop",
    "Barcelona Gaudi architecture admiration with colorful mosaic background",
    "Dubai modern skyline with futuristic buildings background",
    "Sydney Opera House waterfront with harbor bridge background",
    "Amsterdam canal side stroll with historic row houses background",
    "San Francisco Golden Gate Bridge with rolling hills background",
    "Venice gondola ride with romantic canal background",
    "Prague old town charm with medieval architecture background",
    // Beach & Tropical Destinations (8 poses)
    "Maldives overwater bungalow luxury with crystal clear water background",
    "Caribbean beach volleyball with palm trees and white sand background",
    "Hawaiian luau celebration with tropical flowers and tiki torches background",
    "Bali rice terrace meditation with lush green landscape background",
    "Santorini sunset viewing with white-washed buildings and blue domes background",
    "Fiji snorkeling adventure with coral reef underwater background",
    "Seychelles granite boulder beach with unique rock formations background",
    "Costa Rica rainforest zip-lining with dense jungle canopy background"
  ],

  // Finance & Insurance Poses (10 poses)
  finance: [
    "Financial advisor trustworthy professional pose",
    "Investment success confident celebration",
    "Banking security reassuring pose",
    "Insurance protection family-focused pose",
    "Retirement planning peaceful confidence",
    "Startup entrepreneur determined pose",
    "Credit improvement hopeful pose",
    "Wealth building strategic planning pose",
    "Financial education informative pose",
    "Budget management organized pose"
  ],

  // Education & Training Poses (9 poses)
  education: [
    "Teacher engaging classroom presentation",
    "Student success achievement celebration",
    "Online learning focused concentration",
    "Professional development growth mindset",
    "Graduation milestone proud accomplishment",
    "Training workshop interactive participation",
    "Mentorship supportive guidance pose",
    "Research presentation academic confidence",
    "Skill demonstration expertise showcase"
  ],

  // Entertainment & Media Poses (15 poses)
  entertainment: [
    "TV presenter professional broadcasting pose",
    "Actor dramatic performance stance",
    "Musician confident stage presence",
    "Radio host engaging microphone pose",
    "Comedian animated storytelling gesture",
    "Dancer graceful artistic position",
    "Singer passionate performance pose",
    "Photographer creative artistic stance",
    "Film director authoritative commanding pose",
    "Social media influencer engaging camera pose",
    "Podcast host conversational setup",
    "Voice actor expressive recording pose",
    "Theater performer dramatic stage presence",
    "Content creator modern lifestyle pose",
    "Celebrity red carpet elegant pose"
  ],

  // Sports & Fitness Poses (18 poses)
  sports: [
    "Athlete victory celebration arms raised",
    "Fitness trainer motivational coaching stance",
    "Yoga instructor serene balance pose",
    "Runner mid-stride dynamic motion",
    "Weightlifter powerful strength demonstration",
    "Swimmer streamlined athletic position",
    "Cyclist aerodynamic racing pose",
    "Basketball player confident dribbling stance",
    "Soccer player action kick position",
    "Tennis player focused serving pose",
    "Gymnast graceful flexibility demonstration",
    "Boxing fighter determined fighting stance",
    "Rock climber adventurous challenge pose",
    "Surfer balanced riding wave position",
    "Skier dynamic downhill action pose",
    "Golfer perfect swing follow-through",
    "Marathon runner endurance determination",
    "Personal trainer client success celebration"
  ],

  // Fashion Editorial Poses (20 poses)
  editorial: [
    "High fashion avant-garde artistic pose",
    "Runway model signature catwalk stance",
    "Vogue magazine cover dramatic pose",
    "Street style casual cool confidence",
    "Vintage retro inspired classic pose",
    "Minimalist modern clean lines pose",
    "Bohemian free-spirited flowing pose",
    "Gothic dramatic dark aesthetic pose",
    "Preppy sophisticated ivy league pose",
    "Punk rebellious edgy attitude pose",
    "Glamour old Hollywood elegance pose",
    "Avant-garde experimental art pose",
    "Commercial fashion friendly approachable pose",
    "Luxury brand ambassador sophisticated pose",
    "Streetwear urban contemporary pose",
    "Couture high-end exclusive pose",
    "Editorial storytelling narrative pose",
    "Fashion week backstage candid pose",
    "Designer collaboration showcase pose",
    "Trend-setting influencer modern pose"
  ],

  // Lifestyle & Social Media Poses (17 poses)
  lifestyle: [
    "Morning routine fresh start pose",
    "Coffee culture cozy cafe pose",
    "Work-life balance productive pose",
    "Weekend relaxation carefree pose",
    "Date night romantic elegant pose",
    "Girls night fun celebration pose",
    "Outdoor adventure nature lover pose",
    "City life urban professional pose",
    "Home office remote work pose",
    "Fitness journey transformation pose",
    "Self-care wellness moment pose",
    "Shopping experience retail therapy pose",
    "Cooking hobby passionate chef pose",
    "Reading corner intellectual pose",
    "Pet owner loving companion pose",
    "Gardening hobby green thumb pose",
    "Meditation mindfulness peaceful pose"
  ],

  // Seasonal & Holiday Poses (15 poses)
  seasonal: [
    "Winter coat cozy bundled pose",
    "Spring renewal fresh blooming pose",
    "Summer beach vacation carefree pose",
    "Autumn harvest grateful thanksgiving pose",
    "Christmas holiday celebration joy pose",
    "New Year resolution determined pose",
    "Valentine's romantic love pose",
    "Halloween costume playful spooky pose",
    "Back-to-school academic preparation pose",
    "Graduation ceremony proud achievement pose",
    "Wedding celebration elegant pose",
    "Birthday party joyful celebration pose",
    "Anniversary romantic milestone pose",
    "Mother's Day appreciation loving pose",
    "Father's Day tribute respectful pose"
  ],

  // Corporate & Business Poses (20 poses)
  corporate: [
    "CEO executive leadership authority pose",
    "Team meeting collaborative discussion pose",
    "Presentation delivery confident speaker pose",
    "Networking event professional mingling pose",
    "Board meeting serious decision-making pose",
    "Startup pitch enthusiastic entrepreneur pose",
    "Client consultation trustworthy advisor pose",
    "Contract signing formal agreement pose",
    "Office culture friendly workplace pose",
    "Innovation lab creative thinking pose",
    "Annual report serious business pose",
    "Company merger handshake partnership pose",
    "Trade show booth professional display pose",
    "Conference keynote inspiring speaker pose",
    "Quarterly review analytical pose",
    "Corporate headshot professional portrait",
    "Business casual Friday relaxed pose",
    "Remote work video call setup pose",
    "Mentorship guidance experienced leader pose",
    "Success milestone achievement celebration pose"
  ],

  // Restaurant & Dining Experiences (25 poses)
  dining: [
    "Fine dining restaurant elegant dinner pose with upscale interior background",
    "Casual family restaurant meal sharing with cozy booth background",
    "Rooftop restaurant city views with skyline and twinkling lights background",
    "Beachside seafood restaurant with ocean waves and sunset background",
    "Wine tasting vineyard restaurant with rolling grape vines background",
    "Sushi bar chef interaction with authentic Japanese restaurant background",
    "Pizza parlor casual dining with brick oven and checkered tablecloths background",
    "Food truck street dining with urban food truck lineup background",
    "Michelin star restaurant celebration with elegant fine dining background",
    "Brunch cafe weekend vibes with bright morning sunlight background",
    "Tapas bar small plates sharing with Spanish tavern atmosphere background",
    "BBQ smokehouse feast with rustic wooden tables and smoke background",
    "Ice cream parlor sweet treat with colorful vintage shop background",
    "Bakery fresh pastries with display cases and warm lighting background",
    "Juice bar healthy smoothie with fresh fruit displays background",
    "Steakhouse premium cut with dark wood and leather booth background",
    "Ramen shop authentic bowl with Japanese lanterns and counter seating background",
    "Taco stand street food with colorful Mexican tile and papel picado background",
    "Cocktail lounge happy hour with dim lighting and bar backdrop background",
    "Breakfast diner classic American with checkered floor and neon signs background",
    "Vegetarian restaurant healthy choice with garden-fresh green background",
    "Dessert cafe sweet indulgence with pastel colors and cake displays background",
    "Sports bar game watching with multiple screens and team memorabilia background",
    "Ethnic restaurant cultural cuisine with traditional decor background",
    "Farm-to-table restaurant organic dining with rustic farmhouse background"
  ],

  // Urban City Lifestyle (30 poses)
  urbanLife: [
    "Street art district creative pose with colorful graffiti murals background",
    "Downtown business district commuter with glass skyscrapers background",
    "Hipster neighborhood coffee walk with trendy shops and brick buildings background",
    "Financial district power lunch with corporate towers background",
    "Artists quarter gallery browsing with contemporary art studio background",
    "Nightlife district evening out with neon bar signs background",
    "Historic district tour with cobblestone streets and heritage buildings background",
    "Tech startup hub innovation with modern coworking spaces background",
    "University campus academic with ivy-covered buildings background",
    "Waterfront promenade stroll with marina and boats background",
    "Public park city oasis with green trees and walking paths background",
    "Farmers market local shopping with vendor stalls and fresh produce background",
    "Museum district culture with classical columns and sculptures background",
    "Theater district show night with marquee lights and red carpets background",
    "Chinatown exploration with traditional architecture and lanterns background",
    "Little Italy dining with checkered tablecloths and Italian flags background",
    "SoHo shopping luxury with high-end boutiques and cast iron buildings background",
    "Brooklyn bridge walk with iconic bridge cables and city skyline background",
    "Central park picnic with meadows and city backdrop background",
    "Times Square energy with bright billboards and crowds background",
    "Wall Street finance with historic buildings and bull statue background",
    "Greenwich Village charm with tree-lined streets and brownstones background",
    "Meatpacking district trendy with industrial buildings and high line background",
    "Chelsea market food hall with industrial ceiling and food vendors background",
    "Tribeca loft living with converted warehouse and brick walls background",
    "Upper East Side elegance with luxury apartments and doormen background",
    "Harlem jazz club with vintage music venue and stage lights background",
    "Williamsburg hipster with artisanal shops and warehouse conversions background",
    "East Village punk with vintage record shops and dive bars background",
    "Battery Park waterfront with Statue of Liberty and harbor views background"
  ],

  // Seasonal Destinations (40 poses)
  seasonalDestinations: [
    // Spring Destinations (10 poses)
    "Cherry blossom festival in Washington DC with pink petals falling background",
    "Tulip gardens in Holland with colorful flower fields background",
    "Easter egg hunt in countryside with blooming meadows background",
    "Spring hiking trail with wildflowers and mountain streams background",
    "Garden party outdoor celebration with blooming roses background",
    "Wine country spring with budding grape vines background",
    "National park spring visit with waterfalls and fresh greenery background",
    "Botanical garden stroll with exotic plants and glass greenhouse background",
    "Spring farmers market with fresh vegetables and flower stands background",
    "Outdoor concert spring festival with stage and green lawn background",
    // Summer Destinations (10 poses)
    "Beach volleyball tournament with sand courts and ocean background",
    "Music festival summer vibes with outdoor stages and crowds background",
    "Lake house vacation with wooden dock and clear water background",
    "Camping adventure with tents and forest campfire background",
    "Amusement park thrills with roller coasters and carnival lights background",
    "Outdoor wedding ceremony with garden arch and summer flowers background",
    "Pool party celebration with crystal blue water and palm trees background",
    "Baseball stadium game day with green field and stadium lights background",
    "Ice cream truck neighborhood with suburban street and children background",
    "Sunset beach walk with golden hour and crashing waves background",
    // Fall/Autumn Destinations (10 poses)
    "Pumpkin patch visit with orange pumpkins and hay bales background",
    "Fall foliage hiking with red and gold leaves background",
    "Apple orchard picking with fruit trees and wooden ladders background",
    "Thanksgiving dinner preparation with harvest decorations background",
    "Halloween costume party with spooky decorations background",
    "Corn maze adventure with tall stalks and autumn sky background",
    "Wine harvest vineyard with grape picking and golden vines background",
    "Football tailgate party with stadium parking and team colors background",
    "Cozy cabin retreat with fireplace and fall forest background",
    "Fall farmers market with gourds and autumn produce background",
    // Winter Destinations (10 poses)
    "Ski slope adventure with snow-capped mountains background",
    "Ice skating rink with twinkling lights and winter evening background",
    "Christmas market shopping with wooden stalls and holiday lights background",
    "Cozy fireplace reading with snow falling outside windows background",
    "Hot chocolate cafe with steam and winter window frost background",
    "Snowball fight fun with snowy park and bare trees background",
    "Winter wedding elegance with snow-covered landscape background",
    "New Year's Eve celebration with fireworks and city lights background",
    "Ice hotel stay with frozen architecture and aurora lights background",
    "Winter festival with ice sculptures and snow activities background"
  ],

  // Adventure & Outdoor Destinations (35 poses)
  adventureOutdoors: [
    "Mountain peak summit with panoramic valley views background",
    "Rock climbing challenge with cliff face and safety gear background",
    "White water rafting thrill with rushing rapids and paddle splash background",
    "Desert camping under stars with sand dunes and clear night sky background",
    "Forest hiking trail with towering pine trees and dappled sunlight background",
    "Cave exploration adventure with stalactites and headlamp lighting background",
    "Glacier hiking expedition with blue ice and snow gear background",
    "Safari jeep tour with African savanna and wildlife background",
    "Scuba diving underwater with coral reef and tropical fish background",
    "Paragliding flight with aerial mountain valley views background",
    "Kayaking river journey with calm water and riverside forest background",
    "Camping tent setup with wilderness and campfire smoke background",
    "Fishing pier catch with lake reflection and early morning mist background",
    "Horseback riding trail with meadow paths and distant mountains background",
    "Zip-lining canopy tour with treetop views and safety harness background",
    "Surfing wave ride with ocean spray and beach shoreline background",
    "Snowshoeing winter trail with snow-laden evergreens background",
    "Birdwatching nature observation with binoculars and forest background",
    "Geocaching treasure hunt with GPS device and hidden cache background",
    "Photography expedition with camera and scenic landscape background",
    "Stargazing night sky with telescope and constellation background",
    "Wildflower meadow walk with colorful blooms and rolling hills background",
    "Waterfall discovery with misty spray and moss-covered rocks background",
    "Beach combing treasure search with shells and driftwood background",
    "Lighthouse visit coastal with rocky shore and crashing waves background",
    "Hot air balloon ride with patchwork farmland aerial view background",
    "Canoeing lake paddle with mirror-still water and mountain reflection background",
    "Trail running mountain path with switchback trails and summit views background",
    "Tide pool exploration with sea anemones and rocky shore background",
    "Butterfly garden visit with colorful wings and flowering plants background",
    "Volcano hiking expedition with lava fields and steam vents background",
    "Glacier bay cruise with icebergs and whale watching background",
    "Desert oasis discovery with palm trees and spring water background",
    "Northern lights viewing with aurora borealis and snowy landscape background",
    "Canyon rappelling adventure with red rock walls and rope gear background"
  ]
};

// Enhanced pose instructions compilation with all new categories (500+ poses total)
export const POSE_INSTRUCTIONS = [
  ...POSE_CATEGORIES.professional,
  ...POSE_CATEGORIES.ecommerce,
  ...POSE_CATEGORIES.health,
  ...POSE_CATEGORIES.productAds,
  ...POSE_CATEGORIES.beauty,
  ...POSE_CATEGORIES.technology,
  ...POSE_CATEGORIES.automotive,
  ...POSE_CATEGORIES.food,
  ...POSE_CATEGORIES.realEstate,
  ...POSE_CATEGORIES.travel,
  ...POSE_CATEGORIES.finance,
  ...POSE_CATEGORIES.education,
  ...POSE_CATEGORIES.entertainment,
  ...POSE_CATEGORIES.sports,
  ...POSE_CATEGORIES.editorial,
  ...POSE_CATEGORIES.lifestyle,
  ...POSE_CATEGORIES.seasonal,
  ...POSE_CATEGORIES.corporate,
  ...POSE_CATEGORIES.dining,
  ...POSE_CATEGORIES.urbanLife,
  ...POSE_CATEGORIES.seasonalDestinations,
  ...POSE_CATEGORIES.adventureOutdoors
];

// Enhanced industry-specific pose metadata with new categories
export const INDUSTRY_METADATA = {
  ecommerce: {
    description: "Optimized for product catalogs, size guides, and online retail",
    keyFeatures: ["Size reference", "Product details", "Fit demonstration"],
    useCases: ["Fashion retail", "Product listings", "Size charts", "Catalog photography"]
  },
  health: {
    description: "Professional medical and wellness industry poses",
    keyFeatures: ["Trust building", "Professional credibility", "Patient comfort"],
    useCases: ["Healthcare marketing", "Medical websites", "Wellness brands", "Therapy services"]
  },
  productAds: {
    description: "Commercial advertising and product demonstration poses",
    keyFeatures: ["Product showcase", "Usage demonstration", "Customer testimonials"],
    useCases: ["Advertisement campaigns", "Product launches", "Marketing materials", "Social media ads"]
  },
  beauty: {
    description: "Beauty and cosmetics industry specialized poses",
    keyFeatures: ["Makeup display", "Skincare focus", "Transformation showcase"],
    useCases: ["Beauty brands", "Makeup tutorials", "Skincare products", "Salon marketing"]
  },
  technology: {
    description: "Modern tech and digital lifestyle poses",
    keyFeatures: ["Device interaction", "Digital lifestyle", "Innovation showcase"],
    useCases: ["Tech companies", "App marketing", "Digital services", "Electronic products"]
  },
  automotive: {
    description: "Vehicle and transportation industry poses",
    keyFeatures: ["Vehicle interaction", "Safety demonstration", "Lifestyle integration"],
    useCases: ["Car dealerships", "Insurance companies", "Automotive brands", "Transportation services"]
  },
  food: {
    description: "Culinary and food service industry poses",
    keyFeatures: ["Food presentation", "Dining experience", "Cooking demonstration"],
    useCases: ["Restaurants", "Food brands", "Culinary schools", "Recipe content"]
  },
  realEstate: {
    description: "Property and home-related industry poses",
    keyFeatures: ["Home ownership", "Property presentation", "Lifestyle showcasing"],
    useCases: ["Real estate agencies", "Home improvement", "Property management", "Interior design"]
  },
  travel: {
    description: "Tourism and hospitality industry poses",
    keyFeatures: ["Destination showcase", "Travel experiences", "Cultural immersion"],
    useCases: ["Travel agencies", "Hotels", "Tourism boards", "Hospitality services"]
  },
  finance: {
    description: "Financial services and investment industry poses",
    keyFeatures: ["Trust building", "Success demonstration", "Professional credibility"],
    useCases: ["Banks", "Investment firms", "Insurance companies", "Financial advisors"]
  },
  education: {
    description: "Educational and training sector poses",
    keyFeatures: ["Knowledge sharing", "Achievement showcase", "Learning environment"],
    useCases: ["Schools", "Training companies", "Online courses", "Educational platforms"]
  },
  entertainment: {
    description: "Media, entertainment, and creative industry poses",
    keyFeatures: ["Performance showcase", "Creative expression", "Audience engagement"],
    useCases: ["Media companies", "Entertainment venues", "Creative agencies", "Broadcasting"]
  },
  sports: {
    description: "Athletic, fitness, and sports industry poses",
    keyFeatures: ["Athletic performance", "Fitness motivation", "Sports equipment showcase"],
    useCases: ["Sports brands", "Fitness centers", "Athletic wear", "Training programs"]
  },
  editorial: {
    description: "High-fashion editorial and artistic photography poses",
    keyFeatures: ["Artistic expression", "Fashion storytelling", "Creative composition"],
    useCases: ["Fashion magazines", "Editorial shoots", "Art galleries", "Creative campaigns"]
  },
  lifestyle: {
    description: "Modern lifestyle and social media content poses",
    keyFeatures: ["Authentic moments", "Daily life integration", "Social sharing"],
    useCases: ["Lifestyle brands", "Social media content", "Influencer marketing", "Personal branding"]
  },
  seasonal: {
    description: "Holiday and seasonal event marketing poses",
    keyFeatures: ["Seasonal relevance", "Holiday spirit", "Event celebration"],
    useCases: ["Seasonal campaigns", "Holiday marketing", "Event planning", "Greeting cards"]
  },
  corporate: {
    description: "Corporate communications and business leadership poses",
    keyFeatures: ["Executive presence", "Business credibility", "Professional authority"],
    useCases: ["Corporate websites", "Annual reports", "Executive portraits", "Business communications"]
  },
  dining: {
    description: "Restaurant and culinary dining experience poses with location backgrounds",
    keyFeatures: ["Food presentation", "Restaurant ambiance", "Dining atmosphere", "Culinary settings"],
    useCases: ["Restaurant marketing", "Food delivery apps", "Culinary tourism", "Dining reviews", "Food blogs"]
  },
  urbanLife: {
    description: "City lifestyle and metropolitan area poses with urban backgrounds",
    keyFeatures: ["Urban exploration", "City landmarks", "Street culture", "Metropolitan lifestyle"],
    useCases: ["City tourism", "Urban fashion", "Lifestyle brands", "Real estate", "City guides"]
  },
  seasonalDestinations: {
    description: "Seasonal travel and holiday destination poses with themed backgrounds",
    keyFeatures: ["Seasonal activities", "Holiday celebrations", "Weather-specific poses", "Festival atmosphere"],
    useCases: ["Seasonal marketing", "Holiday campaigns", "Travel promotions", "Event planning", "Tourism boards"]
  },
  adventureOutdoors: {
    description: "Outdoor adventure and nature exploration poses with natural backgrounds",
    keyFeatures: ["Adventure activities", "Natural landscapes", "Outdoor gear", "Wilderness settings"],
    useCases: ["Outdoor brands", "Adventure tourism", "Sports equipment", "Travel agencies", "Nature photography"]
  }
};
