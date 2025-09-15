/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { WardrobeItem, ModelType, ItemCategory } from "../types";
import { 
    initializeSession, 
    validateSession, 
    createPrediction, 
    pollForCompletion, 
    hasActiveSession 
} from "./backendService";

// --- Enhanced Interfaces for Next-Level AI ---
interface PromptContext {
    modelType: ModelType;
    existingItems: WardrobeItem[];
    lightingCondition: 'studio' | 'natural' | 'indoor' | 'outdoor';
    imageQuality: 'portrait' | 'full-body' | 'product-shot';
    stylePreference?: 'casual' | 'formal' | 'athletic' | 'trendy' | 'classic';
    backgroundType?: 'solid' | 'gradient' | 'textured' | 'complex';
    dominantColors?: string[];
}

interface EnhancedItemInfo extends WardrobeItem {
    material?: 'cotton' | 'denim' | 'silk' | 'leather' | 'synthetic' | 'wool' | 'linen' | 'polyester' | 'spandex';
    fit?: 'slim' | 'regular' | 'loose' | 'oversized' | 'fitted' | 'skinny' | 'straight';
    occasion?: 'casual' | 'business' | 'formal' | 'athletic' | 'party' | 'outdoor' | 'lounge';
    season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
}

// --- Configuration ---
const NANO_BANANA_CONFIG = {
    model: "google/nano-banana", // Correct model path
    maxImages: 6, // Nano-banana supports up to 6 images  
    supportedFormats: ['jpg', 'png', 'webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
};

// --- Interfaces & Options ---
interface GenerationOptions {
    signal?: AbortSignal;
    backgroundColor?: 'white' | 'black';
}

interface ReplicateInput {
    prompt: string;
    image_input: string[];
    output_format?: 'jpg' | 'png';
}

// --- Error Classes ---
class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// --- Utility Functions ---
const fileToDataUrl = (file: File): Promise<string> => {
    if (!file || !file.type.startsWith('image/')) {
        return Promise.reject(new ApiError('Invalid file type. Please use a PNG, JPEG, or WEBP image.'));
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(new ApiError(`Failed to read file: ${error}`));
    });
};

/**
 * Ensure user has a valid session with encrypted API key
 */
const ensureValidSession = async (): Promise<void> => {
    if (!hasActiveSession()) {
        // Check if user has old replicate key in localStorage
        const oldApiKey = localStorage.getItem('replicate_api_key');
        if (oldApiKey) {
            console.log('Migrating to secure backend session...');
            await initializeSession(oldApiKey);
            return;
        }
        throw new ApiError('No active session. Please set your Replicate API key.');
    }

    // Validate existing session
    const isValid = await validateSession();
    if (!isValid) {
        throw new ApiError('Session expired. Please refresh the page and re-enter your API key.');
    }
};

