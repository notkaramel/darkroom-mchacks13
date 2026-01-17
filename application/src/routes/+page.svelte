<script lang="ts">
    // Import the three main panels of the application
	import SelectionPanel from '../components/SelectionPanel.svelte';
    import PictureView from '../components/PictureView.svelte';
    import EditingPanel from '../components/EditingPanel.svelte';

    // State for the currently selected image to be displayed in the center view
    let currentImage = $state<string | null>(null);
    
    // Panel visibility state
    let isLibraryOpen = $state(true);
    let isEditingOpen = $state(true);

    // State object holding all filter values (grouped by category as per Preset schema)
    let filters = $state({
        basic: {
            brightness: 0,
            contrast: 0,
            highlight: 0,
            shadow: 0
        },
        color: {
            temperature: 0,
            tint: 0,
            vibrance: 0,
            saturation: 0
        },
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
        lens_corrections: {
            distortion: 0,
            chromatic_aberration: 0,
            vignetting: 0
        },
        transform: {
            rotate: 0,
            vertical: 0,
            horizontal: 0,
            perspective: 0
        }
    });

    // Handler to update the current image when a user selects one from the SelectionPanel
    function handleSelectImage(img: string) {
        currentImage = img;
    }

    // Handler to clear the current view if the selected image is deleted
    function handleDeleteImage(img: string) {
        if (currentImage === img) {
            currentImage = null;
        }
    }
</script>

<!-- Main Application Layout: Flex Container -->
<div class="flex h-screen w-screen overflow-hidden bg-black font-sans text-zinc-200">
    
    <!-- Left Column: Selection Panel -->
    <!-- Collapsible container with smooth width transition -->
    <div class="relative h-full flex-shrink-0 border-r border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out z-20 overflow-hidden"
         style:width={isLibraryOpen ? '160px' : '0px'}>
        <div class="h-full w-[160px]">
            <SelectionPanel onSelect={handleSelectImage} onDelete={handleDeleteImage} selectedImage={currentImage} />
        </div>
    </div>

    <!-- Center Column: Picture View -->
    <!-- Takes up remaining space. Contains floating toggle buttons. -->
    <div class="relative flex-1 h-full bg-zinc-950 z-10 shadow-inner min-w-0">
        <!-- Floating Toggle Button for Library (Left) -->
        <button 
            onclick={() => isLibraryOpen = !isLibraryOpen}
            class="absolute left-0 top-1/2 -translate-y-1/2 z-30 rounded-r-lg bg-zinc-900/50 p-1 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-white border-y border-r border-zinc-800"
            aria-label="Toggle Library"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                {#if isLibraryOpen}
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                {:else}
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                {/if}
            </svg>
        </button>

        <!-- Picture View Component -->
        <PictureView image={currentImage} {filters} />

        <!-- Floating Toggle Button for Editing (Right) -->
        <button 
            onclick={() => isEditingOpen = !isEditingOpen}
            class="absolute right-0 top-1/2 -translate-y-1/2 z-30 rounded-l-lg bg-zinc-900/50 p-1 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-white border-y border-l border-zinc-800"
            aria-label="Toggle editing panel"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                {#if isEditingOpen}
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                {:else}
                     <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                {/if}
            </svg>
        </button>
    </div>

    <!-- Right Column: Editing Panel -->
    <!-- Collapsible container with smooth width transition -->
    <div class="relative h-full flex-shrink-0 border-l border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out z-20 overflow-hidden"
         style:width={isEditingOpen ? '320px' : '0px'}>
        <div class="h-full w-[320px]">
            <EditingPanel bind:filters={filters} />
        </div>
    </div>
</div>