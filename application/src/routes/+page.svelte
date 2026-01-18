<script lang="ts">
	import * as PIXI from 'pixi.js';
	import SelectionPanel from 'components/SelectionPanel.svelte';
	import PictureView from 'components/PictureView.svelte';
	import EditingPanel from 'components/EditingPanel.svelte';
	import { saveFilters, loadFilters, deleteFilters, getDefaultFilters, type FilterSettings } from '$lib/storage';

	// State: Currently selected photo ID
	let selectedPhotoId = $state<string | null>(null);

	// State: Panel visibility
	let isLibraryOpen = $state(true);
	let isEditingOpen = $state(true);

	// State: Filter settings for the currently selected photo
	let filters = $state<FilterSettings>(getDefaultFilters());

	// State: PIXI.js references (for histogram and export)
	let filteredSprite = $state<PIXI.Sprite | null>(null);
	let pixiRenderer = $state<PIXI.Renderer | null>(null);
	let pixiApp = $state<PIXI.Application | null>(null);

	/**
	 * Handle photo selection from the library
	 * Loads saved filters if available, otherwise uses defaults
	 */
	function handlePhotoSelect(photoId: string) {
		// Toggle off if clicking the same photo
		if (selectedPhotoId === photoId) {
			selectedPhotoId = null;
			filters = getDefaultFilters();
			return;
		}

		selectedPhotoId = photoId;

		// Load saved filters for this photo, or use defaults
		const savedFilters = loadFilters(photoId);
		if (savedFilters) {
			filters = savedFilters;
		} else {
			filters = getDefaultFilters();
		}
	}

	/**
	 * Handle photo deletion from the library
	 * Cleans up saved filters and resets selection if needed
	 */
	function handlePhotoDelete(photoId: string) {
		// Delete saved filters for this photo
		deleteFilters(photoId);

		// Clear selection if the deleted photo was selected
		if (selectedPhotoId === photoId) {
			selectedPhotoId = null;
			filters = getDefaultFilters();
		}
	}

	/**
	 * Auto-save filters whenever they change (debounced)
	 * Saves filter state to localStorage for persistence
	 */
	let saveTimeout: number | null = null;
	$effect(() => {
		// Track filter changes by serializing
		JSON.stringify(filters);

		if (selectedPhotoId) {
			// Debounce saves to avoid excessive writes
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = window.setTimeout(() => {
				if (selectedPhotoId) {
					saveFilters(selectedPhotoId, filters);
				}
			}, 500); // Save 500ms after last change
		}

		return () => {
			if (saveTimeout) clearTimeout(saveTimeout);
		};
	});
</script>

<!-- Main Application Layout -->
<div class="flex h-screen w-screen overflow-hidden bg-black font-sans text-zinc-200">
	<!-- Left Panel: Photo Library -->
	<div
		class="relative z-20 h-full shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out"
		style:width={isLibraryOpen ? '160px' : '0px'}
	>
		<div class="h-full w-[160px]">
			<SelectionPanel
				onSelect={handlePhotoSelect}
				onDelete={handlePhotoDelete}
				selectedPhotoId={selectedPhotoId}
			/>
		</div>
	</div>

	<!-- Center Panel: Photo Viewer -->
	<div class="relative z-10 h-full min-w-0 flex-1 bg-zinc-950 shadow-inner">
		<!-- Toggle Library Button (Left) -->
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

		<!-- Photo View Component -->
		<PictureView
			photoId={selectedPhotoId}
			{filters}
			bind:filteredSprite
			bind:pixiRenderer
			bind:pixiApp
		/>

		<!-- Toggle Editing Panel Button (Right) -->
		<button
			onclick={() => (isEditingOpen = !isEditingOpen)}
			class="absolute top-1/2 right-0 z-30 -translate-y-1/2 rounded-l-lg border-y border-l border-zinc-800 bg-zinc-900/50 p-1 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-white"
			aria-label="Toggle Editing Panel"
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

	<!-- Right Panel: Editing Controls -->
	<div
		class="relative z-20 h-full shrink-0 overflow-hidden border-l border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out"
		style:width={isEditingOpen ? '320px' : '0px'}
	>
		<div class="h-full w-[320px]">
			<EditingPanel bind:filters photoId={selectedPhotoId} />
		</div>
	</div>
</div>
