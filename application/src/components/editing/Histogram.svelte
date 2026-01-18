<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { PhotoEditFilter } from '$lib/PhotoEditFilter';
	import type { FilterSettings } from '$lib/storage';

	// Props
	let {
		photoId = null,
		filters
	}: {
		photoId: string | null;
		filters: FilterSettings;
	} = $props();

	// State: Canvas element reference
	let canvasElement: HTMLCanvasElement;

	// State: Histogram data
	let histogram = $state<{
		// Exposure/Luminance histogram (0-255 brightness levels)
		luminance: number[];
		// RGB channels
		red: number[];
		green: number[];
		blue: number[];
		// 8 color channels (HSL-based color distribution)
		redChannel: number[];
		orangeChannel: number[];
		yellowChannel: number[];
		greenChannel: number[];
		cyanChannel: number[];
		blueChannel: number[];
		purpleChannel: number[];
		magentaChannel: number[];
	}>({
		luminance: new Array(256).fill(0),
		red: new Array(256).fill(0),
		green: new Array(256).fill(0),
		blue: new Array(256).fill(0),
		redChannel: new Array(256).fill(0),
		orangeChannel: new Array(256).fill(0),
		yellowChannel: new Array(256).fill(0),
		greenChannel: new Array(256).fill(0),
		cyanChannel: new Array(256).fill(0),
		blueChannel: new Array(256).fill(0),
		purpleChannel: new Array(256).fill(0),
		magentaChannel: new Array(256).fill(0)
	});

	// State: View mode (luminance, rgb, or colors)
	let viewMode = $state<'luminance' | 'rgb' | 'colors'>('rgb');

	/**
	 * Convert RGB to HSL
	 */
	function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
		r /= 255;
		g /= 255;
		b /= 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r:
					h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
					break;
				case g:
					h = ((b - r) / d + 2) / 6;
					break;
				case b:
					h = ((r - g) / d + 4) / 6;
					break;
			}
		}

		return [h, s, l];
	}

	/**
	 * Get color channel weight for a given HSL hue value
	 * Returns which of the 8 color channels this hue belongs to
	 */
	function getColorChannelWeight(hue: number): {
		red: number;
		orange: number;
		yellow: number;
		green: number;
		cyan: number;
		blue: number;
		purple: number;
		magenta: number;
	} {
		// Color ranges (normalized 0-1)
		// Red: 0° (0.0) and 360° (1.0) - spans both ends
		// Orange: 30° (0.083)
		// Yellow: 60° (0.167)
		// Green: 120° (0.333)
		// Cyan: 180° (0.5)
		// Blue: 240° (0.667)
		// Purple: 270° (0.75)
		// Magenta: 330° (0.917)

		const feather = 0.083; // ~30 degrees feathering

		function getWeight(h: number, center: number): number {
			let dist = Math.abs(h - center);
			if (dist > 0.5) dist = 1.0 - dist; // Wrap around for red
			if (dist >= feather) return 0;
			return 0.5 + 0.5 * Math.cos((dist / feather) * Math.PI);
		}

		return {
			red: Math.max(getWeight(hue, 0.0), getWeight(hue, 1.0)),
			orange: getWeight(hue, 0.083),
			yellow: getWeight(hue, 0.167),
			green: getWeight(hue, 0.333),
			cyan: getWeight(hue, 0.5),
			blue: getWeight(hue, 0.667),
			purple: getWeight(hue, 0.75),
			magenta: getWeight(hue, 0.917)
		};
	}

	/**
	 * Calculate histogram from filtered image
	 */
	async function calculateHistogram(photoId: string, filterSettings: FilterSettings) {
		let imageUrl: string | null = null;
		let texture: PIXI.Texture | null = null;
		let app: PIXI.Application | null = null;

		try {
			// Fetch image from API
			const apiUrl = `/api/photo/${photoId}/file`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.statusText}`);
			}

			const blob = await response.blob();
			imageUrl = URL.createObjectURL(blob);

			// Load image first to get dimensions
			const img = new Image();
			img.crossOrigin = 'anonymous';

			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = imageUrl || '';
			});

			// Create texture from loaded image
			texture = PIXI.Texture.from(img);

			// Create temporary PIXI app with actual image dimensions
			app = new PIXI.Application();

			// Initialize app with image dimensions for accurate pixel extraction
			await app.init({
				width: texture.width,
				height: texture.height,
				backgroundAlpha: 0,
				resolution: 1,
				antialias: false
			});

			// Create sprite from texture
			const sprite = new PIXI.Sprite(texture);

			// Create and apply filter
			const photoFilter = new PhotoEditFilter();

			// Apply all filter settings
			const { basic, color, hsl, lens_corrections, transform } = filterSettings;

			// Basic adjustments
			photoFilter.brightness = basic.brightness / 200;
			photoFilter.contrast = basic.contrast / 100;
			photoFilter.highlights = basic.highlight / 333;
			photoFilter.shadows = basic.shadow / 333;

			// Color adjustments
			photoFilter.temperature = color.temperature / 100;
			photoFilter.tint = color.tint / 100;
			photoFilter.saturation = color.saturation / 100;
			photoFilter.vibrance = color.vibrance / 200;

			// HSL per-color adjustments
			photoFilter.setRedHSL(hsl.red.hue / 200, hsl.red.saturation / 100, hsl.red.luminance / 333);
			photoFilter.setOrangeHSL(
				hsl.orange.hue / 200,
				hsl.orange.saturation / 100,
				hsl.orange.luminance / 333
			);
			photoFilter.setYellowHSL(
				hsl.yellow.hue / 200,
				hsl.yellow.saturation / 100,
				hsl.yellow.luminance / 333
			);
			photoFilter.setGreenHSL(
				hsl.green.hue / 200,
				hsl.green.saturation / 100,
				hsl.green.luminance / 333
			);
			photoFilter.setCyanHSL(hsl.cyan.hue / 200, hsl.cyan.saturation / 100, hsl.cyan.luminance / 333);
			photoFilter.setBlueHSL(hsl.blue.hue / 200, hsl.blue.saturation / 100, hsl.blue.luminance / 333);
			photoFilter.setPurpleHSL(
				hsl.purple.hue / 200,
				hsl.purple.saturation / 100,
				hsl.purple.luminance / 333
			);
			photoFilter.setMagentaHSL(
				hsl.magenta.hue / 200,
				hsl.magenta.saturation / 100,
				hsl.magenta.luminance / 333
			);

			// Lens corrections
			photoFilter.distortion = lens_corrections.distortion / 100;
			photoFilter.chromaticAberration = lens_corrections.chromatic_aberration / 100;
			photoFilter.vignetting = lens_corrections.vignetting / 100;

			// Transform
			photoFilter.rotation = transform.rotate;
			photoFilter.vertical = transform.vertical;
			photoFilter.horizontal = transform.horizontal;
			photoFilter.perspective = transform.perspective / 100;

			sprite.filters = [photoFilter];
			app.stage.addChild(sprite);

			// Render to ensure filters are applied
			app.renderer.render(app.stage);

			// Extract pixels (RGBA format)
			const extractResult = app.renderer.extract.pixels(sprite);
			const pixels = extractResult.pixels;

			// Initialize histogram arrays
			const luminance = new Array(256).fill(0);
			const red = new Array(256).fill(0);
			const green = new Array(256).fill(0);
			const blue = new Array(256).fill(0);
			const redChannel = new Array(256).fill(0);
			const orangeChannel = new Array(256).fill(0);
			const yellowChannel = new Array(256).fill(0);
			const greenChannel = new Array(256).fill(0);
			const cyanChannel = new Array(256).fill(0);
			const blueChannel = new Array(256).fill(0);
			const purpleChannel = new Array(256).fill(0);
			const magentaChannel = new Array(256).fill(0);

			// Process pixels (RGBA format, step by 4)
			for (let i = 0; i < pixels.length; i += 4) {
				const r = pixels[i];
				const g = pixels[i + 1];
				const b = pixels[i + 2];

				// RGB channel histograms
				red[r]++;
				green[g]++;
				blue[b]++;

				// Calculate luminance using standard formula: 0.299*R + 0.587*G + 0.114*B
				const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
				const lumIndex = Math.max(0, Math.min(255, lum));
				luminance[lumIndex]++;

				// Calculate HSL and determine color channel weights
				const [hue] = rgbToHsl(r, g, b);
				const weights = getColorChannelWeight(hue);

				// Distribute pixel across color channels based on weights
				// Use luminance as the intensity value for color channel histograms
				const intensity = lumIndex;

				redChannel[intensity] += weights.red;
				orangeChannel[intensity] += weights.orange;
				yellowChannel[intensity] += weights.yellow;
				greenChannel[intensity] += weights.green;
				cyanChannel[intensity] += weights.cyan;
				blueChannel[intensity] += weights.blue;
				purpleChannel[intensity] += weights.purple;
				magentaChannel[intensity] += weights.magenta;
			}

			// Update histogram
			histogram = {
				luminance,
				red,
				green,
				blue,
				redChannel,
				orangeChannel,
				yellowChannel,
				greenChannel,
				cyanChannel,
				blueChannel,
				purpleChannel,
				magentaChannel
			};

			// Clean up
			if (texture) {
				texture.destroy(true);
			}
			if (app) {
				app.destroy(true);
			}
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		} catch (error) {
			console.error('Failed to calculate histogram:', error);
			// Clean up on error
			if (texture) {
				texture.destroy(true);
			}
			if (app) {
				app.destroy(true);
			}
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		}
	}

	/**
	 * Draw histogram on canvas
	 */
	function drawHistogram() {
		if (!canvasElement) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		const width = canvasElement.width;
		const height = canvasElement.height;

		// Clear canvas
		ctx.fillStyle = '#18181b'; // zinc-900
		ctx.fillRect(0, 0, width, height);

		const barWidth = width / 256;

		if (viewMode === 'luminance') {
			// Draw luminance histogram (exposure)
			const maxLum = Math.max(...histogram.luminance);
			if (maxLum === 0) return;

			ctx.fillStyle = '#ffffff'; // White for luminance
			ctx.globalAlpha = 0.8;

			for (let i = 0; i < 256; i++) {
				const normalizedValue = histogram.luminance[i] / maxLum;
				const barHeight = normalizedValue * height;
				ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
			}

			// Draw exposure zone indicators
			ctx.strokeStyle = '#60a5fa'; // blue-400
			ctx.globalAlpha = 0.3;
			ctx.lineWidth = 1;

			// Shadows: 0-85 (0-33%)
			ctx.beginPath();
			ctx.moveTo(85 * barWidth, 0);
			ctx.lineTo(85 * barWidth, height);
			ctx.stroke();

			// Highlights: 170-255 (67-100%)
			ctx.beginPath();
			ctx.moveTo(170 * barWidth, 0);
			ctx.lineTo(170 * barWidth, height);
			ctx.stroke();
		} else if (viewMode === 'rgb') {
			// Draw RGB channels
			const maxRed = Math.max(...histogram.red);
			const maxGreen = Math.max(...histogram.green);
			const maxBlue = Math.max(...histogram.blue);
			const maxValue = Math.max(maxRed, maxGreen, maxBlue);

			if (maxValue === 0) return;

			ctx.globalAlpha = 0.7;

			// Draw red channel
			ctx.fillStyle = '#ef4444'; // red-500
			for (let i = 0; i < 256; i++) {
				const normalizedValue = histogram.red[i] / maxRed;
				const barHeight = normalizedValue * height;
				ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
			}

			// Draw green channel
			ctx.fillStyle = '#22c55e'; // green-500
			for (let i = 0; i < 256; i++) {
				const normalizedValue = histogram.green[i] / maxGreen;
				const barHeight = normalizedValue * height;
				ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
			}

			// Draw blue channel
			ctx.fillStyle = '#3b82f6'; // blue-500
			for (let i = 0; i < 256; i++) {
				const normalizedValue = histogram.blue[i] / maxBlue;
				const barHeight = normalizedValue * height;
				ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
			}
		} else if (viewMode === 'colors') {
			// Draw 8 color channels
			const colorChannels = [
				{ data: histogram.redChannel, color: '#ef4444', name: 'Red' },
				{ data: histogram.orangeChannel, color: '#f97316', name: 'Orange' },
				{ data: histogram.yellowChannel, color: '#eab308', name: 'Yellow' },
				{ data: histogram.greenChannel, color: '#22c55e', name: 'Green' },
				{ data: histogram.cyanChannel, color: '#06b6d4', name: 'Cyan' },
				{ data: histogram.blueChannel, color: '#3b82f6', name: 'Blue' },
				{ data: histogram.purpleChannel, color: '#a855f7', name: 'Purple' },
				{ data: histogram.magentaChannel, color: '#ec4899', name: 'Magenta' }
			];

			const maxValues = colorChannels.map((ch) => Math.max(...ch.data));
			const maxValue = Math.max(...maxValues);

			if (maxValue === 0) return;

			ctx.globalAlpha = 0.6;

			for (const channel of colorChannels) {
				ctx.fillStyle = channel.color;
				for (let i = 0; i < 256; i++) {
					const normalizedValue = channel.data[i] / maxValue;
					const barHeight = normalizedValue * height;
					ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
				}
			}
		}

		ctx.globalAlpha = 1.0;
	}

	/**
	 * Update histogram when photo ID or filters change
	 */
	$effect(() => {
		if (!photoId || !canvasElement || !filters) return;

		// Debounce histogram calculation
		const timeout = setTimeout(() => {
			calculateHistogram(photoId, filters).then(() => {
				drawHistogram();
			});
		}, 300);

		return () => clearTimeout(timeout);
	});

	/**
	 * Redraw when view mode changes
	 */
	$effect(() => {
		if (canvasElement) {
			drawHistogram();
		}
	});
</script>

<div class="w-full">
	<!-- Header with Mode Selector -->
	<div class="mb-2 flex items-center justify-between">
		<span class="text-xs font-medium text-zinc-300">Histogram</span>
		<div class="flex gap-1">
			<button
				class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
				class:bg-zinc-800={viewMode === 'luminance'}
				class:text-white={viewMode === 'luminance'}
				class:text-zinc-500={viewMode !== 'luminance'}
				onclick={() => (viewMode = 'luminance')}
				title="Exposure/Luminance"
			>
				L
			</button>
			<button
				class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
				class:bg-zinc-800={viewMode === 'rgb'}
				class:text-white={viewMode === 'rgb'}
				class:text-zinc-500={viewMode !== 'rgb'}
				onclick={() => (viewMode = 'rgb')}
				title="RGB Channels"
			>
				RGB
			</button>
			<button
				class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
				class:bg-zinc-800={viewMode === 'colors'}
				class:text-white={viewMode === 'colors'}
				class:text-zinc-500={viewMode !== 'colors'}
				onclick={() => (viewMode = 'colors')}
				title="Color Channels"
			>
				8C
			</button>
		</div>
	</div>

	<!-- Legend based on view mode -->
	{#if viewMode === 'rgb'}
		<div class="mb-1 flex justify-end gap-2 text-[10px]">
			<span class="flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
				<span class="text-zinc-500">R</span>
			</span>
			<span class="flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
				<span class="text-zinc-500">G</span>
			</span>
			<span class="flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
				<span class="text-zinc-500">B</span>
			</span>
		</div>
	{:else if viewMode === 'colors'}
		<div class="mb-1 flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-[9px]">
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-red-500"></span>
				<span class="text-zinc-500">R</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-orange-500"></span>
				<span class="text-zinc-500">O</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-yellow-500"></span>
				<span class="text-zinc-500">Y</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-green-500"></span>
				<span class="text-zinc-500">G</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-cyan-500"></span>
				<span class="text-zinc-500">C</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-blue-500"></span>
				<span class="text-zinc-500">B</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-purple-500"></span>
				<span class="text-zinc-500">P</span>
			</span>
			<span class="flex items-center gap-0.5">
				<span class="h-1 w-1 rounded-full bg-pink-500"></span>
				<span class="text-zinc-500">M</span>
			</span>
		</div>
	{/if}

	<!-- Canvas -->
	<canvas
		bind:this={canvasElement}
		width="256"
		height="100"
		class="w-full rounded-lg border border-zinc-800 bg-zinc-900"
	></canvas>

	<!-- View Mode Labels -->
	{#if viewMode === 'luminance'}
		<div class="mt-1 flex justify-between text-[9px] text-zinc-600">
			<span>Shadows</span>
			<span>Midtones</span>
			<span>Highlights</span>
		</div>
	{/if}
</div>
