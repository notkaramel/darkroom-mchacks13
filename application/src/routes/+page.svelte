<script lang="ts">
    // Import the three main panels of the application
	import SelectionPanel from '../components/SelectionPanel.svelte';
    import PictureView from '../components/PictureView.svelte';
    import EditingPanel from '../components/EditingPanel.svelte';

    // State for the currently selected image to be displayed in the center view
    let currentImage = $state<string | null>(null);
    
    // State object holding all filter values (Filters default values)
    let filters = $state({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0
    });

    // Handler to update the current image when a user selects one from the SelectionPanel
    function handleSelectImage(img: string) {
        currentImage = img;
    }
</script>

<!-- Main Application Layout: 12-column Grid -->
<div class="grid h-screen w-screen grid-cols-12 overflow-hidden bg-black font-sans text-zinc-200">
    
    <!-- Left Column (3/12): Selection Panel -->
    <!-- Handles image uploading and gallery selection. Passes the selection handler down. -->
    <div class="col-span-3 h-full border-r border-zinc-800 bg-zinc-900 shadow-xl z-20">
        <SelectionPanel onSelect={handleSelectImage} />
    </div>

    <!-- Center Column (6/12): Picture View -->
    <!-- Displays the main image. Receives the current image and filter state to render the preview. -->
    <div class="col-span-6 h-full bg-zinc-950 relative z-10 shadow-inner">
        <PictureView image={currentImage} {filters} />
    </div>

    <!-- Right Column (3/12): Editing Panel -->
    <!-- Contains the adjustment sliders. Binds directly to the filters state to allow two-way updates. -->
    <div class="col-span-3 h-full border-l border-zinc-800 bg-zinc-900 shadow-xl z-20">
        <EditingPanel bind:filters={filters} />
    </div>
</div>