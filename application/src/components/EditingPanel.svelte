<script lang="ts">
    // Bindable prop to allow two-way state update with the parent
    let { filters = $bindable() } = $props();

    // Function to reset all filters to their default neutral values
    function reset() {
        filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
            hueRotate: 0
        };
    }
</script>

<div class="flex h-full flex-col overflow-y-auto bg-zinc-900/50 p-6 backdrop-blur-xl">
    <!-- Header with Reset Button -->
    <div class="mb-8 flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-widest text-zinc-500">Adjustments</h2>
        <button 
            onclick={reset}
            class="text-xs font-medium text-zinc-500 transition-colors hover:text-white"
        >
            Reset All
        </button>
    </div>

    <!-- Sliders Container -->
    <div class="space-y-8">
        <!-- Brightness Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Brightness</span>
                <span class="text-zinc-500 font-mono">{filters.brightness}%</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="200" 
                bind:value={filters.brightness} 
            />
        </div>

        <!-- Contrast Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Contrast</span>
                <span class="text-zinc-500 font-mono">{filters.contrast}%</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="200" 
                bind:value={filters.contrast} 
            />
        </div>

        <!-- Saturation Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Saturation</span>
                <span class="text-zinc-500 font-mono">{filters.saturation}%</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="200" 
                bind:value={filters.saturation} 
            />
        </div>

        <!-- Divider -->
        <div class="my-4 h-px w-full bg-zinc-800"></div>

        <!-- Blur Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Blur</span>
                <span class="text-zinc-500 font-mono">{filters.blur}px</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="20" 
                step="0.1" 
                bind:value={filters.blur} 
            />
        </div>

        <!-- Grayscale Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Grayscale</span>
                <span class="text-zinc-500 font-mono">{filters.grayscale}%</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="100" 
                bind:value={filters.grayscale} 
            />
        </div>

        <!-- Sepia Slider -->
        <div class="group">
            <div class="mb-3 flex justify-between text-xs font-medium">
                <span class="text-zinc-300">Sepia</span>
                <span class="text-zinc-500 font-mono">{filters.sepia}%</span>
            </div>
            <input 
                type="range" 
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20" 
                min="0" 
                max="100" 
                bind:value={filters.sepia} 
            />
        </div>
    </div>
</div>