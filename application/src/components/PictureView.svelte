<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { PhotoEditFilter } from '$lib/PhotoEditFilter';

	let { image = null, filters, filteredSprite = $bindable(), pixiRenderer = $bindable(), pixiApp = $bindable() } = $props();

	let canvasContainer = $state<HTMLDivElement>();
	
	let app: PIXI.Application | null = null;
	let originalSprite: PIXI.Sprite | null = null;

	let photoEditFilter: PhotoEditFilter | null = null;
	let maskGraphics: PIXI.Graphics | null = null;

	let splitPosition = $state(0);
	let isInitialized = $state(false);

	$effect(() => {
		if (!image || !canvasContainer) return;

		let mounted = true;

		(async () => {
			try {
				app = new PIXI.Application();

				await app.init({
					width: canvasContainer.clientWidth,
					height: canvasContainer.clientHeight,
					backgroundAlpha: 0,
					resizeTo: canvasContainer
				});

				if (!mounted) {
					app.destroy(true);
					return;
				}

				canvasContainer.appendChild(app.canvas);

				const texture = await PIXI.Assets.load(image);

				if (!mounted) {
					app.destroy(true);
					return;
				}

				const scale = Math.min(
					app.screen.width / texture.width,
					app.screen.height / texture.height
				);

				const centerX = app.screen.width / 2;
				const centerY = app.screen.height / 2;

				// Original sprite (left side - unfiltered)
				originalSprite = new PIXI.Sprite(texture);
				originalSprite.anchor.set(0.5);
				originalSprite.scale.set(scale);
				originalSprite.x = centerX;
				originalSprite.y = centerY;
				app.stage.addChild(originalSprite);

				// Filtered sprite (right side - filtered)
				filteredSprite = new PIXI.Sprite(texture);
				filteredSprite.anchor.set(0.5);
				filteredSprite.scale.set(scale);
				filteredSprite.x = centerX;
				filteredSprite.y = centerY;

				// Create custom photo edit filter
				photoEditFilter = new PhotoEditFilter();
				filteredSprite.filters = [photoEditFilter];

				// Create mask for filtered sprite
				maskGraphics = new PIXI.Graphics();
				filteredSprite.mask = maskGraphics;
				app.stage.addChild(maskGraphics);
				app.stage.addChild(filteredSprite);

				// Expose renderer and app for histogram
				pixiRenderer = app.renderer;
				pixiApp = app;

				isInitialized = true;
				updateMask();
			} catch (error) {
				console.error('Error initializing Pixi:', error);
			}
		})();

		return () => {
			mounted = false;
			isInitialized = false;

			if (app) {
				app.destroy(true);
				app = null;
			}

			originalSprite = null;
			filteredSprite = null;
			photoEditFilter = null;
			maskGraphics = null;
		};
	});

	// Handle canvas resize when sidebars collapse/expand
	$effect(() => {
		if (!canvasContainer) return;
		if (!app) return;

		const resizeObserver = new ResizeObserver(() => {
			if (!app || !canvasContainer) return;

			try {
				const containerWidth = canvasContainer.clientWidth;
				const containerHeight = canvasContainer.clientHeight;
				
				const canvas = app.canvas;
				if (!canvas) return;
				
				// Calculate scale to fit container
				const scaleX = containerWidth / canvas.width;
				const scaleY = containerHeight / canvas.height;
				const scale = Math.min(scaleX, scaleY);

				// Apply CSS transform for smooth scaling
				canvas.style.transform = `scale(${scale})`;
				canvas.style.transformOrigin = 'center center';
				canvas.style.transition = 'transform 300ms ease-in-out';
			} catch (error) {
				// Silently ignore if app or canvas is no longer available
			}
		});

		resizeObserver.observe(canvasContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Update filters when values change
	$effect(() => {
		if (!isInitialized || !photoEditFilter) return;

		const { basic, color, hsl } = filters;

		// Map slider values (-100 to +100) to appropriate ranges
		// Brightness: -100 to +100 -> -0.5 to +0.5 (additive)
		photoEditFilter.brightness = basic.brightness / 200;

		// Contrast: -100 to +100 -> -1 to +1
		photoEditFilter.contrast = basic.contrast / 100;

		// Highlights: -100 to +100 -> -0.3 to +0.3
		photoEditFilter.highlights = basic.highlight / 333;

		// Shadows: -100 to +100 -> -0.3 to +0.3
		photoEditFilter.shadows = basic.shadow / 333;

		// Temperature: -100 to +100 -> -1 to +1
		photoEditFilter.temperature = color.temperature / 100;

		// Tint: -100 to +100 -> -1 to +1
		photoEditFilter.tint = color.tint / 100;

		// Saturation: -100 to +100 -> -1 to +1 (0 is neutral)
		photoEditFilter.saturation = color.saturation / 100;

		// Vibrance: -100 to +100 -> -0.5 to +0.5 (more subtle than saturation)
		photoEditFilter.vibrance = color.vibrance / 200;

		// HSL Per-Color Adjustments
		// Hue: -100 to +100 -> -0.5 to +0.5 (in HSL space 0-1)
		// Saturation: -100 to +100 -> -1 to +1
		// Luminance: -100 to +100 -> -0.3 to +0.3
		photoEditFilter.setRedHSL(hsl.red.hue / 200, hsl.red.saturation / 100, hsl.red.luminance / 333);
		photoEditFilter.setOrangeHSL(hsl.orange.hue / 200, hsl.orange.saturation / 100, hsl.orange.luminance / 333);
		photoEditFilter.setYellowHSL(hsl.yellow.hue / 200, hsl.yellow.saturation / 100, hsl.yellow.luminance / 333);
		photoEditFilter.setGreenHSL(hsl.green.hue / 200, hsl.green.saturation / 100, hsl.green.luminance / 333);
		photoEditFilter.setCyanHSL(hsl.cyan.hue / 200, hsl.cyan.saturation / 100, hsl.cyan.luminance / 333);
		photoEditFilter.setBlueHSL(hsl.blue.hue / 200, hsl.blue.saturation / 100, hsl.blue.luminance / 333);
		photoEditFilter.setPurpleHSL(hsl.purple.hue / 200, hsl.purple.saturation / 100, hsl.purple.luminance / 333);
		photoEditFilter.setMagentaHSL(hsl.magenta.hue / 200, hsl.magenta.saturation / 100, hsl.magenta.luminance / 333);

		// Lens Corrections: -100 to +100 -> -1 to +1
		photoEditFilter.distortion = filters.lens_corrections.distortion / 100;
		photoEditFilter.chromaticAberration = filters.lens_corrections.chromatic_aberration / 100;
		photoEditFilter.vignetting = filters.lens_corrections.vignetting / 100;

		// Transform
		photoEditFilter.rotation = filters.transform.rotate; // Direct degrees
		photoEditFilter.vertical = filters.transform.vertical; // -100 to +100
		photoEditFilter.horizontal = filters.transform.horizontal; // -100 to +100
		photoEditFilter.perspective = filters.transform.perspective / 100; // -100 to +100 -> -1 to +1
	});

	// Update mask when split position changes
	$effect(() => {
		if (!isInitialized) return;
		updateMask();
	});

	function updateMask() {
		if (!app || !maskGraphics || !isInitialized) return;

		maskGraphics.clear();

		const splitX = app.screen.width * splitPosition;

		maskGraphics.rect(splitX, 0, app.screen.width - splitX, app.screen.height);
		maskGraphics.fill(0xffffff);
	}

	const toggleSplit = () => {
		splitPosition = splitPosition === 0 ? 1 : 0;
	};
</script>

<div class="relative flex flex-col h-full w-full items-center justify-center overflow-hidden bg-zinc-950 py-20 px-2">
    {#if image}
        <button
            class="absolute top-4 left-4 z-10 rounded-full bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-zinc-800 active:scale-95 border border-white/10"
            onclick={toggleSplit}
        >
            {splitPosition === 0 ? 'Filtered' : 'Original'}
        </button>
        
        <div class="absolute flex items-center justify-center bottom-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/80 backdrop-blur-md rounded-full p-6 border border-white/10">
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={splitPosition}
                class="w-48 slider cursor-pointer "
            />
        </div>
        
        <div bind:this={canvasContainer} class="flex w-full h-full items-center justify-center"></div>
    {:else}
        <div class="flex flex-col items-center gap-4 text-zinc-600">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <p class="font-medium text-sm tracking-wide">Select an photo to start editing</p>
        </div>
    {/if}
</div>

<style>
    .slider::-webkit-slider-runnable-track {
        background: rgb(39 39 42); /* zinc-800 */
    }

    /* Ensure canvas resizes smoothly */
    :global(canvas) {
        transition: none !important;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
</style>