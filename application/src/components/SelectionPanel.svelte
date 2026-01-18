<script lang="ts">
    // Prop to notify parent component when an image is selected
    // selectedImage: The currently selected image URL to highlight in the grid
    // onDelete: key to notify parent when an image is removed
    let { onSelect, onDelete = (img: string) => {}, selectedImage = null } = $props();

    // State to store the list of uploaded image strings (Data URLs)
    let images = $state<string[]>([]);
    
    // Reference to the hidden file input element
    let fileInput = $state<HTMLInputElement | undefined>();

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
            reader.onload = (e) => {
                if (e.target?.result) {
                    const result = e.target.result as string;
                    // Add new image to the list
                    images = [...images, result];
                    // Automatically select the newly uploaded image
                    onSelect(result);
                }
            };
            reader.readAsDataURL(file);
        }
    }
    // Function to remove an image from the list
    function removeImage(e: MouseEvent, index: number) {
        e.stopPropagation(); // Prevent triggering selection
        const removedImage = images[index]; // Capture image before removing
        images = images.filter((_, i) => i !== index);
        onDelete(removedImage); // Notify parent
    }
</script>

<div class="flex h-full flex-col items-center bg-zinc-900 border-r border-zinc-800 w-full">
    <!-- Header Section: Just Upload Icon -->
    <div class="flex w-full flex-col items-center justify-center border-b border-zinc-800 bg-zinc-900/90 py-4 backdrop-blur-sm gap-2">
        <button 
            onclick={handleUpload} 
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200 shadow-md"
            title="Upload Photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>

        </button>
    </div>
    
    <!-- Gallery Grid Section (Single Column) -->
    <div class="flex-1 w-full overflow-y-auto px-2 py-4 custom-scrollbar">
        {#if images.length === 0}
            <!-- Empty State -->
            <div class="flex flex-col items-center justify-center gap-2 pt-4 opacity-50">
                <div class="h-10 w-10 rounded-full border border-dashed border-zinc-600"></div>
            </div>
        {:else}
            <!-- Image Grid -->
            <div class="flex flex-col gap-3 w-full items-center">
                {#each images as img, i}
                    <div class="relative group shrink-0">
                        <button 
                            class="h-20 w-20 overflow-hidden rounded-md border transition-all duration-200 focus:outline-none block"
                            class:border-white={img === selectedImage}
                            class:ring-1={img === selectedImage}
                            class:ring-white={img === selectedImage}
                            class:border-zinc-800={img !== selectedImage}
                            class:hover:border-white={img !== selectedImage}
                            onclick={() => onSelect(img)}
                        >
                            <img src={img} alt="Thumbnail" class="h-full w-full object-cover" />
                        </button>
                        
                        <!-- Delete Button (Visible on Hover) -->
                        <button
                            onclick={(e) => removeImage(e, i)}
                            class="absolute -top-1 -right-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-zinc-900 transition-transform hover:scale-110 group-hover:flex"
                            title="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
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