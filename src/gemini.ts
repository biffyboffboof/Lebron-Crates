import { GoogleGenAI } from "@google/genai";
import { resizeImage, TARGET_SIZE } from './dev';

const imageCache = JSON.parse(localStorage.getItem('imageCache') || '{}');

function saveCache() {
    try {
        localStorage.setItem('imageCache', JSON.stringify(imageCache));
    } catch (e) {
        console.error("Failed to save image cache, it might be full.", e);
        // Potentially clear some old cache items here if needed
    }
}

export async function generateItemImage(itemName: string): Promise<string> {
    if (imageCache[itemName]) {
        return imageCache[itemName];
    }
    
    // The placeholder is set by the UI before calling this function.
    // This function's job is to generate and then update the src.

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A high quality, clean icon of a single "${itemName}". Video game asset, on a simple, clean, non-distracting, one-color background, vibrant colors, stylized, centered, professional product shot.`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const rawImageUrl = `data:image/png;base64,${base64ImageBytes}`;
        
        // Resize the image before caching and displaying
        const resizedImageUrl = await resizeImage(rawImageUrl, TARGET_SIZE, TARGET_SIZE);
        
        imageCache[itemName] = resizedImageUrl;
        saveCache();
        
        // Update the image src on the page if it's currently displayed
        const images: NodeListOf<HTMLImageElement> = document.querySelectorAll(`img[data-item-name="${itemName}"]`);
        images.forEach(img => (img.src = resizedImageUrl));

        return resizedImageUrl;
    } catch (error) {
        console.error(`Error generating image for "${itemName}":`, error);
        const errorImageUrl = `https://via.placeholder.com/100/1e1e1e/FFFFFF?text=${encodeURIComponent(itemName.substring(0, 10))}`;
        // Update images with error placeholder
        const images: NodeListOf<HTMLImageElement> = document.querySelectorAll(`img[data-item-name="${itemName}"]`);
        images.forEach(img => (img.src = errorImageUrl));
        return errorImageUrl;
    }
}
