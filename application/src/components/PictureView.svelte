<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { PhotoEditFilter } from '$lib/PhotoEditFilter';
	import type { FilterSettings } from '$lib/storage';

	// Props
	let {
		photoId = null,
		filters,
		filteredSprite = $bindable(),
		pixiRenderer = $bindable(),
		pixiApp = $bindable()
	}: {
		photoId: string | null;
		filters: FilterSettings;
		filteredSprite?: PIXI.Sprite | null;
		pixiRenderer?: PIXI.Renderer | null;
		pixiApp?: PIXI.Application | null;
	} = $props();

	// State: Canvas container reference
	let canvasContainer = $state<HTMLDivElement>();
	
	// State: Canvas element to append
	let canvasToAppend = $state<HTMLCanvasElement | null>(null);
	
	// Action to append canvas to container
	function appendCanvas(node: HTMLDivElement, canvas: HTMLCanvasElement | null) {
		if (canvas && !node.contains(canvas)) {
			node.appendChild(canvas);
		}
		return {
			update(canvas: HTMLCanvasElement | null) {
				if (canvas && !node.contains(canvas)) {
					node.appendChild(canvas);
				}
			}
		};
	}

	// State: PIXI.js objects
	let app: PIXI.Application | null = null;
	let originalSprite: PIXI.Sprite | null = null;
	let loadedTexture: PIXI.Texture | null = null;
	let photoEditFilter: PhotoEditFilter | null = null;
	let maskGraphics: PIXI.Graphics | null = null;

	// State: Split view position (0 = show original, 1 = show filtered)
	let splitPosition = $state(0);
	let isInitialized = $state(false);

	// State: Zoom level (1.0 = 100%, starts at fit-to-container scale)
	let currentZoom = $state(1);
	let baseScale = $state(1); // The initial scale to fit container
	const MIN_ZOOM = 0.1;
	const MAX_ZOOM = 10;
	const ZOOM_SENSITIVITY = 0.1; // How fast zoom changes with scroll

	// State: Pan offset (translation from center)
	let panX = $state(0);
	let panY = $state(0);
	let centerX = $state(0);
	let centerY = $state(0);

	// State: Dragging state
	let isDragging = $state(false);
	let lastMouseX = 0;
	let lastMouseY = 0;

	/**
	 * Initialize PIXI.js application and load photo
	 */
	$effect(() => {
		if (!photoId || !canvasContainer) {
			// Clean up if no photo selected
			cleanup();
			return;
		}

		let mounted = true;
		let imageUrl: string | null = null;

		(async () => {
			try {
				// Create PIXI application
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

				// Set canvas to append (will be handled by effect)
				if (app.canvas) {
					canvasToAppend = app.canvas;
				}

				// Fetch image from API
				const apiUrl = `/api/photo/${photoId}/file`;
				const response = await fetch(apiUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch image: ${response.statusText}`);
				}

				const blob = await response.blob();
				imageUrl = URL.createObjectURL(blob);

				if (!mounted) {
					URL.revokeObjectURL(imageUrl);
					app.destroy(true);
					return;
				}

				// Load image
				const img = new Image();
				img.crossOrigin = 'anonymous';

				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('Failed to load image'));
					img.src = imageUrl!;
				});

				if (!mounted) {
					URL.revokeObjectURL(imageUrl);
					app.destroy(true);
					return;
				}

				// Create texture from image
				loadedTexture = PIXI.Texture.from(img);

				if (!mounted || !loadedTexture) {
					if (loadedTexture) {
						loadedTexture.destroy(true);
						loadedTexture = null;
					}
					URL.revokeObjectURL(imageUrl);
					app.destroy(true);
					return;
				}

				// Calculate scale to fit container (base scale)
				baseScale = Math.min(
					app.screen.width / loadedTexture.width,
					app.screen.height / loadedTexture.height
				);

				// Store center positions
				centerX = app.screen.width / 2;
				centerY = app.screen.height / 2;

				// Reset pan offset when new image loads
				panX = 0;
				panY = 0;

				// Create original sprite (left side - unfiltered)
				originalSprite = new PIXI.Sprite(loadedTexture);
				originalSprite.anchor.set(0.5);
				originalSprite.scale.set(baseScale * currentZoom);
				originalSprite.x = centerX + panX;
				originalSprite.y = centerY + panY;
				app.stage.addChild(originalSprite);

				// Create filtered sprite (right side - filtered)
				filteredSprite = new PIXI.Sprite(loadedTexture);
				filteredSprite.anchor.set(0.5);
				filteredSprite.scale.set(baseScale * currentZoom);
				filteredSprite.x = centerX + panX;
				filteredSprite.y = centerY + panY;

				// Create and apply photo edit filter
				photoEditFilter = new PhotoEditFilter();
				filteredSprite.filters = [photoEditFilter];

				// Create mask for split view
				maskGraphics = new PIXI.Graphics();
				filteredSprite.mask = maskGraphics;
				app.stage.addChild(maskGraphics);
				app.stage.addChild(filteredSprite);

				// Expose renderer and app for histogram
				pixiRenderer = app.renderer;
				pixiApp = app;

				isInitialized = true;
				updateMask();
			} catch (err) {
				console.error('Error initializing PIXI:', err);
				if (imageUrl) {
					URL.revokeObjectURL(imageUrl);
				}
			}
		})();

		return () => {
			mounted = false;
			isInitialized = false;
			cleanup();
		};
	});

	/**
	 * Clean up PIXI.js resources
	 */
	function cleanup() {
		if (loadedTexture) {
			loadedTexture.destroy(true);
			loadedTexture = null;
		}

		if (app) {
			app.destroy(true);
			app = null;
		}

		originalSprite = null;
		filteredSprite = null;
		photoEditFilter = null;
		maskGraphics = null;
		pixiRenderer = null;
		pixiApp = null;
	}


	/**
	 * Handle canvas resize when sidebars collapse/expand
	 */
	$effect(() => {
		if (!canvasContainer || !app) return;

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
			} catch {
				// Silently ignore if app or canvas is no longer available
			}
		});

		resizeObserver.observe(canvasContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});

	/**
	 * Update filters when values change
	 */
	$effect(() => {
		if (!isInitialized || !photoEditFilter) return;

		const { basic, color, hsl, lens_corrections, transform } = filters;

		// Basic adjustments
		photoEditFilter.brightness = basic.brightness / 200;
		photoEditFilter.contrast = basic.contrast / 100;
		photoEditFilter.highlights = basic.highlight / 333;
		photoEditFilter.shadows = basic.shadow / 333;

		// Color adjustments
		photoEditFilter.temperature = color.temperature / 100;
		photoEditFilter.tint = color.tint / 100;
		photoEditFilter.saturation = color.saturation / 100;
		photoEditFilter.vibrance = color.vibrance / 200;

		// HSL per-color adjustments
		photoEditFilter.setRedHSL(hsl.red.hue / 200, hsl.red.saturation / 100, hsl.red.luminance / 333);
		photoEditFilter.setOrangeHSL(
			hsl.orange.hue / 200,
			hsl.orange.saturation / 100,
			hsl.orange.luminance / 333
		);
		photoEditFilter.setYellowHSL(
			hsl.yellow.hue / 200,
			hsl.yellow.saturation / 100,
			hsl.yellow.luminance / 333
		);
		photoEditFilter.setGreenHSL(
			hsl.green.hue / 200,
			hsl.green.saturation / 100,
			hsl.green.luminance / 333
		);
		photoEditFilter.setCyanHSL(hsl.cyan.hue / 200, hsl.cyan.saturation / 100, hsl.cyan.luminance / 333);
		photoEditFilter.setBlueHSL(hsl.blue.hue / 200, hsl.blue.saturation / 100, hsl.blue.luminance / 333);
		photoEditFilter.setPurpleHSL(
			hsl.purple.hue / 200,
			hsl.purple.saturation / 100,
			hsl.purple.luminance / 333
		);
		photoEditFilter.setMagentaHSL(
			hsl.magenta.hue / 200,
			hsl.magenta.saturation / 100,
			hsl.magenta.luminance / 333
		);

		// Lens corrections
		photoEditFilter.distortion = lens_corrections.distortion / 100;
		photoEditFilter.chromaticAberration = lens_corrections.chromatic_aberration / 100;
		photoEditFilter.vignetting = lens_corrections.vignetting / 100;

		// Transform
		photoEditFilter.rotation = transform.rotate;
		photoEditFilter.vertical = transform.vertical;
		photoEditFilter.horizontal = transform.horizontal;
		photoEditFilter.perspective = transform.perspective / 100;
	});

	/**
	 * Update mask when split position changes
	 */
	$effect(() => {
		if (!isInitialized) return;
		updateMask();
	});

	/**
	 * Update the mask graphics for split view
	 */
	function updateMask() {
		if (!app || !maskGraphics || !isInitialized) return;

		maskGraphics.clear();
		const splitX = app.screen.width * splitPosition;
		maskGraphics.rect(splitX, 0, app.screen.width - splitX, app.screen.height);
		maskGraphics.fill(0xffffff);
	}

	/**
	 * Toggle split view between original and filtered
	 */
	function toggleSplit() {
		splitPosition = splitPosition === 0 ? 1 : 0;
	}

	/**
	 * Handle wheel event for zooming
	 */
	function handleWheel(e: WheelEvent) {
		if (!isInitialized || !originalSprite || !filteredSprite) return;

		// Prevent default scrolling
		e.preventDefault();

		// Calculate zoom delta based on wheel direction
		const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY * 0.01;
		const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomDelta));

		// Only update if zoom actually changed
		if (newZoom !== currentZoom) {
			currentZoom = newZoom;

			// Update sprite scales
			const newScale = baseScale * currentZoom;
			if (originalSprite) {
				originalSprite.scale.set(newScale);
			}
			if (filteredSprite) {
				filteredSprite.scale.set(newScale);
			}
		}
	}

	/**
	 * Update sprite positions based on pan offset
	 */
	function updateSpritePositions() {
		if (!originalSprite || !filteredSprite) return;

		originalSprite.x = centerX + panX;
		originalSprite.y = centerY + panY;
		filteredSprite.x = centerX + panX;
		filteredSprite.y = centerY + panY;
	}

	/**
	 * Reset zoom and pan to fit container
	 */
	function resetZoom() {
		if (!isInitialized) return;
		currentZoom = 1;
		panX = 0;
		panY = 0;

		if (originalSprite && filteredSprite) {
			const newScale = baseScale * currentZoom;
			originalSprite.scale.set(newScale);
			filteredSprite.scale.set(newScale);
			updateSpritePositions();
		}
	}

	/**
	 * Handle mouse down to start dragging
	 */
	function handleMouseDown(e: MouseEvent) {
		if (!isInitialized) return;
		isDragging = true;
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
		e.preventDefault();
	}

	/**
	 * Handle mouse move to drag the photo
	 */
	function handleMouseMove(e: MouseEvent) {
		if (!isInitialized || !isDragging) return;

		const deltaX = e.clientX - lastMouseX;
		const deltaY = e.clientY - lastMouseY;

		panX += deltaX;
		panY += deltaY;

		updateSpritePositions();

		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
	}

	/**
	 * Handle mouse up to stop dragging
	 */
	function handleMouseUp() {
		isDragging = false;
	}

	/**
	 * Handle touch start for mobile
	 */
	function handleTouchStart(e: TouchEvent) {
		if (!isInitialized || e.touches.length !== 1) return;
		isDragging = true;
		const touch = e.touches[0];
		lastMouseX = touch.clientX;
		lastMouseY = touch.clientY;
		e.preventDefault();
	}

	/**
	 * Handle touch move for mobile
	 */
	function handleTouchMove(e: TouchEvent) {
		if (!isInitialized || !isDragging || e.touches.length !== 1) return;

		const touch = e.touches[0];
		const deltaX = touch.clientX - lastMouseX;
		const deltaY = touch.clientY - lastMouseY;

		panX += deltaX;
		panY += deltaY;

		updateSpritePositions();

		lastMouseX = touch.clientX;
		lastMouseY = touch.clientY;
		e.preventDefault();
	}

	/**
	 * Handle touch end for mobile
	 */
	function handleTouchEnd() {
		isDragging = false;
	}

	/**
	 * Handle wheel events on the canvas container
	 */
	$effect(() => {
		if (!canvasContainer || !isInitialized) return;

		const container = canvasContainer;
		container.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	});

	/**
	 * Handle mouse/touch events for panning
	 */
	$effect(() => {
		if (!canvasContainer || !isInitialized) return;

		const container = canvasContainer;

		// Mouse events
		container.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		// Touch events
		container.addEventListener('touchstart', handleTouchStart, { passive: false });
		container.addEventListener('touchmove', handleTouchMove, { passive: false });
		container.addEventListener('touchend', handleTouchEnd);

		return () => {
			container.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchmove', handleTouchMove);
			container.removeEventListener('touchend', handleTouchEnd);
		};
	});
</script>

<div
	class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 px-2 py-20"
>
	{#if photoId}
		<!-- Split View Toggle Button -->
		<button
			class="absolute top-4 left-4 z-10 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-zinc-800 active:scale-95"
			onclick={toggleSplit}
		>
			{splitPosition === 0 ? 'Filtered' : 'Original'}
		</button>

		<!-- Zoom Controls -->
		<div class="absolute top-4 right-4 z-10 flex items-center gap-2">
			<button
				class="rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-zinc-800 active:scale-95"
				onclick={resetZoom}
				title="Reset zoom (scroll to zoom)"
			>
				{(currentZoom * 100).toFixed(0)}%
			</button>
		</div>

		<!-- Split Position Slider -->
		<div
			class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-md"
		>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={splitPosition}
				class="slider w-48 cursor-pointer"
			/>
		</div>

		<!-- Canvas Container -->
		<div
			bind:this={canvasContainer}
			use:appendCanvas={canvasToAppend}
			class="flex h-full w-full items-center justify-center"
			class:cursor-grab={!isDragging}
			class:cursor-grabbing={isDragging}
		></div>
	{:else}
		<!-- Empty State -->
		<div class="flex flex-col items-center gap-4 text-zinc-600">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 opacity-50"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<p class="text-sm font-medium tracking-wide">Select a photo to start editing</p>
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
