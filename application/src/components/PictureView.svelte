<script lang="ts">
  import * as PIXI from 'pixi.js';
  import { onMount } from 'svelte';

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

<div class="container">
  <div bind:this={canvasContainer} class="canvas-container"></div>
  
  <div class="controls">
    <div class="control-group">
      <label for="brightness">
        Brightness: <span class="value">{brightness.toFixed(2)}</span>
      </label>
      <input
        id="brightness"
        type="range"
        min="0"
        max="2"
        step="0.01"
        bind:value={brightness}
      />
    </div>

    <div class="control-group">
      <label for="contrast">
        Contrast: <span class="value">{contrast.toFixed(2)}</span>
      </label>
      <input
        id="contrast"
        type="range"
        min="0"
        max="2"
        step="0.01"
        bind:value={contrast}
      />
    </div>

    <div class="control-group">
      <label for="hue">
        Hue: <span class="value">{Math.round(hue)}°</span>
      </label>
      <input
        id="hue"
        type="range"
        min="0"
        max="360"
        step="1"
        bind:value={hue}
      />
    </div>

    <button
      class="reset-btn"
      onclick={() => {
        brightness = 1;
        contrast = 1;
        hue = 0;
      }}
    >
      Reset
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .canvas-container {
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .controls {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    min-width: 400px;
    backdrop-filter: blur(10px);
  }

  .control-group {
    margin-bottom: 25px;
  }

  .control-group:last-of-type {
    margin-bottom: 20px;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: linear-gradient(to right, #e0e0e0 0%, #e0e0e0 100%);
    outline: none;
    -webkit-appearance: none;
    transition: background 0.3s;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .reset-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .reset-btn:active {
    transform: translateY(0);
  }
</style>