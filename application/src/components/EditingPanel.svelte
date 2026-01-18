<script lang="ts">
	import Slider from 'components/editing/Slider.svelte';
	import Section from 'components/editing/Section.svelte';
	import Histogram from 'components/editing/Histogram.svelte';
	import { getDefaultFilters, type FilterSettings } from '$lib/storage';

	// Props
	let {
		filters = $bindable(),
		photoId = null
	}: {
		filters: FilterSettings;
		photoId: string | null;
	} = $props();

	// State: Determine if sliders should be locked (no photo loaded)
	const isLocked = $derived(!photoId);

	// State: Currently selected HSL color channel
	type HslColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';
	let activeHslColor = $state<HslColorKey>('red');

	// State: Collapsible sections
	let expanded = $state({
		basic: true,
		color: true,
		hsl: true,
		lens: false,
		transform: false
	});

	// HSL color definitions
	const hslColors = [
		{ name: 'red' as const, color: 'bg-red-500' },
		{ name: 'orange' as const, color: 'bg-orange-500' },
		{ name: 'yellow' as const, color: 'bg-yellow-400' },
		{ name: 'green' as const, color: 'bg-green-500' },
		{ name: 'cyan' as const, color: 'bg-cyan-400' },
		{ name: 'blue' as const, color: 'bg-blue-500' },
		{ name: 'purple' as const, color: 'bg-purple-500' },
		{ name: 'magenta' as const, color: 'bg-pink-500' }
	] as const;

	/**
	 * Reset all filters to default neutral values
	 */
	function resetFilters() {
		filters = getDefaultFilters();
	}
</script>

<div
	class="custom-scrollbar flex h-full flex-col overflow-y-auto bg-zinc-900/50 p-6 backdrop-blur-xl"
>
	<!-- Header with Reset Button -->
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Adjustments</h2>
		<button
			onclick={resetFilters}
			class="text-xs font-medium text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
			disabled={isLocked}
		>
			Reset All
		</button>
	</div>

	<!-- Histogram -->
	{#if !isLocked && photoId}
		<div class="mb-6">
			<Histogram photoId={photoId} {filters} />
		</div>
	{/if}

	<!-- Adjustment Sliders -->
	<div class="space-y-6 pb-10">
		<!-- Basic Adjustments -->
		<Section title="Basic" bind:isExpanded={expanded.basic}>
			<Slider
				label="Brightness"
				bind:value={filters.basic.brightness}
				gradient="bg-gradient-to-r from-zinc-950 to-white"
				lock={isLocked}
			/>
			<Slider label="Contrast" bind:value={filters.basic.contrast} lock={isLocked} />
			<Slider label="Highlights" bind:value={filters.basic.highlight} lock={isLocked} />
			<Slider label="Shadows" bind:value={filters.basic.shadow} lock={isLocked} />
		</Section>

		<!-- Color Adjustments -->
		<Section title="Color" bind:isExpanded={expanded.color}>
			<Slider
				label="Temp"
				bind:value={filters.color.temperature}
				gradient="bg-gradient-to-r from-blue-500 to-orange-500"
				lock={isLocked}
			/>
			<Slider
				label="Tint"
				bind:value={filters.color.tint}
				gradient="bg-gradient-to-r from-green-500 to-fuchsia-500"
				lock={isLocked}
			/>
			<Slider label="Vibrance" bind:value={filters.color.vibrance} lock={isLocked} />
			<Slider label="Saturation" bind:value={filters.color.saturation} lock={isLocked} />
		</Section>

		<!-- HSL Per-Color Adjustments -->
		<Section title="HSL" bind:isExpanded={expanded.hsl}>
			<!-- Color Selector -->
			<div
				class="mb-6 flex justify-between px-1"
				class:opacity-50={isLocked}
				class:pointer-events-none={isLocked}
			>
				{#each hslColors as { name, color }}
					<button
						class={`h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-zinc-900 transition-all focus:outline-none ${color} ${activeHslColor === name ? 'scale-110 ring-white' : 'opacity-80 ring-transparent hover:scale-110 hover:opacity-100'}`}
						onclick={(e) => {
							e.stopPropagation();
							activeHslColor = name;
						}}
						title={name.charAt(0).toUpperCase() + name.slice(1)}
						disabled={isLocked}
					></button>
				{/each}
			</div>

			<!-- HSL Sliders for Active Color -->
			<Slider label="Hue" bind:value={filters.hsl[activeHslColor].hue} lock={isLocked} />
			<Slider
				label="Saturation"
				bind:value={filters.hsl[activeHslColor].saturation}
				lock={isLocked}
			/>
			<Slider
				label="Luminance"
				bind:value={filters.hsl[activeHslColor].luminance}
				lock={isLocked}
			/>
		</Section>

		<!-- Lens Corrections -->
		<Section title="Lens" bind:isExpanded={expanded.lens}>
			<Slider label="Distortion" bind:value={filters.lens_corrections.distortion} lock={isLocked} />
			<Slider
				label="Chromatic Aberration"
				bind:value={filters.lens_corrections.chromatic_aberration}
				lock={isLocked}
			/>
			<Slider label="Vignetting" bind:value={filters.lens_corrections.vignetting} lock={isLocked} />
		</Section>

		<!-- Transform -->
		<Section title="Transform" bind:isExpanded={expanded.transform}>
			<Slider
				label="Rotate"
				bind:value={filters.transform.rotate}
				min={-180}
				max={180}
				lock={isLocked}
			/>
			<Slider label="Vertical" bind:value={filters.transform.vertical} lock={isLocked} />
			<Slider label="Horizontal" bind:value={filters.transform.horizontal} lock={isLocked} />
			<Slider label="Perspective" bind:value={filters.transform.perspective} lock={isLocked} />
		</Section>
	</div>
</div>
