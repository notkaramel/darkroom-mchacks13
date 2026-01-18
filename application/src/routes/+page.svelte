<script lang="ts">
	// Import the three main panels of the application
	import * as PIXI from 'pixi.js';
	import SelectionPanel from 'components/SelectionPanel.svelte';
	import PictureView from 'components/PictureView.svelte';
	import EditingPanel from 'components/EditingPanel.svelte';
	import { saveFilters, loadFilters, deleteFilters, getDefaultFilters } from '$lib/storage';

	// State for the currently selected image to be displayed in the center view
	let currentImage = $state<string | null>(null);

	// Panel visibility state
	let isLibraryOpen = $state(true);
	let isEditingOpen = $state(true);

	// State object holding all filter values (grouped by category as per Preset schema)
	let filters = $state(getDefaultFilters());

	let filteredSprite = $state<PIXI.Sprite | null>(null);

	// Handler to update the current image when a user selects one from the SelectionPanel
	function handleSelectImage(img: string) {
		if (currentImage === img) {
			currentImage = null;
			filters = getDefaultFilters();
			return;
		} else {
			currentImage = img;
		}

		// Load saved filters for this image, or use defaults
		const savedFilters = loadFilters(img);
		if (savedFilters) {
			filters = savedFilters;
		} else {
			filters = getDefaultFilters();
		}
	}

	// Handler to clear the current view if the selected image is deleted
	function handleDeleteImage(img: string) {
		// Delete saved filters for this image
		deleteFilters(img);

		if (currentImage === img) {
			currentImage = null;
			filters = getDefaultFilters();
		}
	}

	// Auto-save filters whenever they change (debounced to avoid excessive writes)
	let saveTimeout: number | null = null;
	$effect(() => {
		// Watch for filter changes
		JSON.stringify(filters); // Track all filter properties

		if (currentImage) {
			// Debounce saves
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = window.setTimeout(() => {
				saveFilters(currentImage!, filters);
			}, 500); // Save 500ms after last change
		}
	});
</script>

<!-- Main Application Layout: Flex Container -->
<div class="flex h-screen w-screen overflow-hidden bg-black font-sans text-zinc-200">
	<!-- Left Column: Selection Panel -->
	<!-- Collapsible container with smooth width transition -->
	<div
		class="relative z-20 h-full flex-shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out"
		style:width={isLibraryOpen ? '160px' : '0px'}
	>
		<div class="h-full w-[160px]">
			<SelectionPanel
				onSelect={handleSelectImage}
				onDelete={handleDeleteImage}
				selectedImage={currentImage}
			/>
		</div>
	</div>

	<!-- Center Column: Picture View -->
	<!-- Takes up remaining space. Contains floating toggle buttons. -->
	<div class="relative z-10 h-full min-w-0 flex-1 bg-zinc-950 shadow-inner">
		<!-- Floating Toggle Button for Library (Left) -->
		<button
			onclick={() => (isLibraryOpen = !isLibraryOpen)}
			class="absolute top-1/2 left-0 z-30 -translate-y-1/2 rounded-r-lg border-y border-r border-zinc-800 bg-zinc-900/50 p-1 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-white"
			aria-label="Toggle Library"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-4"
			>
				{#if isLibraryOpen}
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				{/if}
			</svg>
		</button>

		<!-- Picture View Component -->
		<PictureView photoId={currentImage} {filters} bind:filteredSprite />

		<!-- Floating Toggle Button for Editing (Right) -->
		<button
			onclick={() => (isEditingOpen = !isEditingOpen)}
			class="absolute top-1/2 right-0 z-30 -translate-y-1/2 rounded-l-lg border-y border-l border-zinc-800 bg-zinc-900/50 p-1 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-white"
			aria-label="Toggle editing panel"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-4"
			>
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
	<div
		class="relative z-20 h-full flex-shrink-0 overflow-hidden border-l border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out"
		style:width={isEditingOpen ? '320px' : '0px'}
	>
		<div class="h-full w-[320px]">
			<EditingPanel bind:filters image={filteredSprite} />
		</div>
	</div>
</div>
