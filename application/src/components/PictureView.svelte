<script lang="ts">
	import * as PIXI from 'pixi.js';

	let { image = null, filters } = $props();

	let canvasContainer = $state<HTMLDivElement>();
	let app: PIXI.Application | null = null;
	let originalSprite: PIXI.Sprite | null = null;
	let filteredSprite: PIXI.Sprite | null = null;
	let colorFilter: PIXI.ColorMatrixFilter | null = null;
	let maskGraphics: PIXI.Graphics | null = null;

	let splitPosition = $state(0.5);
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

				// Create color filter
				colorFilter = new PIXI.ColorMatrixFilter();
				filteredSprite.filters = [colorFilter];

				// Create mask for filtered sprite
				maskGraphics = new PIXI.Graphics();

				filteredSprite.mask = maskGraphics;
				app.stage.addChild(maskGraphics);
				app.stage.addChild(filteredSprite);

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
			colorFilter = null;
			maskGraphics = null;
		};
	});

	// Update filters when values change
	$effect(() => {
		if (!isInitialized || !colorFilter) return;

		// Access filter values to ensure reactivity tracking
		// Values range from -100 to 100, where 0 is neutral
		const brightness = filters.basic.brightness;
		const contrast = filters.basic.contrast;
		const saturation = filters.color.saturation;

		colorFilter.reset();

		colorFilter.brightness((brightness + 100) / 100, true);
		// colorFilter.contrast((contrast / 100) + 1, true);
		// colorFilter.saturate(((saturation) / 100) + 1, true);
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

<div
	class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 px-2 py-20"
>
	{#if image}
		<button
			class="absolute top-4 left-4 z-10 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-zinc-800 active:scale-95"
			onclick={toggleSplit}
		>
			{splitPosition === 0 ? 'Show Filtered' : 'Show Original'}
		</button>

		<div
			class="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-zinc-900/80 px-6 py-3 backdrop-blur-md"
		>
			<input type="range" min="0" max="1" step="0.01" bind:value={splitPosition} class="w-48" />
		</div>

		<div bind:this={canvasContainer} class="h-full w-full"></div>
	{:else}
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
			<p class="text-sm font-medium tracking-wide">Select an photo to start editing</p>
		</div>
	{/if}
</div>
