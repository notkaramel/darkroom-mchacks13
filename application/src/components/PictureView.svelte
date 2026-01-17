<script lang="ts">
    // Props: 'image' is the data URL, 'filters' contains adjustment values
    let { image = null, filters } = $props();
    import * as PIXI from 'pixi.js';
    import { onMount } from 'svelte';

    // Derived rune to construct the CSS filter string dynamically based on filter values
    let filterString = $derived(`
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
    `);
   

  let canvasContainer: HTMLDivElement;
  let brightness = $state(1);
  let contrast = $state(1);
  let hue = $state(0);

  let sprite: PIXI.Sprite | null = null;
  let colorFilter = $state<PIXI.ColorMatrixFilter | null>(null);

  onMount(() => {
    let app: PIXI.Application;
    
    (async () => {
      app = new PIXI.Application();
      
      await app.init({
        width: 1080,
        height: 1080,
        backgroundColor: 0x2c3e50,
      });
      
      if (canvasContainer) {
        canvasContainer.appendChild(app.canvas);
      }
      
      const texture = await PIXI.Assets.load('/placeholder.png');
      sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;

      // Create single filter
      colorFilter = new PIXI.ColorMatrixFilter();
      sprite.filters = [colorFilter];

      app.stage.addChild(sprite);
    })();
    
    return () => {
      if (app) {
        app.destroy(true);
      }
    };
  });

  // Update all filters together when any value changes
  $effect(() => {
    if (colorFilter) {
      // Reset to identity matrix first
      colorFilter.reset();
      console.log(brightness, contrast, hue);
      
      // Apply transformations in order (multiply is true to chain them)
      colorFilter.brightness(brightness, true);
      colorFilter.contrast(contrast, true);
      colorFilter.hue(hue, true); // hue expects degrees, multiply chains the transformation
    }
  });
</script>

<div class="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950">
    {#if image}
        <!-- Selected Image with real-time CSS filters applied -->
        <img 
            src={image} 
            alt="Editing Preview" 
            class="max-h-[90%] max-w-[90%] object-contain shadow-2xl transition-all duration-200"
            style:filter={filterString}
        />
    {:else}
        <!-- Placeholder State when no image is selected -->
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