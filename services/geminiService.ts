/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { WardrobeItem } from "../types";
import { 
    initializeSession, 
    validateSession, 
    createPrediction, 
    pollForCompletion, 
    hasActiveSession 
} from "./backendService";

// --- Configuration ---
const NANO_BANANA_CONFIG = {
    model: "google/nano-banana", // Use model path instead of version
    maxImages: 4,
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

    const prompt = `Edit the person in this image to appear as a professional fashion model. Replace the background with ${backgroundInstruction}. Maintain the person's identity, facial features, and body proportions while enhancing the overall professional appearance.`;

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