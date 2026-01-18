import * as PIXI from 'pixi.js';
import { PhotoEditFilter } from './PhotoEditFilter';
import { loadFilters, type FilterSettings } from './storage';

/**
 * Detect image format from file buffer magic bytes
 * Returns 'png', 'jpeg', 'webp', or null if unknown
 */
async function detectImageFormat(blob: Blob): Promise<'png' | 'jpeg' | 'webp' | null> {
	const arrayBuffer = await blob.slice(0, 12).arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
		return 'png';
	}

	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'jpeg';
	}

	// WebP: RIFF ... WEBP
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'webp';
	}

	return null;
}

/**
 * Export an image with filters applied using Pixi.js
 * Automatically detects and preserves the original file format
 * @param photoId - The photo ID to export
 */
export async function exportImageWithFilters(
	photoId: string,
	format?: 'png' | 'jpeg' | 'webp',
	quality: number = 0.95
): Promise<{ blob: Blob; extension: string } | null> {
	let imageUrl: string | null = null;

	try {
		// Fetch the image from API endpoint as a blob
		const apiUrl = `/api/photo/${photoId}/file`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image from ${apiUrl}: ${response.statusText}`);
		}

		const imageBlob = await response.blob();

		// Detect original format if not specified
		let exportFormat: 'png' | 'jpeg' | 'webp' = format || 'png';
		let extension = 'png';

		if (!format) {
			const detectedFormat = await detectImageFormat(imageBlob);
			if (detectedFormat) {
				exportFormat = detectedFormat;
			}
		}

		// Set extension based on format
		switch (exportFormat) {
			case 'jpeg':
				extension = 'jpg';
				break;
			case 'png':
				extension = 'png';
				break;
			case 'webp':
				extension = 'webp';
				break;
		}

		imageUrl = URL.createObjectURL(imageBlob);

		// Create an Image element from the blob URL
		const img = new Image();
		img.crossOrigin = 'anonymous';

		// Wait for image to load
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = imageUrl!;
		});

		// Create a temporary Pixi application
		const app = new PIXI.Application();

		// Create texture from the loaded image
		const texture = PIXI.Texture.from(img);

		// Initialize the app with the image dimensions
		await app.init({
			width: texture.width,
			height: texture.height,
			backgroundAlpha: 0,
			antialias: true
		});

		// Create sprite with the image
		const sprite = new PIXI.Sprite(texture);

		// Load saved filters for this image (using photoId as the key)
		const filters = loadFilters(photoId);

		if (filters) {
			// Create and configure the photo edit filter
			const photoEditFilter = new PhotoEditFilter();

			// Apply basic adjustments
			photoEditFilter.brightness = filters.basic.brightness / 200;
			photoEditFilter.contrast = filters.basic.contrast / 100;
			photoEditFilter.highlights = filters.basic.highlight / 333;
			photoEditFilter.shadows = filters.basic.shadow / 333;

			// Apply color adjustments
			photoEditFilter.temperature = filters.color.temperature / 100;
			photoEditFilter.tint = filters.color.tint / 100;
			photoEditFilter.saturation = filters.color.saturation / 100;
			photoEditFilter.vibrance = filters.color.vibrance / 200;

			// Apply HSL per-color adjustments
			photoEditFilter.setRedHSL(
				filters.hsl.red.hue / 200,
				filters.hsl.red.saturation / 100,
				filters.hsl.red.luminance / 333
			);
			photoEditFilter.setOrangeHSL(
				filters.hsl.orange.hue / 200,
				filters.hsl.orange.saturation / 100,
				filters.hsl.orange.luminance / 333
			);
			photoEditFilter.setYellowHSL(
				filters.hsl.yellow.hue / 200,
				filters.hsl.yellow.saturation / 100,
				filters.hsl.yellow.luminance / 333
			);
			photoEditFilter.setGreenHSL(
				filters.hsl.green.hue / 200,
				filters.hsl.green.saturation / 100,
				filters.hsl.green.luminance / 333
			);
			photoEditFilter.setCyanHSL(
				filters.hsl.cyan.hue / 200,
				filters.hsl.cyan.saturation / 100,
				filters.hsl.cyan.luminance / 333
			);
			photoEditFilter.setBlueHSL(
				filters.hsl.blue.hue / 200,
				filters.hsl.blue.saturation / 100,
				filters.hsl.blue.luminance / 333
			);
			photoEditFilter.setPurpleHSL(
				filters.hsl.purple.hue / 200,
				filters.hsl.purple.saturation / 100,
				filters.hsl.purple.luminance / 333
			);
			photoEditFilter.setMagentaHSL(
				filters.hsl.magenta.hue / 200,
				filters.hsl.magenta.saturation / 100,
				filters.hsl.magenta.luminance / 333
			);

			// Lens Corrections
			photoEditFilter.distortion = filters.lens_corrections.distortion / 100;
			photoEditFilter.chromaticAberration = filters.lens_corrections.chromatic_aberration / 100;
			photoEditFilter.vignetting = filters.lens_corrections.vignetting / 100;

			// Transform
			photoEditFilter.rotation = filters.transform.rotate;
			photoEditFilter.vertical = filters.transform.vertical;
			photoEditFilter.horizontal = filters.transform.horizontal;
			photoEditFilter.perspective = filters.transform.perspective / 100;

			// Apply the filter to the sprite
			sprite.filters = [photoEditFilter];
		}

		// Add sprite to stage
		app.stage.addChild(sprite);

		// Render one frame to ensure everything is drawn
		app.renderer.render(app.stage);

		// Extract the image as blob using canvas
		const canvas = app.renderer.canvas as HTMLCanvasElement;

		// Determine MIME type based on format
		let mimeType: string;
		switch (exportFormat) {
			case 'jpeg':
				mimeType = 'image/jpeg';
				break;
			case 'png':
				mimeType = 'image/png';
				break;
			case 'webp':
				mimeType = 'image/webp';
				break;
			default:
				mimeType = 'image/png';
		}

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((blob) => resolve(blob), mimeType, quality);
		});

		// Clean up
		texture.destroy(true);
		app.destroy(true);

		// Revoke object URL
		if (imageUrl) {
			URL.revokeObjectURL(imageUrl);
		}

		if (!blob) {
			return null;
		}

		return { blob, extension };
	} catch (error) {
		console.error('Failed to export image:', error);

		// Clean up object URL on error
		if (imageUrl) {
			URL.revokeObjectURL(imageUrl);
		}

		return null;
	}
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Export multiple images with filters applied
 * Automatically preserves original file format for each image
 * @param photoIds - Array of photo IDs to export
 */
export async function exportMultipleImages(
	photoIds: string[],
	format?: 'png' | 'jpeg' | 'webp',
	quality: number = 0.95,
	onProgress?: (current: number, total: number) => void
): Promise<void> {
	let processed = 0;

	for (const photoId of photoIds) {
		try {
			const result = await exportImageWithFilters(photoId, format, quality);

			if (result) {
				// Generate filename from timestamp and index, using detected extension
				const timestamp = new Date().getTime();
				const filename = `darkroom-export-${timestamp}-${processed + 1}.${result.extension}`;

				downloadBlob(result.blob, filename);
			}

			processed++;
			onProgress?.(processed, photoIds.length);
		} catch (error) {
			console.error(`Failed to export image ${photoId}:`, error);
			processed++;
			onProgress?.(processed, photoIds.length);
		}

		// Small delay between downloads to prevent browser issues
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}
