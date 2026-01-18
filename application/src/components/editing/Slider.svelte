<script lang="ts">
	let { label, value = $bindable(), min = -100, max = 100 } = $props();
</script>

<div class="group">
	<div class="mb-2 flex justify-between text-xs font-medium">
		<span class="text-zinc-300">{label}</span>
		<span class="font-mono text-zinc-500">{value}</span>
	</div>
	<input
		type="range"
		class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
		{min}
		{max}
		bind:value
	/>
</div>
