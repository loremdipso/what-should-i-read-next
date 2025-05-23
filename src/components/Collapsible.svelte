<script lang="ts">
	import DownChevron from "../lib/icons/down_chevron.svelte";
	import UpChevron from "../lib/icons/up_chevron.svelte";
	import { type Snippet } from "svelte";
	import { slide } from "svelte/transition";

	let {
		title,
		content,
		prefix,
		collapsed = $bindable(true),
		skip_initial_animation,
	} = $props<{
		title: string;
		prefix: Snippet;
		content: Snippet;
		collapsed?: boolean;
		skip_initial_animation?: boolean;
	}>();

	let duration = $derived(skip_initial_animation ? 0 : 400);
</script>

<div class="flex-col">
	<button
		class="black flex-row vertically-centered left gap1"
		onclick={(event) => {
			event.stopPropagation();
			skip_initial_animation = false;
			collapsed = !collapsed;
		}}
	>
		{#if prefix}
			<div>
				{@render prefix()}
			</div>
		{/if}

		<h2 class="grow">{title}</h2>

		{#if !collapsed}
			<UpChevron />
		{:else}
			<DownChevron />
		{/if}
	</button>

	{#if !collapsed}
		<div transition:slide={{ duration }}>
			{@render content()}
		</div>
	{/if}
</div>