// --- Core API Logic ---
const runReplicatePrediction = async (input: ReplicateInput, signal?: AbortSignal): Promise<string> => {
    try {
        // Ensure valid session before making API calls
        await ensureValidSession();

        // Validate input before sending
        const validatedInput = {
            prompt: input.prompt.trim(),
            image_input: input.image_input.filter(img => img && typeof img === 'string' && (img.startsWith('data:image') || img.startsWith('http'))),
            ...(input.output_format && { output_format: input.output_format })
        };

        if (validatedInput.image_input.length === 0) {
            throw new ApiError('No valid input images provided for the prediction.');
        }

        console.log('Creating prediction through secure backend...');
        
        // Create prediction through our secure backend
        const prediction = await createPrediction({
            model: NANO_BANANA_CONFIG.model,
            input: validatedInput
        });

        console.log(`Prediction created: ${prediction.id}, status: ${prediction.status}`);

        // If prediction completed immediately, return result
        if (prediction.status === 'succeeded' && prediction.output) {
            const output = prediction.output;
            let resultUrl: string | undefined;

            if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
                resultUrl = output[0];
            } else if (typeof output === 'string') {
                resultUrl = output;
            }

            if (resultUrl) {
                console.log('✅ Prediction completed immediately');
                return resultUrl;
            }
        }

        // Poll for completion through backend
        console.log('Polling for prediction completion...');
        const completedPrediction = await pollForCompletion(
            prediction.id,
            (pred) => {
                console.log(`Prediction ${pred.id} status: ${pred.status}`);
                
                // Check for abort signal during polling
                if (signal?.aborted) {
                    throw new ApiError('Operation was cancelled.');
                }
            }
        );

        // Process the final result
        if (completedPrediction.status === 'failed') {
            throw new ApiError(`Image generation failed: ${completedPrediction.error || 'Unknown error'}`);
        }

        if (completedPrediction.status !== 'succeeded') {
            throw new ApiError(`Prediction finished with unexpected status: ${completedPrediction.status}`);
        }
        
        const output = completedPrediction.output;
        let resultUrl: string | undefined;

        if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
            resultUrl = output[0];
        } else if (typeof output === 'string') {
            resultUrl = output;
        }

        if (resultUrl) {
            console.log('✅ Prediction completed successfully');
            return resultUrl;
        }

        throw new ApiError('Prediction succeeded but a valid image URL was not returned.');

    } catch (error: any) {
        if (signal?.aborted) {
            console.warn('❌ Request cancelled by user');
            throw new ApiError('Operation was cancelled.');
        }
        
        console.error('❌ Prediction failed:', error.message);
        
        // Re-throw as ApiError for consistent error handling
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Image generation failed: ${error.message || 'Unknown error'}`);
    }
};

// --- Session Management Functions ---

/**
 * Initialize secure session with API key (replaces direct localStorage access)
 */
export const initializeSecureSession = async (apiKey: string): Promise<void> => {
    try {
        await initializeSession(apiKey);
        console.log('✅ Secure session initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize secure session:', error);
        throw new ApiError(`Failed to initialize secure session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Check if user has an active secure session
 */
export const hasValidSession = (): boolean => {
    return hasActiveSession();
};

// --- Exported Service Functions ---

export const generateModelImage = async (userImage: File, options: GenerationOptions = {}): Promise<string> => {
    const userImageDataUrl = await fileToDataUrl(userImage);
    const backgroundInstruction = options.backgroundColor === 'black'
        ? 'a clean, pure black (#000000) studio background'
        : 'a clean, light gray (#f0f0f0) studio background';

    const prompt = `You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be ${backgroundInstruction}. The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [userImageDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options.signal);
};

export const generateVirtualTryOnImage = async (
    modelImageUrl: string, 
    garmentImage: File, 
    options?: GenerationOptions
): Promise<string> => {
    const garmentDataUrl = await fileToDataUrl(garmentImage);
    const prompt = `Edit the person in the first image to wear the garment from the second image. Remove the original clothing and naturally fit the new garment to the person's body shape and pose. Maintain realistic fabric draping, shadows, and lighting consistency. Preserve the person's identity, pose, and background exactly.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, garmentDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

export const generateOutfitModification = async (
    modelImageUrl: string,
    itemImage: File,
    itemInfo: WardrobeItem,
    options?: GenerationOptions
): Promise<string> => {
    const itemDataUrl = await fileToDataUrl(itemImage);
    let prompt = '';

    const baseInstruction = `Edit the person's outfit in the first image by incorporating the item from the second image. Preserve the person's identity, pose, background, and all other existing clothing items perfectly. The result must be photorealistic, with natural lighting and shadows.`;

    switch (itemInfo.category) {
        case 'bottom':
            prompt = `${baseInstruction} Replace ONLY the bottoms (pants, skirt, etc.) with the new item. Ensure the waistline aligns correctly and the fabric drapes naturally over the legs.`;
            break;
        case 'shoes':
            prompt = `${baseInstruction} Replace ONLY the shoes with the new item. Ensure they are correctly sized for the feet and placed realistically on the ground, casting appropriate shadows.`;
            break;
        case 'accessory':
            prompt = `${baseInstruction} ADD the accessory (${itemInfo.name}) to the person in a natural way (e.g., around the neck for a necklace). Do not replace any existing clothes.`;
            break;
        case 'held':
            prompt = `${baseInstruction} Edit the image so the person is naturally holding the item (${itemInfo.name}) in their hand. Do not change their clothes.`;
            break;
        case 'top':
        default:
             // Fallback to the main try-on logic for tops, as it's the most common replacement
            return generateVirtualTryOnImage(modelImageUrl, itemImage, options);
    }

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, itemDataUrl],
        output_format: 'png'
    };
    return runReplicatePrediction(input, options?.signal);
};

