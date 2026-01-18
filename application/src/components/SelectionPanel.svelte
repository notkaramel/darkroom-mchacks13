<script lang="ts">
	import { env } from '$env/dynamic/public';

	// Prop to notify parent component when an image is selected
	// selectedImage: The currently selected image URL to highlight in the grid
	// onDelete: key to notify parent when an image is removed
	let {
		onSelect,
		onDelete = (img: string) => {},
		onOpenAI = () => {},
		selectedImage = null
	} = $props();
	import { exportMultipleImages } from '$lib/export';

	type ImageItem = { photoId: string; previewURL: string };

	// State to store the list of uploaded image strings (Data URLs)
	let images = $state<string[]>([]);

	// State to store images selected for export
	let selectedForExport = $state<Set<string>>(new Set());

	// Export progress state
	let isExporting = $state(false);
	let exportProgress = $state({ current: 0, total: 0 });

	// Reference to the hidden file input element
	let fileInput: HTMLInputElement | undefined;

	const userId = env.PUBLIC_DEMO_USER;
	console.log(userId);

	// Function to trigger the hidden file input click
	function handleUpload() {
		fileInput?.click();
	}

	// Handler for when a file is selected from the file dialog
	function onFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const reader = new FileReader();
			// Read file as Data URL to display immediately
			reader.onload = async (e) => {
				if (!e.target?.result) return;

				try {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('userId', userId);

					const res = await fetch('/api/photo/new', {
						method: 'POST',
						body: formData
					});

					if (!res.ok) {
						console.error('Upload failed: ', await res.text());
						return;
					}

					const { photoId } = await res.json();

					images = [...images, photoId];
					onSelect(photoId);
				} catch (err) {
					console.error('Upload error', err);
				}
			};
			reader.readAsDataURL(file);

			// Reset the file input to allow selecting the same file again
			target.value = '';
		}
	}

	// Single click - toggle selection for export
	function toggleExportSelection(img: string) {
		selectedForExport = new Set(selectedForExport);
		if (selectedForExport.has(img)) {
			selectedForExport.delete(img);
		} else {
			selectedForExport.add(img);
		}
	}

	// Double click - open in edit mode
	function openForEdit(img: string) {
		onSelect(img);
	}

	// Click handler with double-click detection
	let clickTimeout: number | null = null;
	function handleImageClick(img: string) {
		if (clickTimeout) {
			// Double click detected
			clearTimeout(clickTimeout);
			clickTimeout = null;
			openForEdit(img);
		} else {
			// Single click - wait to see if it becomes a double click
			clickTimeout = window.setTimeout(() => {
				toggleExportSelection(img);
				clickTimeout = null;
			}, 250); // 250ms delay to detect double click
		}
	}

	async function handleExport() {
		if (isExporting || selectedForExport.size === 0) return;

		isExporting = true;
		exportProgress = { current: 0, total: selectedForExport.size };

		try {
			await exportMultipleImages(
				Array.from(selectedForExport),
				'png', // or 'jpeg'
				0.95,
				(current, total) => {
					exportProgress = { current, total };
				}
			);

			// Clear selection after successful export
			selectedForExport = new Set();
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			isExporting = false;
			exportProgress = { current: 0, total: 0 };
		}
	}

	// Function to remove an image from the list
	function removeImage(e: MouseEvent, index: number) {
		e.stopPropagation(); // Prevent triggering selection
		const removedImage = images[index]; // Capture image before removing
		images = images.filter((_, i) => i !== index);
		selectedForExport.delete(removedImage); // Remove from export selection
		onDelete(removedImage); // Notify parent
	}
</script>

<div class="flex h-full w-full flex-col items-center border-r border-zinc-800 bg-zinc-900">
	<!-- Header Section: Just Upload Icon -->
	<div
		class="flex w-full flex-col items-center justify-center gap-2 border-b border-zinc-800 bg-zinc-900/90 py-4 backdrop-blur-sm"
	>
		<button
			onclick={handleUpload}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md transition-colors hover:bg-zinc-300"
			title="Upload Photo"
		>
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
		</button>
	</div>

	<!-- Gallery Grid Section (Single Column) -->
	<div class="custom-scrollbar w-full flex-1 overflow-y-auto px-2 py-4">
		{#if images.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center gap-2 pt-4 opacity-50">
				<div class="h-10 w-10 rounded-full border border-dashed border-zinc-600"></div>
			</div>
		{:else}
			<!-- Image Grid -->
			<div class="flex w-full flex-col items-center gap-3">
				{#each images as img, i}
					<div class="group relative shrink-0">
						<button
							class="block h-20 w-20 overflow-hidden rounded-md border transition-all duration-200 focus:outline-none"
							class:border-white={img === selectedImage}
							class:ring-2={img === selectedImage || selectedForExport.has(img)}
							class:ring-white={img === selectedImage}
							class:border-blue-500={selectedForExport.has(img) && img !== selectedImage}
							class:ring-blue-500={selectedForExport.has(img) && img !== selectedImage}
							class:border-zinc-800={img !== selectedImage && !selectedForExport.has(img)}
							class:hover:border-white={img !== selectedImage}
							onclick={() => handleImageClick(img)}
						>
							<img src={img} alt="Thumbnail" class="h-full w-full object-cover" />

							<!-- Selection Checkmark -->
							{#if selectedForExport.has(img)}
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
							onclick={(e) => removeImage(e, i)}
							class="absolute -top-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-zinc-900 transition-transform group-hover:flex hover:scale-110"
							title="Remove image"
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

	<!-- Ai Agent and Export Button (Bottom) -->
	<div
		class="flex w-full flex-col gap-2 border-t border-zinc-800 bg-zinc-900/90 px-2 py-4 backdrop-blur-sm"
	>
		<!-- <button
			onclick={onOpenAI}
			class="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 text-white shadow-md transition-all hover:from-purple-500 hover:to-blue-500 active:scale-95"
			title="AI Agent"
		>
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
				class="lucide lucide-bot"
			>
				<path d="M12 8V4H8" />
				<rect width="16" height="12" x="4" y="8" rx="2" />
				<path d="M2 14h2" />
				<path d="M20 14h2" />
				<path d="M15 13v2" />
				<path d="M9 13v2" />
			</svg>
			<span class="text-sm font-medium">AI Agent</span>
		</button> -->
		<button
			onclick={handleExport}
			class="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-black shadow-md transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
			title="Export selected images"
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
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm font-medium"
					>Exporting {exportProgress.current}/{exportProgress.total}</span
				>
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
					class="lucide lucide-arrow-right-from-line-icon lucide-arrow-right-from-line"
					><path d="M3 5v14" /><path d="M21 12H7" /><path d="m15 18 6-6-6-6" />
				</svg>
				<span class="text-sm font-medium"
					>Export{selectedForExport.size > 0 ? ` (${selectedForExport.size})` : ''}</span
				>
			{/if}
		</button>
	</div>

	<!-- Hidden File Input for handling uploads -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={onFileSelected}
	/>
</div>
