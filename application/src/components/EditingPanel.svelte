<script lang="ts">
    import { slide } from 'svelte/transition';

    // Bindable prop to allow two-way state update with the parent
    let { filters = $bindable() } = $props();

    type HslColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

    // State for currently selected HSL color channel
    let activeHslColor = $state<HslColorKey>('red');

    // State for collapsible sections
    let expanded = $state({
        basic: true,
        color: true,
        hsl: true
    });

    const hslColors = [
        { name: 'red', color: 'bg-red-500' },
        { name: 'orange', color: 'bg-orange-500' },
        { name: 'yellow', color: 'bg-yellow-400' },
        { name: 'green', color: 'bg-green-500' },
        { name: 'cyan', color: 'bg-cyan-400' },
        { name: 'blue', color: 'bg-blue-500' },
        { name: 'purple', color: 'bg-purple-500' },
        { name: 'magenta', color: 'bg-pink-500' }
    ] as const;

    // Function to reset all filters to their default neutral values
    function reset() {
        filters = {
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
</script>

<div class="flex h-full flex-col overflow-y-auto bg-zinc-900/50 p-6 backdrop-blur-xl custom-scrollbar">
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
    <div class="space-y-6 pb-10">
        <!-- Basic Section -->
        <div class="border-b border-zinc-800/50 pb-6 last:border-0 last:pb-0">
            <button 
                class="flex w-full items-center justify-between text-left focus:outline-none group mb-4"
                onclick={() => expanded.basic = !expanded.basic}
            >
                <h3 class="text-xs font-bold uppercase text-zinc-400 transition-colors group-hover:text-zinc-200">Basic</h3>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="2" 
                    stroke="currentColor" 
                    class={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${expanded.basic ? 'rotate-180' : ''}`}
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            
            {#if expanded.basic}
                <div class="space-y-4" transition:slide={{ duration: 200 }}>
                    <!-- Brightness -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Brightness</span>
                            <span class="text-zinc-500 font-mono">{filters.basic.brightness}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.basic.brightness} />
                    </div>
                    <!-- Contrast -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Contrast</span>
                            <span class="text-zinc-500 font-mono">{filters.basic.contrast}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.basic.contrast} />
                    </div>
                    <!-- Highlight -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Highlights</span>
                            <span class="text-zinc-500 font-mono">{filters.basic.highlight}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.basic.highlight} />
                    </div>
                    <!-- Shadow -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Shadows</span>
                            <span class="text-zinc-500 font-mono">{filters.basic.shadow}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.basic.shadow} />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Color Section -->
        <div class="border-b border-zinc-800/50 pb-6 last:border-0 last:pb-0">
            <button 
                class="flex w-full items-center justify-between text-left focus:outline-none group mb-4"
                onclick={() => expanded.color = !expanded.color}
            >
                <h3 class="text-xs font-bold uppercase text-zinc-400 transition-colors group-hover:text-zinc-200">Color</h3>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="2" 
                    stroke="currentColor" 
                    class={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${expanded.color ? 'rotate-180' : ''}`}
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {#if expanded.color}
                <div class="space-y-4" transition:slide={{ duration: 200 }}>
                    <!-- Temperature -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Temp</span>
                            <span class="text-zinc-500 font-mono">{filters.color.temperature}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.color.temperature} />
                    </div>
                    <!-- Tint -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Tint</span>
                            <span class="text-zinc-500 font-mono">{filters.color.tint}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.color.tint} />
                    </div>
                    <!-- Vibrance -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Vibrance</span>
                            <span class="text-zinc-500 font-mono">{filters.color.vibrance}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.color.vibrance} />
                    </div>
                    <!-- Saturation -->
                    <div class="group">
                        <div class="mb-2 flex justify-between text-xs font-medium">
                            <span class="text-zinc-300">Saturation</span>
                            <span class="text-zinc-500 font-mono">{filters.color.saturation}</span>
                        </div>
                        <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.color.saturation} />
                    </div>
                </div>
            {/if}
        </div>

        <!-- HSL Section -->
        <div class="border-b border-zinc-800/50 pb-6 last:border-0 last:pb-0">
            <button 
                class="flex w-full items-center justify-between text-left focus:outline-none group mb-4"
                onclick={() => expanded.hsl = !expanded.hsl}
            >
                <h3 class="text-xs font-bold uppercase text-zinc-400 transition-colors group-hover:text-zinc-200">HSL</h3>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="2" 
                    stroke="currentColor" 
                    class={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${expanded.hsl ? 'rotate-180' : ''}`}
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
           
            {#if expanded.hsl}
                <div transition:slide={{ duration: 200 }}>
                    <!-- Color Selector -->
                    <div class="mb-6 flex justify-between px-1">
                        {#each hslColors as {name, color}}
                            <button 
                                class={`h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-zinc-900 focus:outline-none transition-all ${color} ${activeHslColor === name ? 'ring-white scale-110' : 'ring-transparent opacity-80 hover:opacity-100 hover:scale-110'}`}
                                onclick={(e) => { e.stopPropagation(); activeHslColor = name; }}
                                title={name.charAt(0).toUpperCase() + name.slice(1)}
                            ></button>
                        {/each}
                    </div>

                    <!-- HSL Sliders for Active Color -->
                    <div class="space-y-4">
                            <!-- Hue -->
                            <div class="group">
                                <div class="mb-2 flex justify-between text-xs font-medium">
                                    <span class="text-zinc-300">Hue</span>
                                    <span class="text-zinc-500 font-mono">{filters.hsl[activeHslColor].hue}</span>
                                </div>
                                <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.hsl[activeHslColor].hue} />
                            </div>
                            <!-- Saturation -->
                            <div class="group">
                                <div class="mb-2 flex justify-between text-xs font-medium">
                                    <span class="text-zinc-300">Saturation</span>
                                    <span class="text-zinc-500 font-mono">{filters.hsl[activeHslColor].saturation}</span>
                                </div>
                                <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.hsl[activeHslColor].saturation} />
                            </div>
                            <!-- Luminance -->
                            <div class="group">
                                <div class="mb-2 flex justify-between text-xs font-medium">
                                    <span class="text-zinc-300">Luminance</span>
                                    <span class="text-zinc-500 font-mono">{filters.hsl[activeHslColor].luminance}</span>
                                </div>
                                <input type="range" class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" min="-100" max="100" bind:value={filters.hsl[activeHslColor].luminance} />
                            </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