export const generatePoseVariation = async (
    tryOnImageUrl: string, 
    poseInstruction: string, 
    options?: GenerationOptions
): Promise<string> => {
    const prompt = `Edit the person's pose to match this description: "${poseInstruction}". It is critical to keep the person, their facial identity, all clothing items, and the background identical to the input image. The clothing should realistically adapt and drape according to the new pose with natural folds and shadows.`;
    
    const input: ReplicateInput = {
        prompt,
        image_input: [tryOnImageUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

// --- NEXT-LEVEL AI PROMPT ENGINEERING ---

/**
 * Advanced Prompt Engine with Context Awareness
 */
class AdvancedPromptEngine {
    private static readonly STYLE_CONTEXTS = {
        casual: "relaxed, everyday styling with natural fabric draping and comfortable proportions",
        formal: "crisp, tailored appearance with structured silhouettes and professional polish",
        athletic: "performance-focused fit with movement-friendly positioning and technical fabric behavior", 
        trendy: "fashion-forward styling with contemporary proportions and modern aesthetic appeal",
        classic: "timeless, traditional styling with perfect fit, refined drape, and elegant proportions"
    };

    private static readonly QUALITY_MODIFIERS = {
        'portrait': "Focus on upper body detail with perfect facial features and premium clothing texture visibility",
        'full-body': "Ensure complete body visibility with proper proportions, natural stance, and head-to-toe styling",
        'product-shot': "Highlight garment details with crisp, catalog-quality presentation and professional lighting"
    };

    private static readonly MATERIAL_BEHAVIORS = {
        cotton: "soft, breathable fabric with natural draping and subtle texture",
        denim: "structured cotton with characteristic weave, appropriate stiffness, and authentic wear patterns",
        silk: "luxurious, flowing material with subtle sheen and elegant, fluid movement",
        leather: "structured, form-fitting material with realistic texture, natural creasing, and appropriate reflections",
        wool: "warm, textured fabric with natural fiber appearance and seasonal weight",
        linen: "crisp, breathable fabric with characteristic wrinkles and natural texture",
        polyester: "smooth, wrinkle-resistant synthetic with clean lines and consistent appearance",
        spandex: "stretchy, form-fitting material that moves with the body and maintains shape"
    };

    static generateContextualPrompt(
        action: string,
        context: PromptContext,
        specificInstructions: string
    ): string {
        const modelContext = this.getEnhancedModelContext(context.modelType, context.stylePreference);
        const qualityContext = this.QUALITY_MODIFIERS[context.imageQuality];
        const styleContext = context.stylePreference ? this.STYLE_CONTEXTS[context.stylePreference] : '';
        
        let prompt = `You are a world-class AI fashion photographer and stylist. ${action}\n\n`;
        
        prompt += `🎯 IDENTITY & ANATOMY PRESERVATION (CRITICAL):\n`;
        prompt += `- Maintain EXACT facial features, bone structure, skin tone, and unique characteristics\n`;
        prompt += `- Preserve body proportions, natural posture, and individual physical traits\n`;
        prompt += `- Keep identical background, lighting direction, camera angle, and image composition\n\n`;
        
        prompt += `👤 MODEL SPECIFICATIONS:\n${modelContext}\n\n`;
        
        if (styleContext) {
            prompt += `✨ STYLING APPROACH:\nApply ${styleContext} throughout the entire transformation.\n\n`;
        }
        
        if (context.dominantColors && context.dominantColors.length > 0) {
            prompt += `🎨 COLOR HARMONY:\nExisting image palette includes ${context.dominantColors.slice(0, 3).join(', ')}. Ensure new items complement these colors harmoniously.\n\n`;
        }
        
        prompt += `📸 TECHNICAL REQUIREMENTS:\n`;
        prompt += `- ${qualityContext}\n`;
        prompt += `- Maintain photorealistic quality with accurate shadows, highlights, and depth\n`;
        prompt += `- Apply proper fabric physics with natural draping and realistic movement\n`;
        prompt += `- Ensure professional lighting consistency and color accuracy\n\n`;
        
        if (context.existingItems.length > 0) {
            prompt += `👔 EXISTING OUTFIT CONTEXT:\n`;
            prompt += `Current outfit includes: ${context.existingItems.map(item => item.name).join(', ')}\n`;
            prompt += `Ensure new additions complement existing style, fit, and color coordination.\n\n`;
        }
        
        prompt += `🎯 SPECIFIC TRANSFORMATION:\n${specificInstructions}\n\n`;
        
        prompt += `✅ FINAL QUALITY VALIDATION:\n`;
        prompt += `- Verify all proportions are anatomically correct and natural\n`;
        prompt += `- Confirm seamless integration without artifacts or inconsistencies\n`;
        prompt += `- Ensure color harmony and professional styling throughout\n`;
        prompt += `- Result must be indistinguishable from a high-end fashion photograph`;
        
        return prompt;
    }

    private static getEnhancedModelContext(modelType: ModelType, style?: string): string {
        const baseContexts = {
            man: 'Adult male model with masculine proportions, broader shoulders, typical male body structure, and confident masculine presence',
            woman: 'Adult female model with feminine proportions, elegant silhouette, typical female body structure, and graceful feminine presence', 
            kid: 'Child model with age-appropriate proportions, youthful features, playful energy, and safe, child-friendly styling'
        };
        
        const baseContext = baseContexts[modelType] || baseContexts.man;
        
        if (style) {
            const styleAdjustments = {
                casual: 'Emphasize comfort, relaxed fit, and effortless everyday appeal',
                formal: 'Focus on sharp, tailored silhouettes, professional appearance, and refined elegance',
                athletic: 'Highlight functional fit, movement capability, and performance-oriented styling',
                trendy: 'Incorporate contemporary fashion proportions, modern styling, and current aesthetic trends',
                classic: 'Apply timeless proportions, traditional fit standards, and enduring style principles'
            };
            
            return `${baseContext}. ${styleAdjustments[style] || ''}`;
        }
        
        return baseContext;
    }
}

/**
 * Legacy function maintained for backward compatibility
 */
const getModelTypeContext = (modelType: ModelType): string => {
    switch (modelType) {
        case 'man':
            return 'The model is an adult man. Ensure clothing fits masculine proportions, broader shoulders, and typical male body shape. Use appropriate sizing and cut for men\'s fashion.';
        case 'woman':
            return 'The model is an adult woman. Ensure clothing fits feminine proportions and typical female body shape. Use appropriate sizing and cut for women\'s fashion.';
        case 'kid':
            return 'The model is a child. Ensure all clothing is age-appropriate with child-sized proportions. Use smaller scale, playful designs, and safe, appropriate styling for children.';
        default:
            return 'Ensure clothing fits the model\'s body type and proportions naturally.';
    }
};

/**
 * Enhanced category instructions with material and style awareness
 */
const getEnhancedCategoryInstructions = (
    category: ItemCategory, 
    itemInfo: EnhancedItemInfo,
    context: PromptContext
): string => {
    switch (category) {
        case 'top':
            return generateTopInstructions(itemInfo, context);
        case 'bottom':
            return generateBottomInstructions(itemInfo, context);
        case 'shoes':
            return generateShoeInstructions(itemInfo, context);
        case 'face':
            return generateFaceInstructions(itemInfo, context);
        case 'hair':
            return generateHairInstructions(itemInfo, context);
        case 'jewelry':
            return generateJewelryInstructions(itemInfo, context);
        case 'eyewear':
            return generateEyewearInstructions(itemInfo, context);
        case 'bags':
            return generateBagInstructions(itemInfo, context);
        case 'watches':
            return generateWatchInstructions(itemInfo, context);
        case 'accessories':
            return generateAccessoryInstructions(itemInfo, context);
        case 'held':
            return generateHeldItemInstructions(itemInfo, context);
        default:
            return `Add ${itemInfo.name} to the person in the most natural and appropriate way for this type of item.`;
    }
};

const generateTopInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `🔄 UPPER BODY TRANSFORMATION: Replace the current top with ${item.name}.`;
    
    // Material-specific behavior
    if (item.material) {
        const materialBehavior = AdvancedPromptEngine['MATERIAL_BEHAVIORS'][item.material];
        if (materialBehavior) {
            instructions += ` Apply ${materialBehavior} characteristics throughout the garment.`;
        }
    }
    
    // Fit-specific adjustments
    if (item.fit) {
        const fitInstructions = {
            slim: "Ensure close-fitting silhouette that follows body contours naturally without being restrictive",
            regular: "Apply standard comfortable fit with proper room for movement and natural drape",
            loose: "Create relaxed, flowing fit with extra room while maintaining flattering proportions",
            oversized: "Apply deliberately oversized styling that looks intentional, not ill-fitting",
            fitted: "Ensure precise body-hugging fit that enhances natural shape elegantly"
        };
        instructions += ` ${fitInstructions[item.fit] || ''}`;
    }
    
    // Style and occasion considerations
    if (item.occasion) {
        const occasionNotes = {
            casual: "Style for everyday comfort and relaxed elegance",
            business: "Maintain professional, polished appearance suitable for workplace",
            formal: "Apply sophisticated, refined styling appropriate for formal events",
            athletic: "Ensure performance-oriented fit with functional styling elements",
            party: "Add fashionable flair with attention to style details and visual appeal"
        };
        instructions += ` ${occasionNotes[item.occasion] || ''}`;
    }
    
    instructions += ` Ensure proper shoulder alignment, appropriate neckline positioning, and natural sleeve draping.`;
    
    return instructions;
};

const generateBottomInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `🔄 LOWER BODY TRANSFORMATION: Replace the current bottom garment with ${item.name}.`;
    
    // Material and fit integration
    if (item.material === 'denim') {
        instructions += ` Apply authentic denim texture with realistic wear patterns, proper stitching details, and characteristic fabric weight.`;
    }
    
    if (item.fit) {
        const fitInstructions = {
            skinny: "Create form-fitting silhouette that follows leg contours naturally without appearing painted-on",
            slim: "Apply tailored fit that's close to the body but allows natural movement",
            straight: "Ensure classic straight-leg silhouette with consistent width from hip to hem",
            loose: "Create relaxed fit with comfortable room throughout while maintaining shape"
        };
        instructions += ` ${fitInstructions[item.fit] || ''}`;
    }
    
    instructions += ` Ensure proper waistline alignment, appropriate length for ${context.modelType}, and realistic fabric behavior around curves and joints.`;
    
    return instructions;
};

const generateShoeInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `👟 FOOTWEAR REPLACEMENT: Replace current shoes with ${item.name}.`;
    
    instructions += ` Ensure correct sizing proportional to ${context.modelType} feet, proper ground contact with realistic shadows, and appropriate positioning for the current stance.`;
    
    if (item.material === 'leather') {
        instructions += ` Apply authentic leather texture with natural creasing and appropriate sheen.`;
    }
    
    if (item.occasion === 'athletic') {
        instructions += ` Position with athletic functionality and performance-oriented styling.`;
    } else if (item.occasion === 'formal') {
        instructions += ` Maintain elegant, polished appearance suitable for formal occasions.`;
    }
    
    return instructions;
};

const generateFaceInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    return `👤 FACE SWAP TRANSFORMATION: Replace ONLY the person's face with the facial features from the reference image while preserving EVERYTHING else - identical body, clothing, hair, pose, background, and lighting. Ensure seamless blending at the neck boundary with natural skin tone matching and proper facial proportions for ${context.modelType}. The new face must integrate perfectly without any artificial appearance.`;
};

const generateHairInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    return `💇 HAIRSTYLE TRANSFORMATION: Change ONLY the hairstyle to match the hair from the reference image (${item.name}). Maintain the EXACT same facial features, body, clothing, pose, and background. The new hairstyle must fit naturally on the person's head shape, complement their facial features, and look authentically integrated. Pay attention to hair texture, volume, and natural growth patterns appropriate for ${context.modelType}.`;
};

const generateJewelryInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `💍 JEWELRY ADDITION: Add ${item.name} as an elegant accessory.`;
    
    const jewelryPlacements = {
        necklace: "around the neck with proper chain draping and pendant positioning",
        ring: "on appropriate finger with correct sizing and natural hand positioning", 
        earrings: "on ears with proper proportions and secure appearance",
        bracelet: "around wrist with comfortable fit and natural positioning"
    };
    
    const jewelryType = item.name.toLowerCase();
    for (const [type, placement] of Object.entries(jewelryPlacements)) {
        if (jewelryType.includes(type)) {
            instructions += ` Position ${placement}.`;
            break;
        }
    }
    
    instructions += ` Ensure realistic metallic properties, proper lighting reflections, and harmonious integration with existing outfit colors.`;
    
    return instructions;
};

const generateEyewearInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    return `👓 EYEWEAR ADDITION: Add ${item.name} to the person's face with proper fit on nose bridge and ears. Ensure correct proportional sizing for ${context.modelType}, natural lens reflections or tinting as appropriate, and comfortable positioning that complements facial features. Maintain clear visibility of eyes unless specifically sunglasses with intended tinting effect.`;
};

const generateBagInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `👜 BAG POSITIONING: Add ${item.name} with natural carrying position.`;
    
    const bagTypes = {
        handbag: "carried in hand or positioned on forearm with elegant grip",
        backpack: "worn on back with straps over shoulders and proper weight distribution",
        briefcase: "carried in hand with professional, confident grip",
        purse: "positioned on shoulder or carried by handle with natural arm positioning",
        tote: "carried on shoulder or in hand with appropriate fabric draping"
    };
    
    const bagType = item.name.toLowerCase();
    for (const [type, positioning] of Object.entries(bagTypes)) {
        if (bagType.includes(type)) {
            instructions += ` ${positioning.charAt(0).toUpperCase() + positioning.slice(1)}.`;
            break;
        }
    }
    
    instructions += ` Ensure realistic strap behavior, proper weight appearance, and natural integration with body posture.`;
    
    return instructions;
};

const generateWatchInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    return `⌚ WATCH PLACEMENT: Add ${item.name} to the wrist with proper sizing and positioning. Ensure the watch band fits comfortably around the wrist, the watch face is clearly visible and appropriately oriented, and any metallic elements show realistic reflections. The placement should look natural and complement the overall styling.`;
};

const generateAccessoryInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `🎩 ACCESSORY INTEGRATION: Add ${item.name} with appropriate positioning.`;
    
    const accessoryPlacements = {
        hat: "on head with proper fit and natural positioning that complements face shape",
        belt: "around waist with correct sizing and appropriate buckle positioning",
        scarf: "around neck or shoulders with elegant draping and natural fabric flow",
        tie: "around collar with proper knot tying and professional appearance",
        sunglasses: "on face with secure fit and appropriate lens tinting"
    };
    
    const accessoryType = item.name.toLowerCase();
    for (const [type, placement] of Object.entries(accessoryPlacements)) {
        if (accessoryType.includes(type)) {
            instructions += ` Position ${placement}.`;
            break;
        }
    }
    
    instructions += ` Ensure the accessory enhances the overall style and integrates harmoniously with existing outfit elements.`;
    
    return instructions;
};

const generateHeldItemInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `🤲 HELD ITEM INTEGRATION: Naturally position the person holding ${item.name}.`;
    
    const heldItemPositions = {
        phone: "in hand with natural grip and appropriate screen orientation",
        laptop: "carried or positioned with proper weight distribution and secure handling",
        coffee: "held in hand with natural grip and appropriate liquid level appearance",
        book: "carried or held with natural page positioning and comfortable grip",
        tablet: "held with secure two-hand grip or comfortable single-hand position"
    };
    
    const itemType = item.name.toLowerCase();
    for (const [type, position] of Object.entries(heldItemPositions)) {
        if (itemType.includes(type)) {
            instructions += ` ${position.charAt(0).toUpperCase() + position.slice(1)}.`;
            break;
        }
    }
    
    instructions += ` Adjust hand and arm positioning naturally to accommodate the item while maintaining comfortable posture and realistic interaction.`;
    
    return instructions;
};

/**
 * Legacy function maintained for backward compatibility
 */
const getCategoryInstructions = (category: ItemCategory, itemName: string): string => {
    switch (category) {
        case 'top':
            return `Replace the upper body clothing with ${itemName}. Ensure proper fit around shoulders, chest, and arms. Maintain natural fabric draping and wrinkles.`;
        
        case 'bottom':
            return `Replace the lower body clothing with ${itemName}. Ensure proper fit around waist, hips, and legs. Maintain realistic fabric flow and appropriate length.`;
        
        case 'shoes':
            return `Replace the footwear with ${itemName}. Ensure correct foot size, proper ground contact, and realistic shadows. The shoes should match the person's stance.`;
        
        case 'face':
            return `FACE SWAP ONLY: Replace the person's face with the face from the second image while keeping EVERYTHING else identical - same body, same clothing, same pose, same background, same lighting. The new face should blend seamlessly with the existing neck and maintain natural proportions. Do NOT change clothes, hair, or accessories.`;
        
        case 'hair':
            return `HAIRSTYLE CHANGE ONLY: Change the person's hairstyle to match the hairstyle from the second image (${itemName}). Keep the EXACT same face, facial features, body, clothing, pose, and background. Only modify the hair - do NOT change clothes, accessories, or facial features. Ensure the new hairstyle fits naturally on the person's head.`;
        
        case 'jewelry':
            return `Add ${itemName} to the person as an accessory. For necklaces, place around the neck; for rings, on appropriate fingers; for earrings, on ears; for bracelets, on wrists. Do not replace any existing clothing.`;
        
        case 'eyewear':
            return `Add ${itemName} to the person's face. Ensure glasses sit properly on the nose and ears, with correct proportions. For sunglasses, add appropriate lens effects. Do not change any clothing.`;
        
        case 'bags':
            return `Add ${itemName} to the person. For handbags, place in hand or on shoulder/arm; for backpacks, position on back with straps over shoulders; for briefcases, carry in hand. Position naturally based on bag type.`;
        
        case 'watches':
            return `Add ${itemName} to the person's wrist. Ensure the watch fits properly around the wrist with correct sizing and realistic positioning. Do not change any clothing.`;
        
        case 'accessories':
            return `Add ${itemName} to the person appropriately. For hats, place on head with proper fit; for belts, around waist; for scarves, around neck or shoulders; for ties, around collar. Position naturally based on accessory type.`;
        
        case 'held':
            return `Edit the image so the person is naturally holding or using ${itemName}. For phones, position in hand; for laptops, hold or place appropriately; for drinks, hold in hand; for books, carry naturally. Adjust hand position realistically.`;
        
        default:
            return `Add ${itemName} to the person in the most natural and appropriate way for this type of item.`;
    }
};

