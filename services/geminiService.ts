/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { WardrobeItem } from "../types";

// --- Configuration ---
const NANO_BANANA_CONFIG = {
    version: "d71389e6c46a69163f523f2f53a80f0120eea866ad5082a0b16f27b523e42531",
    maxImages: 4,
    supportedFormats: ['jpg', 'png', 'webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
};

// A list of reliable CORS proxies to try in order.
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/', // Keep the old one as a fallback
];
const REPLICATE_API_ENDPOINT = "https://api.replicate.com/v1/predictions";
const POLLING_INTERVAL_MS = 2500; // Poll every 2.5 seconds
const SYNC_WAIT_TIMEOUT = 60; // Wait up to 60 seconds for a synchronous response

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
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = (resource: RequestInfo | URL, options: RequestInit, timeout: number = 45000): Promise<Response> => {
    return new Promise(async (resolve, reject) => {
        const controller = new AbortController();
        const { signal: externalSignal } = options;

        const timeoutId = setTimeout(() => {
            controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
        }, timeout);

        const onExternalAbort = () => {
            controller.abort(externalSignal?.reason);
        };

        externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal,
            });
            resolve(response);
        } catch (error) {
            reject(error);
        } finally {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', onExternalAbort);
        }
    });
};


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

// --- Core API Logic ---
const runReplicatePrediction = async (input: ReplicateInput, signal?: AbortSignal): Promise<string> => {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
        throw new ApiError('Replicate API Key not found. Please set it on the start screen.');
    }

    // Validate input before sending
    const validatedInput = {
        prompt: input.prompt.trim(),
        image_input: input.image_input.filter(img => img && typeof img === 'string' && img.startsWith('data:image')),
        ...(input.output_format && { output_format: input.output_format })
    };

    if (validatedInput.image_input.length === 0) {
        throw new ApiError('No valid input images provided for the prediction.');
    }

    let lastError: Error | null = null;
    
    for (const proxy of CORS_PROXIES) {
        const startTime = performance.now();
        try {
            console.log(`Attempting prediction with proxy: ${proxy}`);
            const endpoint = `${proxy}${REPLICATE_API_ENDPOINT}`;

            // 1. Create Prediction, preferring a synchronous response with a timeout.
            const createResponse = await fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': `wait=${SYNC_WAIT_TIMEOUT}`,
                    'X-Requested-With': 'XMLHttpRequest', // For better proxy compatibility
                },
                body: JSON.stringify({
                    version: NANO_BANANA_CONFIG.version,
                    input: validatedInput,
                }),
                signal,
            }, SYNC_WAIT_TIMEOUT * 1000 + 10000); // Wait 10s longer than the sync timeout
            
            if (signal?.aborted) throw new ApiError('Operation was cancelled.');

            if (!createResponse.ok) {
                let errorMessage = `API Error (${createResponse.status})`;
                try {
                    const errorBody = await createResponse.json();
                    errorMessage = errorBody.detail || JSON.stringify(errorBody);
                } catch (e) {
                    try {
                        const errorText = await createResponse.text();
                        errorMessage = errorText || errorMessage;
                    } catch (e2) { /* ignore secondary error */ }
                }
                console.error('Replicate API Error Response:', errorMessage);
                throw new ApiError(errorMessage);
            }

            let prediction = await createResponse.json();

            // 2. Poll for the result if the prediction didn't complete synchronously.
            if (createResponse.status === 201 || createResponse.status === 202) {
                const getUrl = prediction.urls?.get;
                if (!getUrl) {
                    throw new ApiError('Polling URL not found in API response.');
                }
                
                const pollingUrl = `${proxy}${getUrl}`; // Important: Poll through the same proxy
                
                while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                    if (signal?.aborted) throw new ApiError('Operation was cancelled.');
                    await sleep(POLLING_INTERVAL_MS);
                    
                    const getResponse = await fetchWithTimeout(pollingUrl, {
                        headers: { 'Authorization': `Token ${apiKey}` },
                        signal,
                    }, 15000); // 15 second timeout for polling requests

                    if (getResponse.ok) {
                      prediction = await getResponse.json();
                    } else {
                      console.warn(`Polling failed with status ${getResponse.status}, continuing poll.`);
                    }
                }
            }

            // 3. Process the final result.
            if (prediction.status === 'failed') {
                throw new ApiError(`Image generation failed: ${prediction.error}`);
            }
            if (prediction.status !== 'succeeded') {
                throw new ApiError(`Prediction finished with unexpected status: ${prediction.status}`);
            }
            
            const output = prediction.output;
            let resultUrl: string | undefined;

            if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
                resultUrl = output[0];
            } else if (typeof output === 'string') {
                resultUrl = output;
            }

            if (resultUrl) {
                const endTime = performance.now();
                console.log(`✅ Request succeeded via ${proxy} in ${(endTime - startTime).toFixed(0)}ms`);
                return resultUrl;
            }

            throw new ApiError('Prediction succeeded but a valid image URL was not returned.');

        } catch (error: any) {
            const endTime = performance.now();
            if (signal?.aborted) {
                console.warn(`❌ Request cancelled by user via ${proxy} after ${(endTime - startTime).toFixed(0)}ms.`);
                throw new ApiError('Operation was cancelled.');
            }
            console.warn(`❌ Proxy ${proxy} failed in ${(endTime - startTime).toFixed(0)}ms: ${error.message}. Trying next proxy...`);
            lastError = error;
        }
    }

    throw lastError || new ApiError('All CORS proxies failed. Please check your network connection.');
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