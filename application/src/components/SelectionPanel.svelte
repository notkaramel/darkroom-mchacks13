<script lang="ts">
	import { exportMultipleImages } from '$lib/export';
	import { PUBLIC_DEMO_USER } from '$env/static/public';

	// Props
	let {
		onSelect,
		onDelete = (photoId: string) => {},
		selectedPhotoId = null
	}: {
		onSelect: (photoId: string) => void;
		onDelete?: (photoId: string) => void;
		selectedPhotoId: string | null;
	} = $props();

	// State: List of photo IDs from database
	let photoIds = $state<string[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// State: Photos selected for export
	let selectedForExport = $state<Set<string>>(new Set());

	// State: Export progress
	let isExporting = $state(false);
	let exportProgress = $state({ current: 0, total: 0 });

	// Reference to hidden file input
	let fileInput: HTMLInputElement | undefined;

	/**
	 * Fetch all photos for the demo user from the database
	 */
	async function fetchPhotos() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/photos/${PUBLIC_DEMO_USER}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch photos: ${response.statusText}`);
			}

			const data = await response.json();
			photoIds = data.photos?.map((photo: { photoId: string }) => photo.photoId) || [];
		} catch (err) {
			console.error('Error fetching photos:', err);
			error = err instanceof Error ? err.message : 'Failed to load photos';
			photoIds = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Load photos on component mount
	 */
	$effect(() => {
		fetchPhotos();
	});

	/**
	 * Trigger file input click
	 */
	function handleUploadClick() {
		fileInput?.click();
	}

	/**
	 * Handle file selection and upload
	 */
	async function handleFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || !target.files[0]) return;

		const file = target.files[0];
		isLoading = true;
		error = null;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('userId', PUBLIC_DEMO_USER);

			const response = await fetch('/api/photo/new', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Upload failed: ${errorText}`);
			}

			const { photoId } = await response.json();

			// Add to local state and select it
			photoIds = [...photoIds, photoId];
			onSelect(photoId);
		} catch (err) {
			console.error('Upload error:', err);
			error = err instanceof Error ? err.message : 'Failed to upload photo';
		} finally {
			isLoading = false;
			// Reset file input to allow selecting the same file again
			target.value = '';
		}
	}

	/**
	 * Toggle photo selection for export (single click)
	 */
	function toggleExportSelection(photoId: string) {
		selectedForExport = new Set(selectedForExport);
		if (selectedForExport.has(photoId)) {
			selectedForExport.delete(photoId);
		} else {
			selectedForExport.add(photoId);
		}
	}

	/**
	 * Open photo for editing (double click)
	 */
	function openForEdit(photoId: string) {
		onSelect(photoId);
	}

	/**
	 * Handle image click with double-click detection
	 */
	let clickTimeout: number | null = null;
	function handleImageClick(photoId: string) {
		if (clickTimeout) {
			// Double click detected
			clearTimeout(clickTimeout);
			clickTimeout = null;
			openForEdit(photoId);
		} else {
			// Single click - wait to see if it becomes a double click
			clickTimeout = window.setTimeout(() => {
				toggleExportSelection(photoId);
				clickTimeout = null;
			}, 250); // 250ms delay to detect double click
		}
	}

	/**
	 * Export selected photos
	 */
	async function handleExport() {
		if (isExporting || selectedForExport.size === 0) return;

		isExporting = true;
		exportProgress = { current: 0, total: selectedForExport.size };

		try {
			await exportMultipleImages(
				Array.from(selectedForExport),
				undefined, // Auto-detect format from original file
				0.95,
				(current, total) => {
					exportProgress = { current, total };
				}
			);

			// Clear selection after successful export
			selectedForExport = new Set();
		} catch (err) {
			console.error('Export failed:', err);
			error = err instanceof Error ? err.message : 'Export failed';
		} finally {
			isExporting = false;
			exportProgress = { current: 0, total: 0 };
		}
	}

	/**
	 * Delete a photo from the library
	 */
	async function handleDeletePhoto(e: MouseEvent, photoId: string) {
		e.stopPropagation(); // Prevent triggering selection

		try {
			const response = await fetch(`/api/photo/${photoId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete photo');
			}

			// Remove from local state
			photoIds = photoIds.filter((id) => id !== photoId);
			selectedForExport.delete(photoId);
			onDelete(photoId);
		} catch (err) {
			console.error('Delete error:', err);
			error = err instanceof Error ? err.message : 'Failed to delete photo';
		}
	}
</script>

<div class="flex h-full w-full flex-col items-center border-r border-zinc-800 bg-zinc-900">
	<!-- Header: Upload Button -->
	<div
		class="flex w-full flex-col items-center justify-center gap-2 border-b border-zinc-800 bg-zinc-900/90 py-4 backdrop-blur-sm"
	>
		<button
			onclick={handleUploadClick}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md transition-colors hover:bg-zinc-300 disabled:opacity-50"
			title="Upload Photo"
			disabled={isLoading}
		>
			{#if isLoading}
				<svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="w-full border-b border-red-800 bg-red-900/20 px-2 py-2 text-xs text-red-400">
			{error}
		</div>
	{/if}

	<!-- Gallery Grid -->
	<div class="custom-scrollbar w-full flex-1 overflow-y-auto px-2 py-4">
		{#if isLoading && photoIds.length === 0}
			<!-- Loading State -->
			<div class="flex flex-col items-center justify-center gap-2 pt-8 opacity-50">
				<svg class="h-8 w-8 animate-spin text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="text-xs text-zinc-500">Loading photos...</p>
			</div>
		{:else if photoIds.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center gap-2 pt-4 opacity-50">
				<div class="h-10 w-10 rounded-full border border-dashed border-zinc-600"></div>
				<p class="text-xs text-zinc-500">No photos yet</p>
			</div>
		{:else}
			<!-- Photo Grid -->
			<div class="flex w-full flex-col items-center gap-3">
				{#each photoIds as photoId}
					<div class="group relative shrink-0">
						<button
							class="block h-20 w-20 overflow-hidden rounded-md border transition-all duration-200 focus:outline-none"
							class:border-white={photoId === selectedPhotoId}
							class:ring-2={photoId === selectedPhotoId || selectedForExport.has(photoId)}
							class:ring-white={photoId === selectedPhotoId}
							class:border-blue-500={selectedForExport.has(photoId) && photoId !== selectedPhotoId}
							class:ring-blue-500={selectedForExport.has(photoId) && photoId !== selectedPhotoId}
							class:border-zinc-800={photoId !== selectedPhotoId && !selectedForExport.has(photoId)}
							class:hover:border-white={photoId !== selectedPhotoId}
							onclick={() => handleImageClick(photoId)}
						>
							<img
								src={`/api/photo/${photoId}/file`}
								alt=""
								class="h-full w-full object-cover"
								loading="lazy"
							/>

							<!-- Selection Checkmark -->
							{#if selectedForExport.has(photoId)}
								<div
									class="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow-lg"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="h-3 w-3 text-white"
									>
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							{/if}
						</button>

						<!-- Delete Button (Visible on Hover) -->
						<button
							onclick={(e) => handleDeletePhoto(e, photoId)}
							class="absolute -top-1 -right-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-zinc-900 transition-transform group-hover:flex hover:scale-110"
							title="Delete photo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="h-3 w-3"
							>
								<path
									d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer: Export Button -->
	<div
		class="flex w-full flex-col gap-2 border-t border-zinc-800 bg-zinc-900/90 px-2 py-4 backdrop-blur-sm"
	>
		<button
			onclick={handleExport}
			class="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-black shadow-md transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
			title="Export selected photos"
			disabled={selectedForExport.size === 0 || isExporting}
		>
			{#if isExporting}
				<!-- Loading spinner -->
				<svg
					class="h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm font-medium">Exporting {exportProgress.current}/{exportProgress.total}</span>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 5v14" />
					<path d="M21 12H7" />
					<path d="m15 18 6-6-6-6" />
				</svg>
				<span class="text-sm font-medium"
					>Export{selectedForExport.size > 0 ? ` (${selectedForExport.size})` : ''}</span
				>
			{/if}
		</button>
	</div>

	<!-- Hidden File Input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileSelected}
	/>
</div>