/**
 * Next-Level Layered outfit generation with advanced AI orchestration
 */
export const generateLayeredOutfit = async (
    modelImageUrl: string,
    selectedItems: WardrobeItem[],
    modelType: ModelType,
    options?: GenerationOptions & { 
        style?: 'casual' | 'formal' | 'athletic' | 'trendy' | 'classic';
    }
): Promise<string> => {
    if (selectedItems.length === 0) {
        throw new ApiError('No items selected for layered outfit generation.');
    }

    if (selectedItems.length > 6) {
        throw new ApiError('Too many items selected. Maximum 6 items supported for layered generation.');
    }

    // Convert item files to data URLs
    const itemDataUrls: string[] = [];
    for (const item of selectedItems) {
        try {
            // Fetch the item image and convert to data URL
            const response = await fetch(item.url);
            const blob = await response.blob();
            const file = new File([blob], item.name, { type: blob.type });
            const dataUrl = await fileToDataUrl(file);
            itemDataUrls.push(dataUrl);
        } catch (error) {
            console.error(`Failed to process ${item.name}:`, error);
            throw new ApiError(`Failed to load item: ${item.name}`);
        }
    }

    // Build advanced context for multi-item orchestration
    const context: PromptContext = {
        modelType,
        existingItems: [],
        lightingCondition: 'studio',
        imageQuality: 'full-body',
        stylePreference: options?.style,
        backgroundType: 'solid'
    };
    
    // Create enhanced item info for each selected item
    const enhancedItems: EnhancedItemInfo[] = selectedItems.map(item => ({
        ...item,
        material: detectMaterial(item.name),
        fit: detectFit(item.name),
        occasion: detectOccasion(item.name),
    }));
    
    // Build intelligent layering instructions
    let layeredInstructions = `Transform this person into a complete styled outfit using ALL ${selectedItems.length} items with professional fashion coordination.\n\n`;

    // Intelligent item categorization and prioritization
    const clothingItems = enhancedItems.filter(item => ['top', 'bottom', 'shoes'].includes(item.category));
    const faceItems = enhancedItems.filter(item => item.category === 'face');
    const hairItems = enhancedItems.filter(item => item.category === 'hair');
    const accessoryItems = enhancedItems.filter(item => !['top', 'bottom', 'shoes', 'face', 'hair'].includes(item.category));

    let itemIndex = 2; // Start from image 2 (image 1 is the model)

    // Priority-based application sequence for optimal results
    
    // Step 1: Foundation transformations (Face & Hair)
    if (faceItems.length > 0) {
        const faceInstructions = generateFaceInstructions(faceItems[0], context);
        layeredInstructions += `🎭 STEP 1 - FACE TRANSFORMATION: Use image ${itemIndex}\n${faceInstructions}\n\n`;
        itemIndex++;
    }

    if (hairItems.length > 0) {
        const hairInstructions = generateHairInstructions(hairItems[0], context);
        layeredInstructions += `💇 STEP 2 - HAIR STYLING: Use image ${itemIndex}\n${hairInstructions}\n\n`;
        itemIndex++;
    }

    // Step 2: Core clothing items (layered bottom-to-top)
    if (clothingItems.length > 0) {
        layeredInstructions += `👔 STEP 3 - CORE OUTFIT ASSEMBLY:\n`;
        
        // Order: Bottoms -> Tops -> Shoes for natural layering
        const orderedClothing = [
            ...clothingItems.filter(item => item.category === 'bottom'),
            ...clothingItems.filter(item => item.category === 'top'), 
            ...clothingItems.filter(item => item.category === 'shoes')
        ];
        
        orderedClothing.forEach(item => {
            const instructions = getEnhancedCategoryInstructions(item.category, item, context);
            layeredInstructions += `  📦 Apply image ${itemIndex} (${item.name}):\n  ${instructions}\n\n`;
            itemIndex++;
        });
    }

    // Step 3: Accessories and styling elements
    if (accessoryItems.length > 0) {
        layeredInstructions += `✨ STEP 4 - ACCESSORY COORDINATION:\n`;
        
        // Group accessories by type for intelligent application
        const jewelryItems = accessoryItems.filter(item => item.category === 'jewelry');
        const functionalItems = accessoryItems.filter(item => ['bags', 'watches', 'eyewear'].includes(item.category));
        const styleItems = accessoryItems.filter(item => ['accessories', 'held'].includes(item.category));
        
        [...jewelryItems, ...functionalItems, ...styleItems].forEach(item => {
            const instructions = getEnhancedCategoryInstructions(item.category, item, context);
            layeredInstructions += `  🎨 Add image ${itemIndex} (${item.name}):\n  ${instructions}\n\n`;
            itemIndex++;
        });
    }

    // Final coordination and style harmony
    layeredInstructions += `🎯 FINAL STYLE COORDINATION:\n`;
    layeredInstructions += `- Ensure all ${selectedItems.length} items work together harmoniously\n`;
    layeredInstructions += `- Verify color palette coordination and style consistency\n`;
    layeredInstructions += `- Apply professional styling principles for a cohesive look\n`;
    layeredInstructions += `- Maintain realistic proportions and natural fabric behavior throughout\n`;
    
    if (options?.style) {
        layeredInstructions += `- Overall aesthetic should reflect ${options.style} styling approach\n`;
    }
    
    layeredInstructions += `\nResult must be a magazine-quality styled outfit that looks professionally coordinated and naturally integrated.`;

    // Generate the comprehensive prompt using advanced engine
    const finalPrompt = AdvancedPromptEngine.generateContextualPrompt(
        `Create a complete styled outfit transformation using multiple coordinated fashion items.`,
        context,
        layeredInstructions
    );

    const input: ReplicateInput = {
        prompt: finalPrompt,
        image_input: [modelImageUrl, ...itemDataUrls],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

/**
 * Next-Level Enhanced outfit modification with advanced AI context awareness
 */
export const generateEnhancedOutfitModification = async (
    modelImageUrl: string,
    itemImage: File,
    itemInfo: WardrobeItem,
    modelType: ModelType,
    options?: GenerationOptions & { 
        style?: 'casual' | 'formal' | 'athletic' | 'trendy' | 'classic';
        existingItems?: WardrobeItem[];
    }
): Promise<string> => {
    const itemDataUrl = await fileToDataUrl(itemImage);
    
    // Create enhanced item info with intelligent defaults
    const enhancedItemInfo: EnhancedItemInfo = {
        ...itemInfo,
        // Intelligent material detection based on item name
        material: detectMaterial(itemInfo.name),
        fit: detectFit(itemInfo.name),
        occasion: detectOccasion(itemInfo.name),
    };
    
    // Build context for advanced prompting
    const context: PromptContext = {
        modelType,
        existingItems: options?.existingItems || [],
        lightingCondition: 'studio', // Default - could be enhanced with image analysis
        imageQuality: 'full-body',
        stylePreference: options?.style,
        backgroundType: 'solid'
    };
    
    const categoryInstructions = getEnhancedCategoryInstructions(
        itemInfo.category, 
        enhancedItemInfo, 
        context
    );
    
    const prompt = AdvancedPromptEngine.generateContextualPrompt(
        `Apply a ${itemInfo.category} item to enhance the person's outfit with professional fashion styling.`,
        context,
        categoryInstructions
    );

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, itemDataUrl],
        output_format: 'png'
    };
    
    return runReplicatePrediction(input, options?.signal);
};

