<script lang="ts">
	import { slide } from 'svelte/transition';

	let { title, isExpanded = $bindable(true), children } = $props();
</script>

<div class="border-b border-zinc-800/50 pb-6 last:border-0 last:pb-0">
	<button
		class="group mb-4 flex w-full items-center justify-between text-left focus:outline-none"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<h3 class="text-xs font-bold text-zinc-400 uppercase transition-colors group-hover:text-white">
			{title}
		</h3>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			class={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	{#if isExpanded}
		<div class="space-y-4" transition:slide={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>
