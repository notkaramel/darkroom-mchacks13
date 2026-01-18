<script lang="ts">
    let { label, value = $bindable(), min = -100, max = 100 } = $props();
</script>

<div class="group">
    <div class="mb-2 flex justify-between text-xs font-medium">
        <span class="text-zinc-300">{label}</span>
        <span class="text-zinc-500 font-mono">{value}</span>
    </div>
    <input 
        type="range" 
        class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" 
        {min} 
        {max} 
        bind:value
    />
</div>