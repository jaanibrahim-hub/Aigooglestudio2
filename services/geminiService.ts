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
        ? 'solid black background'
        : 'clean white studio background';

    const prompt = `Professional full-body fashion model photo. Transform this person into a complete head-to-toe model shot suitable for clothing try-on. Show the entire body from head to feet in a natural standing pose. Use ${backgroundInstruction}. Keep the person's exact face, identity, and body proportions. Professional studio lighting, high quality fashion photography style.`;

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
    
    const prompt = `Virtual clothing try-on. Take the clothing item from the second image and put it on the person in the first image. Keep the same person, same face, same body, same pose, same background from the first image. Only replace the conflicting clothes with the new garment. The person's identity and appearance must remain identical.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, garmentDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

/**
 * Generate face replacement while preserving the body and clothing
 */
export const generateFaceReplacement = async (
    baseModelImageUrl: string,
    faceReferenceImage: File,
    options?: GenerationOptions
): Promise<string> => {
    const faceDataUrl = await fileToDataUrl(faceReferenceImage);
    
    const prompt = `Replace ONLY the face in the first image with the face from the second image. Keep the exact same body, clothing, pose, background, and everything else from the first image. Only change the facial features - do not change the body, clothes, or pose at all.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [baseModelImageUrl, faceDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

/**
 * Specialized face-only replacement function (nano-banana optimized)
 */
export const generateFaceOnlyReplacement = async (
    baseModelImageUrl: string,
    faceReferenceImage: File,
    options?: GenerationOptions
): Promise<string> => {
    const faceDataUrl = await fileToDataUrl(faceReferenceImage);
    
    const prompt = `Face swap only. Replace the face in the first image with the face from the second image. Keep everything else from the first image exactly the same: same body, same clothes, same pose, same background, same lighting, same accessories. Only change the facial features and blend seamlessly at the neck.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [baseModelImageUrl, faceDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};

/**
 * Generate clothing-only try-on with category-specific replacement
 */
export const generateClothingOnlyTryOn = async (
    baseModelImageUrl: string,
    clothingReferenceImage: File,
    itemCategory: ItemCategory,
    options?: GenerationOptions & { 
        scene?: string; 
        background?: string; 
    }
): Promise<string> => {
    const clothingDataUrl = await fileToDataUrl(clothingReferenceImage);
    
    let removalInstruction = '';
    switch (itemCategory) {
        case 'top':
            removalInstruction = 'Replace only the shirt/top while keeping pants, shoes, and everything else the same';
            break;
        case 'bottom':
            removalInstruction = 'Replace only the pants/bottoms while keeping the top, shoes, and everything else the same';
            break;
        case 'shoes':
            removalInstruction = 'Replace only the shoes while keeping all clothing the same';
            break;
        default:
            removalInstruction = `Replace only the ${itemCategory} while keeping everything else identical`;
    }
    
    let backgroundInstruction = '';
    if (options?.background) {
        backgroundInstruction = ` Change the background to: ${options.background}.`;
    } else {
        backgroundInstruction = ' Keep the same background.';
    }
    
    const prompt = `${removalInstruction}. Take the clothing item from the second image and apply it to the person in the first image. Keep the same person, same face, same pose.${backgroundInstruction} Only change the specific clothing piece and background if specified.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [baseModelImageUrl, clothingDataUrl],
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
    
    // Special handling for face category - use dedicated face replacement
    if (itemInfo.category === 'face') {
        return generateFaceOnlyReplacement(modelImageUrl, itemImage, options);
    }
    
    let prompt = '';
    const basePreservation = `Keep the exact same person, face, body proportions, pose, and background from the first image. `;

    switch (itemInfo.category) {
        case 'top':
            prompt = `${basePreservation}Replace only the shirt/top/upper clothing with the garment from the second image. Keep pants, shoes, accessories, and everything else identical.`;
            break;
        case 'bottom':
            prompt = `${basePreservation}Replace only the pants/bottoms/lower clothing with the garment from the second image. Keep shirt, shoes, accessories, and everything else identical.`;
            break;
        case 'shoes':
            prompt = `${basePreservation}Replace only the footwear with the shoes from the second image. Keep all clothing, accessories, and everything else identical.`;
            break;
        case 'jewelry':
            prompt = `${basePreservation}Add the jewelry from the second image as an accessory. Do not remove any existing clothing. Position naturally (necklace around neck, ring on finger, etc.).`;
            break;
        case 'eyewear':
            prompt = `${basePreservation}Add the eyewear from the second image to the person's face. Do not change any clothing. Ensure proper fit and positioning.`;
            break;
        case 'bags':
            prompt = `${basePreservation}Add the bag from the second image in a natural carrying position. Do not change any clothing. Position based on bag type (shoulder, hand, back, etc.).`;
            break;
        case 'watches':
            prompt = `${basePreservation}Add the watch from the second image to the person's wrist. Do not change any clothing. Ensure proper sizing and positioning.`;
            break;
        case 'accessories':
            prompt = `${basePreservation}Add the accessory from the second image appropriately. Do not change any clothing. Position naturally based on accessory type.`;
            break;
        case 'held':
            prompt = `${basePreservation}Position the person naturally holding the item from the second image. Adjust hand position realistically but keep all clothing identical.`;
            break;
        case 'hair':
            prompt = `${basePreservation}Change only the hairstyle to match the hair from the second image. Keep the exact same face, clothing, pose, and background.`;
            break;
        default:
            // Fallback to general try-on
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
    const prompt = `🎯 POSE TRANSFORMATION SPECIALIST

📋 MISSION: Change the person's pose to match this specific instruction: "${poseInstruction}"

👤 ABSOLUTE PRESERVATION REQUIREMENTS:
- Maintain EXACT facial features, identity, skin tone, and all unique characteristics
- Keep identical clothing items, colors, patterns, and styling exactly as they appear
- Preserve all accessories (jewelry, shoes, bags, etc.) in their current state
- Maintain background, lighting direction, shadows, and camera perspective perfectly
- Honor fabric textures, material properties, and garment details precisely

🔄 POSE TRANSFORMATION PROTOCOL:
- Apply the requested pose change: "${poseInstruction}"
- Ensure anatomically correct body positioning and natural movement
- Maintain realistic joint angles and comfortable human positioning
- Preserve natural body proportions and individual physical characteristics
- Create smooth, graceful transition to the new pose without awkwardness

👔 CLOTHING ADAPTATION REQUIREMENTS:
- Fabric must drape naturally according to gravity and body position in the new pose
- Create realistic wrinkles, folds, and fabric tension appropriate for the pose change
- Maintain proper garment fit and positioning relative to the new body position
- Ensure clothing continues to look naturally worn, not artificially positioned
- Preserve fabric behavior consistent with material properties (stretch, stiffness, etc.)

🎨 TECHNICAL EXCELLENCE:
- Maintain consistent lighting and shadow direction throughout the transformation
- Apply realistic shadow casting from the body in the new pose
- Ensure seamless integration with no visible editing artifacts
- Preserve original image quality, sharpness, and color accuracy
- Create natural depth and perspective appropriate for the new positioning

✅ QUALITY VALIDATION:
- Pose appears natural, comfortable, and humanly achievable
- All clothing drapes and behaves realistically for the new position
- Identity, styling, and scene context remain perfectly preserved
- Result looks like the same person naturally moved into the new pose
- No artificial distortions, floating elements, or impossible physics

EXECUTE: Transform only the pose while preserving everything else with complete photorealistic accuracy.`;
    
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
    let instructions = `🔄 COMPLETE UPPER BODY REPLACEMENT:

REMOVAL PHASE:
- Remove ALL existing upper body garments completely (shirts, blouses, jackets, sweaters, tank tops, vests)
- Clear the entire torso area while preserving natural skin texture and tone
- Maintain lower body clothing, accessories, and undergarments as appropriate
- Ensure clean removal without artifacts or remnants of previous clothing

APPLICATION PHASE:
- Apply ${item.name} as the new primary upper body garment
- Position with anatomically correct shoulder alignment and natural fit
- Ensure proper neckline positioning that complements the person's anatomy
- Fit sleeves (if applicable) to exact arm length and width measurements
- Position hem at appropriate torso level for the specific garment style`;
    
    // Material-specific enhancements
    if (item.material) {
        const materialDetails = {
            cotton: "soft, breathable fabric with natural wrinkles and comfortable drape",
            denim: "structured cotton weave with authentic stitching, proper weight, and characteristic texture",
            silk: "luxurious flowing material with subtle sheen and elegant fluid movement",
            leather: "form-fitting structured material with realistic texture, natural creasing, and appropriate reflections",
            wool: "cozy textured fabric with natural fiber appearance and seasonal warmth characteristics",
            linen: "crisp breathable fabric with characteristic natural wrinkles and lightweight texture",
            polyester: "smooth wrinkle-resistant synthetic with clean lines and consistent appearance",
            spandex: "stretchy form-fitting material that moves naturally with body contours"
        };
        
        const detail = materialDetails[item.material];
        if (detail) {
            instructions += `\n\nMATERIAL PROPERTIES: Apply authentic ${item.material} characteristics - ${detail}. Ensure the fabric behaves realistically with proper weight, texture, and draping physics.`;
        }
    }
    
    // Fit-specific detailed adjustments
    if (item.fit) {
        const fitGuidelines = {
            slim: "Close-fitting silhouette that follows body contours naturally without appearing restrictive. Show natural body shape through the fabric with appropriate ease.",
            regular: "Standard comfortable fit with proper room for movement and natural drape. Neither too tight nor too loose - classic flattering proportions.",
            loose: "Relaxed fit with extra room for comfort, but still maintaining flattering silhouette. Avoid appearing oversized accidentally - should look intentionally stylish.",
            oversized: "Intentionally larger fit that appears fashionable and deliberate, not poorly sized. Maintain style proportions even with extra room.",
            fitted: "Body-hugging fit that elegantly enhances natural shape without being restrictive. Perfect contouring that flatters the figure professionally."
        };
        
        instructions += `\n\nFIT SPECIFICATION: ${fitGuidelines[item.fit] || 'Apply natural, comfortable fit that flatters the body type.'}`;
    }

    // Occasion and styling context
    if (item.occasion) {
        const occasionStyling = {
            casual: "Style for everyday comfort with relaxed elegance and effortless appeal",
            business: "Maintain crisp, professional appearance suitable for workplace environments",
            formal: "Apply sophisticated, refined styling appropriate for elegant events and occasions",
            athletic: "Ensure performance-oriented fit with functional elements and movement capability",
            party: "Add fashionable flair with attention-grabbing style details and visual appeal",
            outdoor: "Apply practical styling suitable for outdoor activities with appropriate durability",
            lounge: "Create comfortable, relaxed styling perfect for leisure and informal settings"
        };
        instructions += `\n\nOCCASION STYLING: ${occasionStyling[item.occasion] || 'Apply appropriate styling for the garment type.'}`;
    }
    
    instructions += `\n\nCRITICAL FITTING REQUIREMENTS:
- Shoulders must align perfectly with the person's natural shoulder width and slope
- Natural armpit positioning with realistic side seam placement  
- Proper fabric tension and stretch around chest, waist, and torso curves
- Realistic neckline that complements face shape and proportions
- Natural sleeve attachment and armhole positioning (if applicable)
- Appropriate garment length and hem positioning for the style
- No floating, disconnected, or unnaturally positioned fabric areas
- Seamless integration with existing lower body clothing and accessories`;
    
    return instructions;
};

const generateBottomInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `🔄 COMPLETE LOWER BODY REPLACEMENT:

REMOVAL PHASE:
- Remove ALL existing lower body garments completely (pants, skirts, shorts, leggings, capris)
- Clear the entire hip, thigh, and leg area while preserving natural skin texture
- Maintain upper body clothing, footwear, and accessories unless specifically replacing those
- Ensure clean removal of previous garments with no remnants or artifacts

APPLICATION PHASE:
- Apply ${item.name} as the new primary lower body garment
- Position waistline at the person's natural waist level with proper fit
- Ensure anatomically correct hip accommodation and thigh positioning
- Fit the garment to exact leg width, length, and body proportions
- Create natural crotch area positioning and realistic inseam alignment`;
    
    // Enhanced material-specific details
    if (item.material) {
        const materialSpecs = {
            denim: "Apply authentic denim characteristics with visible contrast stitching, natural fade patterns, realistic pocket placement, proper fabric weight and stiffness, characteristic indigo coloring",
            cotton: "Soft, breathable fabric behavior with natural draping, comfortable stretch, and casual appearance suitable for everyday wear",
            leather: "Structured, form-fitting material with realistic texture, appropriate sheen, natural creasing patterns, and premium appearance",
            wool: "Warm, textured fabric with natural fiber appearance, appropriate weight for the season, and professional tailored look",
            linen: "Crisp, lightweight fabric with characteristic natural wrinkles, breathable appearance, and elegant casual styling",
            spandex: "Stretchy, form-fitting material that moves naturally with the body, maintaining shape while allowing full range of motion"
        };
        
        if (materialSpecs[item.material]) {
            instructions += `\n\nMATERIAL AUTHENTICITY: ${materialSpecs[item.material]}`;
        }
    }
    
    if (item.fit) {
        const fitInstructions = {
            skinny: "Form-fitting silhouette that follows leg contours naturally from hip to ankle without appearing painted-on. Natural body shape visible through fabric with appropriate stretch.",
            slim: "Tailored fit that's close to the body but allows comfortable movement. Streamlined silhouette with flattering proportions throughout legs and hips.",
            straight: "Classic straight-leg silhouette with consistent width from hip to hem. Timeless, flattering cut that works for all body types.",
            loose: "Relaxed fit with comfortable room throughout legs and hips while maintaining stylish proportions. Casual elegance without appearing oversized.",
            bootcut: "Fitted through hips and thighs with subtle flare from knee to hem. Balanced proportions that complement footwear choices.",
            wide: "Intentionally wider leg openings with flowing, elegant drape. Fashion-forward proportions that create dramatic silhouette."
        };
        instructions += `\n\nFIT SPECIFICATION: ${fitInstructions[item.fit] || 'Apply natural, flattering fit that suits the body type.'}`;
    }
    
    instructions += `\n\nCRITICAL FITTING REQUIREMENTS:
- Proper waistline positioning at natural waist level (high, mid, or low rise as appropriate)
- Natural hip curve accommodation with realistic fabric behavior over glutes and thighs
- Appropriate inseam length and crotch positioning for comfort and authenticity
- Realistic hem length matching the intended style (full-length, cropped, ankle, etc.)
- Natural fabric draping and tension at movement points (knees, seat, thighs)
- Proper rise and leg opening proportions for the specific garment style
- Seamless integration with existing upper body clothing and footwear
- No floating, bunching, or unnaturally positioned fabric areas`;
    
    return instructions;
};

const generateShoeInstructions = (item: EnhancedItemInfo, context: PromptContext): string => {
    let instructions = `👟 COMPLETE FOOTWEAR REPLACEMENT:

REMOVAL PHASE:
- Remove ALL existing footwear completely (shoes, boots, sandals, slippers)
- Clear feet area while preserving natural foot shape and skin texture
- Maintain all clothing, accessories, and socks/hosiery as appropriate

APPLICATION PHASE:
- Apply ${item.name} with anatomically correct foot positioning
- Ensure proper sizing proportional to the person's foot measurements
- Position with realistic ground contact and natural weight distribution
- Create appropriate heel height and sole thickness for the shoe type`;

    // Material-specific shoe characteristics
    if (item.material) {
        const shoeMaterials = {
            leather: "Apply authentic leather texture with natural creasing, appropriate sheen, and premium appearance. Show realistic wear patterns and flexibility.",
            canvas: "Create breathable fabric appearance with natural texture and casual styling. Ensure proper fabric behavior and comfort appearance.",
            rubber: "Apply weather-resistant material properties with appropriate grip patterns and functional design elements.",
            synthetic: "Create modern synthetic material appearance with appropriate technical properties and contemporary styling."
        };
        
        if (shoeMaterials[item.material]) {
            instructions += `\n\nMATERIAL AUTHENTICITY: ${shoeMaterials[item.material]}`;
        }
    }

    // Occasion-specific styling
    if (item.occasion) {
        const shoeOccasions = {
            athletic: "Apply performance-oriented design with proper arch support appearance, breathable materials, and functional athletic styling",
            formal: "Maintain elegant, polished appearance suitable for formal occasions with refined silhouette and premium finishing",
            casual: "Create comfortable, everyday styling with relaxed proportions and versatile appearance",
            business: "Apply professional styling appropriate for workplace environments with polished, conservative design",
            outdoor: "Show durable construction with appropriate grip patterns and weather-resistant properties"
        };
        
        if (shoeOccasions[item.occasion]) {
            instructions += `\n\nOCCASION STYLING: ${shoeOccasions[item.occasion]}`;
        }
    }

    instructions += `\n\nCRITICAL FOOTWEAR REQUIREMENTS:
- Proper foot-to-shoe proportion matching the person's natural foot size
- Realistic ground contact with authentic shadow casting and weight distribution
- Natural ankle positioning and comfortable fit appearance around foot contours
- Appropriate lacing, straps, or closure systems positioned correctly and functionally
- Proper heel-to-toe alignment matching the person's natural stance and gait
- Seamless integration with existing leg clothing (pants, skirts, socks, tights)
- Realistic sole thickness and heel height appropriate for the shoe style
- No floating, misaligned, or unnaturally positioned footwear elements`;
    
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
    
    // Build intelligent layering instructions with identity preservation focus
    let layeredInstructions = `Apply all ${selectedItems.length} items to the person from the first image while keeping their exact identity, face, body, pose, and background unchanged. Use professional fashion coordination.\n\n`;

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
    layeredInstructions += `🎯 FINAL REQUIREMENTS:\n`;
    layeredInstructions += `- Keep the exact same person identity, face, and body from the first image\n`;
    layeredInstructions += `- Ensure all ${selectedItems.length} items coordinate harmoniously\n`;
    layeredInstructions += `- Maintain the same pose, background, and lighting\n`;
    layeredInstructions += `- Apply professional styling for a cohesive look\n`;
    
    if (options?.style) {
        layeredInstructions += `- Overall aesthetic should reflect ${options.style} styling approach\n`;
    }
    
    layeredInstructions += `\nThe person's identity must remain completely unchanged while wearing the new coordinated outfit.`;

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

/**
 * Universal Virtual Try-On Function - Handles any clothing type with advanced prompting
 */
export const generateUniversalVirtualTryOn = async (
    modelImageUrl: string,
    garmentImage: File,
    itemInfo: WardrobeItem,
    modelType: ModelType,
    options?: GenerationOptions & { 
        preserveBackground?: boolean;
        enhanceLighting?: boolean;
        style?: 'casual' | 'formal' | 'athletic' | 'trendy' | 'classic';
    }
): Promise<string> => {
    const garmentDataUrl = await fileToDataUrl(garmentImage);
    
    // Build context-aware prompt based on item category
    let prompt = `🎯 PROFESSIONAL VIRTUAL FITTING SPECIALIST

TRANSFORMATION OBJECTIVE: Apply the garment from image 2 to the person in image 1 with complete photorealistic precision.

📋 STEP 1 - COMPREHENSIVE ANALYSIS PHASE:
- Identify the exact garment type, style, cut, material, and intended fit from reference image
- Analyze the person's body proportions, current pose, and existing outfit composition  
- Determine which existing clothing items need removal vs. preservation
- Study lighting direction, background elements, and overall photography style

🚫 STEP 2 - PRECISE REMOVAL PROTOCOL:`;

    // Category-specific removal and application instructions
    switch (itemInfo.category) {
        case 'top':
            prompt += `
- Remove ALL upper body clothing completely (shirts, blouses, jackets, sweaters, vests, tank tops)
- Preserve lower body clothing, footwear, and appropriate accessories
- Maintain natural skin appearance and texture in newly exposed torso areas
- Keep undergarments as contextually appropriate for the new garment style`;
            break;
        case 'bottom':
            prompt += `
- Remove ALL lower body clothing completely (pants, skirts, shorts, leggings, capris)
- Preserve upper body clothing, footwear, and all accessories
- Maintain natural skin appearance in exposed leg areas for shorter garments
- Ensure smooth transition areas where new garment meets existing clothing`;
            break;
        case 'shoes':
            prompt += `
- Remove existing footwear completely while preserving foot shape and natural positioning
- Maintain all clothing items and accessories in their current state
- Keep natural stance and weight distribution for proper shoe application`;
            break;
        case 'face':
            prompt += `
- This is a FACE SWAP operation - replace ONLY facial features from reference image
- Preserve ALL existing clothing, hair, accessories, body, pose, and background
- Maintain seamless blending at neck boundary with natural skin tone matching`;
            break;
        case 'hair':
            prompt += `
- This is a HAIRSTYLE CHANGE operation - modify ONLY the hair from reference image  
- Preserve ALL existing facial features, clothing, accessories, body, pose, and background
- Ensure new hairstyle fits naturally on existing head shape and proportions`;
            break;
        default:
            prompt += `
- Remove only conflicting items that would interfere with the new ${itemInfo.category}
- Preserve all non-conflicting clothing, accessories, and styling elements
- Maintain overall outfit integrity while integrating the new item naturally`;
    }

    prompt += `

👔 STEP 3 - EXPERT GARMENT APPLICATION:
- Apply ${itemInfo.name} with anatomically perfect positioning and natural fit
- Match the person's exact body measurements, proportions, and physical characteristics
- Ensure proper garment mechanics (how it should naturally sit, hang, and move)
- Maintain ALL original garment details: colors, patterns, textures, hardware, logos
- Create realistic fabric physics with natural draping, wrinkles, and material behavior

🎨 STEP 4 - PHOTOREALISTIC INTEGRATION:
- Match existing lighting conditions, shadow directions, and ambient illumination
- Apply consistent color temperature and maintain original image's color palette
- Ensure seamless blending with no visible transition lines or editing artifacts
- Create natural depth, perspective, and dimensional accuracy throughout
- Maintain professional ${options?.style || 'natural'} styling approach

👤 STEP 5 - IDENTITY PRESERVATION (CRITICAL PRIORITY):
- Maintain EXACT facial features, bone structure, skin tone, and unique characteristics
- Keep identical body pose, stance, arm/leg positioning, and natural proportions  
- Preserve original background ${options?.preserveBackground !== false ? 'perfectly without any changes' : 'or enhance subtly if needed'}
- Honor camera angle, perspective, and original photographic composition
- Maintain individual beauty marks, tattoos, and distinctive physical traits

🔍 STEP 6 - MATERIAL AUTHENTICITY:`;

    // Add material-specific instructions if available
    const enhancedItemInfo = {
        ...itemInfo,
        material: detectMaterial(itemInfo.name),
        fit: detectFit(itemInfo.name),
        occasion: detectOccasion(itemInfo.name),
    } as EnhancedItemInfo;

    if (enhancedItemInfo.material) {
        const materialBehaviors = {
            cotton: "Apply soft, breathable characteristics with natural draping and comfortable appearance",
            denim: "Show structured weave with authentic stitching, proper weight, and characteristic indigo properties",
            silk: "Create luxurious flow with subtle sheen and elegant movement appropriate for the garment style",
            leather: "Apply structured texture with natural creasing, appropriate reflections, and premium appearance",
            wool: "Show textured fiber appearance with appropriate weight and seasonal warmth characteristics",
            linen: "Apply crisp, lightweight texture with characteristic natural wrinkles and breathable appearance"
        };

        if (materialBehaviors[enhancedItemInfo.material]) {
            prompt += `\n- ${materialBehaviors[enhancedItemInfo.material]}`;
        }
    }

    prompt += `
- Ensure fabric behaves according to its properties (stretch, drape, stiffness, weight)
- Apply appropriate surface textures, reflections, and material-specific characteristics
- Create realistic interaction between fabric and body movement/positioning

✅ STEP 7 - QUALITY VALIDATION CHECKLIST:
✓ Garment fits the person's body naturally without distortion, floating, or misalignment
✓ All garment details (buttons, zippers, patterns, logos, seams) are clearly visible and accurate  
✓ No unnaturally positioned fabric areas or impossible garment behavior
✓ Lighting and shadows are consistent and realistic throughout the entire image
✓ Person's identity, pose, and scene context remain exactly identical to the original
✓ Material properties are authentic and behave realistically
✓ Result appears as if the person naturally chose and wore this exact garment
✓ Professional ${modelType === 'kid' ? 'child-appropriate' : 'fashion photography'} quality achieved
✓ Zero visible editing artifacts or unnatural transitions

EXECUTE TRANSFORMATION: Apply the garment from image 2 to the person in image 1 with complete photorealistic precision, maintaining perfect identity preservation and natural integration.`;

    const input: ReplicateInput = {
        prompt,
        image_input: [modelImageUrl, garmentDataUrl],
        output_format: 'png',
    };

    return runReplicatePrediction(input, options?.signal);
};