/**
 * Intelligent material detection from item names
 */
const detectMaterial = (itemName: string): EnhancedItemInfo['material'] => {
    const name = itemName.toLowerCase();
    if (name.includes('denim') || name.includes('jean')) return 'denim';
    if (name.includes('leather')) return 'leather';
    if (name.includes('silk')) return 'silk';
    if (name.includes('wool') || name.includes('sweater') || name.includes('knit')) return 'wool';
    if (name.includes('cotton') || name.includes('tee') || name.includes('t-shirt')) return 'cotton';
    if (name.includes('linen')) return 'linen';
    if (name.includes('polyester') || name.includes('synthetic')) return 'polyester';
    if (name.includes('spandex') || name.includes('stretch') || name.includes('athletic')) return 'spandex';
    return 'cotton'; // Safe default
};

/**
 * Intelligent fit detection from item names
 */
const detectFit = (itemName: string): EnhancedItemInfo['fit'] => {
    const name = itemName.toLowerCase();
    if (name.includes('skinny') || name.includes('tight')) return 'skinny';
    if (name.includes('slim') || name.includes('fitted')) return 'slim';
    if (name.includes('loose') || name.includes('relaxed')) return 'loose';
    if (name.includes('oversized') || name.includes('baggy')) return 'oversized';
    if (name.includes('straight')) return 'straight';
    return 'regular'; // Safe default
};

/**
 * Intelligent occasion detection from item names  
 */
const detectOccasion = (itemName: string): EnhancedItemInfo['occasion'] => {
    const name = itemName.toLowerCase();
    if (name.includes('dress') || name.includes('formal') || name.includes('suit')) return 'formal';
    if (name.includes('business') || name.includes('professional')) return 'business';
    if (name.includes('athletic') || name.includes('sport') || name.includes('gym')) return 'athletic';
    if (name.includes('party') || name.includes('evening') || name.includes('cocktail')) return 'party';
    if (name.includes('outdoor') || name.includes('hiking') || name.includes('camping')) return 'outdoor';
    return 'casual'; // Safe default
};

/**
 * Legacy enhanced outfit modification (kept for backward compatibility)
 */
