<script lang="ts">
	import * as PIXI from 'pixi.js';

	let { imageData = null }: { imageData: PIXI.Sprite | null } = $props();

	let canvasElement: HTMLCanvasElement;
	let lastProcessedSprite: PIXI.Sprite | null = null;
	let histogram = $state<{ red: number[]; green: number[]; blue: number[] }>({
		red: new Array(256).fill(0),
		green: new Array(256).fill(0),
		blue: new Array(256).fill(0)
	});

	// Calculate histogram from PixiJS Sprite
	function calculateHistogram(sprite: PIXI.Sprite) {
		try {
			// Get texture from sprite
			const texture = sprite.texture;
			
			// Extract pixel data from texture
			const pixels = texture.source.resource as HTMLImageElement | HTMLCanvasElement;
			
			// Create temporary canvas to read pixel data
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = texture.width;
			tempCanvas.height = texture.height;
			const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
			
			if (!ctx) return;
			
			// Draw texture to temp canvas
			ctx.drawImage(pixels, 0, 0);
			
			// Get pixel data
			const imgData = ctx.getImageData(0, 0, texture.width, texture.height);
			const pixelData = imgData.data;
			
			// Reset histogram arrays
			const red = new Array(256).fill(0);
			const green = new Array(256).fill(0);
			const blue = new Array(256).fill(0);

			// Count pixel values (RGBA format, so step by 4)
			for (let i = 0; i < pixelData.length; i += 4) {
				red[pixelData[i]]++;
				green[pixelData[i + 1]]++;
				blue[pixelData[i + 2]]++;
			}

			// Update histogram
			histogram = { red, green, blue };
			lastProcessedSprite = sprite;
		} catch (error) {
			console.error('Failed to calculate histogram:', error);
		}
	}

	// Draw histogram on canvas
	function drawHistogram() {
		if (!canvasElement) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		const width = canvasElement.width;
		const height = canvasElement.height;

		// Clear canvas
		ctx.fillStyle = '#18181b'; // zinc-900
		ctx.fillRect(0, 0, width, height);

		// Find max value for scaling
		const maxRed = Math.max(...histogram.red);
		const maxGreen = Math.max(...histogram.green);
		const maxBlue = Math.max(...histogram.blue);
		const maxValue = Math.max(maxRed, maxGreen, maxBlue);

		if (maxValue === 0) return;

		// Draw histograms with transparency for overlay effect
		const barWidth = width / 256;

		// Draw red channel
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#ef4444'; // red-500
		for (let i = 0; i < 256; i++) {
			const barHeight = (histogram.red[i] / maxRed) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
		}

		// Draw green channel
		ctx.fillStyle = '#22c55e'; // green-500
		for (let i = 0; i < 256; i++) {
			const barHeight = (histogram.green[i] / maxGreen) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
		}

		// Draw blue channel
		ctx.fillStyle = '#3b82f6'; // blue-500
		for (let i = 0; i < 256; i++) {
			const barHeight = (histogram.blue[i] / maxBlue) * height;
			ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
		}

		ctx.globalAlpha = 1.0;
	}

	// Update histogram when imageData changes (but only if it's different)
	$effect(() => {
		if (imageData && canvasElement) {
			calculateHistogram(imageData);
		}
	});

	// Draw histogram when histogram data changes
	$effect(() => {
		if (histogram && canvasElement) {
			drawHistogram();
		}
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