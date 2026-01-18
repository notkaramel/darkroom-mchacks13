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
	let histogram = $state<{ red: number[]; green: number[]; blue: number[] }>({
		red: new Array(256).fill(0),
		green: new Array(256).fill(0),
		blue: new Array(256).fill(0)
	});

	/**
	 * Calculate histogram from filtered image
	 */
	async function calculateHistogram(photoId: string, filterSettings: FilterSettings) {
		try {
			// Fetch image from API
			const apiUrl = `/api/photo/${photoId}/file`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.statusText}`);
			}

			const blob = await response.blob();
			const imageUrl = URL.createObjectURL(blob);

			// Create temporary PIXI app
			const app = new PIXI.Application();
			await app.init({ width: 800, height: 600, backgroundAlpha: 0 });

			// Load texture
			const texture = await PIXI.Assets.load(imageUrl);
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

			// Render
			app.renderer.render(app.stage);

			// Extract pixels
			const extractResult = app.renderer.extract.pixels(sprite);
			const pixels = extractResult.pixels;

			// Reset histogram arrays
			const red = new Array(256).fill(0);
			const green = new Array(256).fill(0);
			const blue = new Array(256).fill(0);

			// Count pixel values (RGBA format, step by 4)
			for (let i = 0; i < pixels.length; i += 4) {
				red[pixels[i]]++;
				green[pixels[i + 1]]++;
				blue[pixels[i + 2]]++;
			}

			// Update histogram
			histogram = { red, green, blue };

			// Clean up
			texture.destroy(true);
			app.destroy(true);
			URL.revokeObjectURL(imageUrl);
		} catch (error) {
			console.error('Failed to calculate histogram:', error);
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

		// Find the maximum value across all channels
		const maxRed = Math.max(...histogram.red);
		const maxGreen = Math.max(...histogram.green);
		const maxBlue = Math.max(...histogram.blue);
		const maxValue = Math.max(maxRed, maxGreen, maxBlue);

		if (maxValue === 0) return;

		// Draw RGB histograms with transparency for overlay effect
		const barWidth = width / 256;

		// Helper function for logarithmic scaling
		const logScale = (value: number, max: number) => {
			if (value === 0) return 0;
			// Use log scale to make small values more visible
			return Math.log(value + 1) / Math.log(max + 1);
		};

		// Draw red channel
		ctx.globalAlpha = 0.6;
		ctx.fillStyle = '#ef4444'; // red-500
		for (let i = 0; i < 256; i++) {
			const barHeight = logScale(histogram.red[i], maxRed) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
		}

		// Draw green channel
		ctx.fillStyle = '#22c55e'; // green-500
		for (let i = 0; i < 256; i++) {
			const barHeight = logScale(histogram.green[i], maxGreen) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
		}

		// Draw blue channel
		ctx.fillStyle = '#3b82f6'; // blue-500
		for (let i = 0; i < 256; i++) {
			const barHeight = logScale(histogram.blue[i], maxBlue) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
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
</script>

<div class="w-full">
	<div class="mb-2 flex justify-between text-xs font-medium">
		<span class="text-zinc-300">Histogram</span>
		<div class="flex gap-2">
			<span class="flex items-center gap-1">
				<span class="h-2 w-2 rounded-full bg-red-500"></span>
				<span class="text-zinc-500">R</span>
			</span>
			<span class="flex items-center gap-1">
				<span class="h-2 w-2 rounded-full bg-green-500"></span>
				<span class="text-zinc-500">G</span>
			</span>
			<span class="flex items-center gap-1">
				<span class="h-2 w-2 rounded-full bg-blue-500"></span>
				<span class="text-zinc-500">B</span>
			</span>
		</div>
	</div>
	<canvas
		bind:this={canvasElement}
		width="256"
		height="100"
		class="w-full rounded-lg border border-zinc-800 bg-zinc-900"
	></canvas>
</div>
