<script lang="ts">
	let { label, value = $bindable(), min = -100, max = 100, gradient = '', lock = false } = $props();
</script>

<div class="group" class:opacity-50={lock} class:pointer-events-none={lock}>
	<div class="mb-2 flex justify-between text-xs font-medium">
		<span class="text-zinc-300">{label}</span>
		<span class="font-mono text-zinc-500">{value}</span>
	</div>
	<input
		type="range"
		class={`slider h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white ${gradient || 'bg-zinc-800'}`}
		{min}
		{max}
		bind:value
		disabled={lock}
	/>
</div>
