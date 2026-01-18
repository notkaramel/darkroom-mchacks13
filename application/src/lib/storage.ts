// Local storage utility for persisting filter changes per image

export type FilterSettings = {
	basic: {
		brightness: number;
		contrast: number;
		highlight: number;
		shadow: number;
	};
	color: {
		temperature: number;
		tint: number;
		vibrance: number;
		saturation: number;
	};
	hsl: {
		red: { hue: number; saturation: number; luminance: number };
		orange: { hue: number; saturation: number; luminance: number };
		yellow: { hue: number; saturation: number; luminance: number };
		green: { hue: number; saturation: number; luminance: number };
		cyan: { hue: number; saturation: number; luminance: number };
		blue: { hue: number; saturation: number; luminance: number };
		purple: { hue: number; saturation: number; luminance: number };
		magenta: { hue: number; saturation: number; luminance: number };
	};
	lens_corrections: {
		distortion: number;
		chromatic_aberration: number;
		vignetting: number;
	};
	transform: {
		rotate: number;
		vertical: number;
		horizontal: number;
		perspective: number;
	};
};

const STORAGE_KEY = 'darkroom-filters';

/**
 * Save filter settings for a specific image
 */
export function saveFilters(imageUrl: string, filters: FilterSettings): void {
	if (typeof window === 'undefined') return; // Server-side guard

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		const allFilters = stored ? JSON.parse(stored) : {};

		allFilters[imageUrl] = filters;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(allFilters));
	} catch (error) {
		console.error('Failed to save filters to localStorage:', error);
	}
}

/**
 * Load filter settings for a specific image
 * Returns null if no saved filters exist for this image
 */
export function loadFilters(imageUrl: string): FilterSettings | null {
	if (typeof window === 'undefined') return null; // Server-side guard

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;

		const allFilters = JSON.parse(stored);
		return allFilters[imageUrl] || null;
	} catch (error) {
		console.error('Failed to load filters from localStorage:', error);
		return null;
	}
}

/**
 * Delete filter settings for a specific image
 */
export function deleteFilters(imageUrl: string): void {
	if (typeof window === 'undefined') return; // Server-side guard

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return;

		const allFilters = JSON.parse(stored);
		delete allFilters[imageUrl];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(allFilters));
	} catch (error) {
		console.error('Failed to delete filters from localStorage:', error);
	}
}

/**
 * Get default/empty filter settings
 */
export function getDefaultFilters(): FilterSettings {
	return {
		basic: { brightness: 0, contrast: 0, highlight: 0, shadow: 0 },
		color: { temperature: 0, tint: 0, vibrance: 0, saturation: 0 },
		hsl: {
			red: { hue: 0, saturation: 0, luminance: 0 },
			orange: { hue: 0, saturation: 0, luminance: 0 },
			yellow: { hue: 0, saturation: 0, luminance: 0 },
			green: { hue: 0, saturation: 0, luminance: 0 },
			cyan: { hue: 0, saturation: 0, luminance: 0 },
			blue: { hue: 0, saturation: 0, luminance: 0 },
			purple: { hue: 0, saturation: 0, luminance: 0 },
			magenta: { hue: 0, saturation: 0, luminance: 0 }
		},
		lens_corrections: { distortion: 0, chromatic_aberration: 0, vignetting: 0 },
		transform: { rotate: 0, vertical: 0, horizontal: 0, perspective: 0 }
	};
}

/**
 * Clear all saved filters
 */
export function clearAllFilters(): void {
	if (typeof window === 'undefined') return; // Server-side guard

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error('Failed to clear filters from localStorage:', error);
	}
}
