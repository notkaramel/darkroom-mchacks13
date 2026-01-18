<script lang="ts">
	import Slider from 'components/editing/Slider.svelte';
	import Section from 'components/editing/Section.svelte';

	// Bindable prop to allow two-way state update with the parent
	let { filters = $bindable(), image = null } = $props();

	// Determine if sliders should be locked (no image loaded)
	const isLocked = $derived(!image);

	type HslColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

	// State for currently selected HSL color channel
	let activeHslColor = $state<HslColorKey>('red');

	// State for collapsible sections
	let expanded = $state({
		basic: true,
		color: true,
		hsl: true
	});

	const hslColors = [
		{ name: 'red', color: 'bg-red-500' },
		{ name: 'orange', color: 'bg-orange-500' },
		{ name: 'yellow', color: 'bg-yellow-400' },
		{ name: 'green', color: 'bg-green-500' },
		{ name: 'cyan', color: 'bg-cyan-400' },
		{ name: 'blue', color: 'bg-blue-500' },
		{ name: 'purple', color: 'bg-purple-500' },
		{ name: 'magenta', color: 'bg-pink-500' }
	] as const;

	// Function to reset all filters to their default neutral values
	function reset() {
		filters = {
			basic: { brightness: 0, contrast: 0, highlight: 0, shadow: 0 },
			color: { temperature: 0, tint: 0, vibrance: 0, saturation: 0 },
			hsl: {
				red: { hue: 0, saturation: 0, luminance: 0 },
				orange: { hue: 0, saturation: 0, luminance: 0 },
				yellow: { hue: 0, saturation: 0, luminance: 0 },
				green: { hue: 0, saturation: 0, luminance: 0 },
				cyan: { hue: 0, saturation: 0, luminance: 0 },
				blue: { hue: 0, saturation: 0, luminance: 0 },
				purple: { hue: 0, saturation: 0, luminance: 0 },
				magenta: { hue: 0, saturation: 0, luminance: 0 }
			},
			lens_corrections: { distortion: 0, chromatic_aberration: 0, vignetting: 0 },
			transform: { rotate: 0, vertical: 0, horizontal: 0, perspective: 0 }
		};
	}

	// Auto-reset filters when image changes or becomes null
	$effect(() => {
		// This will re-run whenever `image` changes
		image; // Reference image to track it
		reset();
	});
</script>

<div
	class="custom-scrollbar flex h-full flex-col overflow-y-auto bg-zinc-900/50 p-6 backdrop-blur-xl"
>
	<!-- Header with Reset Button -->
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Adjustments</h2>
		<button
			onclick={reset}
			class="text-xs font-medium text-zinc-500 transition-colors hover:text-white"
		>
			Reset All
		</button>
	</div>

	<!-- Sliders Container -->
	<div class="space-y-6 pb-10">
		<!-- Basic Section -->
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

		<!-- Color Section -->
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

		<!-- HSL Section -->
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
			<Slider label="Saturation" bind:value={filters.hsl[activeHslColor].saturation} lock={isLocked} />
			<Slider label="Luminance" bind:value={filters.hsl[activeHslColor].luminance} lock={isLocked} />
		</Section>
	</div>
</div>