export const generateLegacyEnhancedOutfitModification = async (
    modelImageUrl: string,
    itemImage: File,
    itemInfo: WardrobeItem,
    modelType: ModelType,
    options?: GenerationOptions
): Promise<string> => {
    const itemDataUrl = await fileToDataUrl(itemImage);
    const modelContext = getModelTypeContext(modelType);
    const categoryInstructions = getCategoryInstructions(itemInfo.category, itemInfo.name);
    
    const prompt = `You are an expert fashion AI. ${modelContext}

${categoryInstructions}

CRITICAL REQUIREMENTS:
- Preserve the person's identity, facial features, and body shape exactly
- Keep the same pose, background, and lighting
- Apply the item naturally and realistically
- Maintain proper proportions for a ${modelType}
- Ensure realistic fabric physics, shadows, and draping
- The result must be photorealistic and seamless

Apply the item from the second image to the person in the first image following the category-specific instructions above.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, itemDataUrl],
        output_format: 'png'
    };
    
    return runReplicatePrediction(input, options?.signal);
};

/**
 * Add a single garment to existing outfit (for building outfits incrementally)
 */
export const addGarmentToOutfit = async (
    currentOutfitImageUrl: string,
    newItemImage: File,
    itemInfo: WardrobeItem,
    modelType: ModelType,
    options?: GenerationOptions
): Promise<string> => {
    const itemDataUrl = await fileToDataUrl(newItemImage);
    const modelContext = getModelTypeContext(modelType);
    const categoryInstructions = getCategoryInstructions(itemInfo.category, itemInfo.name);
    
    let prompt = `You are an expert fashion AI adding a new item to an existing outfit. ${modelContext}

PRESERVE EVERYTHING: Keep the person's identity, face, body, pose, background, and all existing clothing/accessories exactly the same.

ADD NEW ITEM: ${categoryInstructions}

The new item should integrate seamlessly with the existing outfit. Ensure proper layering, realistic shadows, and natural positioning. Do not remove or replace any existing items unless specifically replacing the same category (e.g., replacing shoes with new shoes).`;

    // Special handling for clothing categories that replace existing items
    if (['top', 'bottom', 'shoes'].includes(itemInfo.category)) {
        prompt += `\n\nREPLACEMENT: Since this is a ${itemInfo.category}, replace the existing ${itemInfo.category} with the new item while keeping all other clothing and accessories.`;
    }

    const input: ReplicateInput = {
        prompt,
        image_input: [currentOutfitImageUrl, itemDataUrl],
        output_format: 'png'
    };
    
    return runReplicatePrediction(input, options?.signal);
};

// --- ADVANCED BATCH PROCESSING & OPTIMIZATION ---

interface BatchProcessingOptions {
    maxConcurrent?: number;
    priority?: 'speed' | 'quality' | 'balanced';
    retryFailures?: boolean;
    progressCallback?: (completed: number, total: number) => void;
}

interface BatchResult {
    item: WardrobeItem;
    resultUrl?: string;
    error?: string;
    processingTime?: number;
}

/**
 * Generate multiple outfit variations in optimized batches
 */
export const generateMultipleVariations = async (
    baseImageUrl: string,
    items: WardrobeItem[],
    modelType: ModelType,
    options?: BatchProcessingOptions & { style?: 'casual' | 'formal' | 'athletic' | 'trendy' | 'classic' }
): Promise<BatchResult[]> => {
    const maxConcurrent = options?.maxConcurrent || 3;
    const results: BatchResult[] = [];
    const totalItems = items.length;
    
    console.log(`🚀 Starting batch processing of ${totalItems} items with max ${maxConcurrent} concurrent requests`);
    
    // Process items in batches to avoid overwhelming the API
    for (let i = 0; i < items.length; i += maxConcurrent) {
        const batch = items.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (item): Promise<BatchResult> => {
            const startTime = Date.now();
            
            try {
                // Convert item URL to File
                const response = await fetch(item.url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch item image: HTTP ${response.status}`);
                }
                
                const blob = await response.blob();
                const file = new File([blob], item.name, { type: blob.type });
                
                // Use enhanced generation with style context
                const resultUrl = await generateEnhancedOutfitModification(
                    baseImageUrl,
                    file,
                    item,
                    modelType,
                    { style: options?.style }
                );
                
                const processingTime = Date.now() - startTime;
                console.log(`✅ Successfully processed ${item.name} in ${processingTime}ms`);
                
                return { item, resultUrl, processingTime };
                
            } catch (error) {
                const processingTime = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
                
                console.error(`❌ Failed to process ${item.name} after ${processingTime}ms:`, errorMessage);
                
                return { 
                    item, 
                    error: errorMessage,
                    processingTime
                };
            }
        });
        
        // Wait for current batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                const item = batch[index];
                results.push({ 
                    item, 
                    error: result.reason?.message || 'Promise rejection',
                    processingTime: 0
                });
            }
        });
        
        // Progress callback
        if (options?.progressCallback) {
            options.progressCallback(results.length, totalItems);
        }
        
        console.log(`📊 Completed batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(totalItems / maxConcurrent)} - ${results.length}/${totalItems} items processed`);
        
        // Small delay between batches to be API-friendly
        if (i + maxConcurrent < items.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Summary statistics
    const successful = results.filter(r => r.resultUrl).length;
    const failed = results.filter(r => r.error).length;
    const avgProcessingTime = results
        .filter(r => r.processingTime)
        .reduce((sum, r) => sum + (r.processingTime || 0), 0) / successful;
    
    console.log(`🎯 Batch processing completed: ${successful} successful, ${failed} failed, avg ${avgProcessingTime.toFixed(0)}ms per item`);
    
    return results;
};