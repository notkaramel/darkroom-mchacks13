<script lang="ts">
    // Prop to notify parent component when an image is selected
    let { onSelect } = $props();

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
</script>

<div class="flex h-full flex-col bg-zinc-900 border-r border-zinc-800">
    <!-- Header Section with Title and Upload Button -->
    <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-sm">
        <h2 class="text-xs font-bold uppercase tracking-widest text-zinc-500">Library</h2>
        <button 
            onclick={handleUpload} 
            class="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
             <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
            </svg>
            Upload Photo
        </button>
    </div>
    
    <!-- Gallery Grid Section -->
    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {#if images.length === 0}
            <!-- Empty State -->
            <div class="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 text-zinc-600">
                <p class="text-xs">No photos yet</p>
                <button onclick={handleUpload} class="text-xs underline hover:text-zinc-400">Upload one</button>
            </div>
        {:else}
            <!-- Image Grid -->
            <div class="grid grid-cols-2 gap-3">
                {#each images as img}
                    <button 
                        class="group relative aspect-square w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-white/50"
                        onclick={() => onSelect(img)}
                    >
                        <img src={img} alt="Thumbnail" class="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
                    </button>
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