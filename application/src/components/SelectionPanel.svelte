<script lang="ts">
	import { env } from '$env/dynamic/public';

	// Prop to notify parent component when an image is selected
	// selectedImage: The currently selected image URL to highlight in the grid
	// onDelete: key to notify parent when an image is removed
	let { onSelect, onDelete = (img: string) => {}, selectedImage = null } = $props();

	type ImageItem = { photoId: string; previewURL: string };

	// State to store the list of uploaded image strings (Data URLs)
	let images = $state<ImageItem[]>([]);

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

				const previewURL = e.target.result as string;

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

					const item: ImageItem = { photoId, previewURL };
					images = [...images, item];

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
	// Function to remove an image from the list
	function removeImage(e: MouseEvent, index: number) {
		e.stopPropagation(); // Prevent triggering selection
		const removedImage = images[index]; // Capture image before removing
		images = images.filter((_, i) => i !== index);
		onDelete(removedImage.photoId); // Notify parent
	}
</script>

<div class="flex h-full w-full flex-col items-center border-r border-zinc-800 bg-zinc-900">
	<!-- Header Section: Just Upload Icon -->
	<div
		class="flex w-full flex-col items-center justify-center gap-2 border-b border-zinc-800 bg-zinc-900/90 py-4 backdrop-blur-sm"
	>
		<button
			onclick={handleUpload}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md transition-colors hover:bg-zinc-200"
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
							class:border-white={img.photoId === selectedImage}
							class:ring-1={img.photoId === selectedImage}
							class:ring-white={img.photoId === selectedImage}
							class:border-zinc-800={img.photoId !== selectedImage}
							class:hover:border-white={img.photoId !== selectedImage}
							onclick={() => onSelect(img.photoId)}
						>
							<img src={img.previewURL} alt="Thumbnail" class="h-full w-full object-cover" />
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

	<!-- Hidden File Input for handling uploads -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={onFileSelected}
	/>
</div>
