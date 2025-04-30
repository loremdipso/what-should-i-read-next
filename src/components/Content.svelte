<script lang="ts">
	import { writable } from "svelte/store";
	import type { IBook, IList, IResult } from "../lib/types";
	import {
		add_list,
		delete_list,
		get_all_lists,
		get_libraries,
		save_libraries,
		save_lists,
	} from "../lib/data";
	import { find_books, try_parse_list } from "../lib/utils";
	import { notify } from "../lib/globals.svelte";

	let installPrompt = $state<any>(null);
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		installPrompt = event;
	});

	function reload() {
		lists = get_all_lists();
	}

	async function set_current_list(list: IList) {
		current_list = list;
		results = await find_books(current_list.items, libraries);
	}

	let current_list = $state<IList | null>(null);
	let results = $state<IResult[] | null>(null);
	let lists = $state(get_all_lists());
	let libraries_raw = $state(get_libraries().join(", "));
	let libraries = $derived(
		libraries_raw.split(",").map((e) => e.trim().toLowerCase())
	);

	$effect(() => {
		save_libraries(libraries);
	});
</script>

<main>
	<div class="flex-row">
		<button
			class="green"
			onclick={async () => {
				const items = await navigator.clipboard.read();
				for (const item of items) {
					for (const type of item.types) {
						const blob = await item.getType(type);
						const text = await blob.text();
						current_list = null;
						try {
							let list = try_parse_list(text);
							notify("Loading...");
							add_list(list);
							reload();
							current_list = list;
						} catch (e) {
							console.error(e);
							notify(
								"ERROR: that doesn't look like a list",
								"error"
							);
						}

						return;
					}
				}
			}}
		>
			Copy from clipboard
		</button>
		<button
			class="blue"
			disabled={!current_list}
			onclick={async () => {
				if (current_list) {
					await navigator.clipboard.writeText(
						current_list.items.join("\n")
					);
					notify("Copied markdown to clipboard :)");
				}
			}}
		>
			Copy to clipboard
		</button>

		<button
			id="install-button"
			class="purple"
			hidden={!installPrompt}
			onclick={async () => {
				await installPrompt.prompt();
				installPrompt = null;
			}}
		>
			Install
		</button>
	</div>

	<label class="full-width grow">
		Libraries:
		<input class="grow" bind:value={libraries_raw} />
	</label>

	<div class="output">
		{#if current_list}
			<div class="card selectable black flex-col gap1">
				{#if results}
					<button
						class="blue"
						onclick={async (event) => {
							event.stopPropagation();
							if (current_list) {
								set_current_list(current_list);
							}
						}}
					>
						Reload
					</button>

					{#each results as result}
						{#if result.books.length}
							<div class="m1">
								<h2>
									{result.query}
								</h2>
								{#each result.books as book}
									<div class="black m1 purple">
										<h3>{book.title}</h3>
										<h4 class="subtitle">{book.author}</h4>
										<h4 class="subtitle">
											{book.subtitle}
										</h4>
										<a
											href={book.sample}
											target="_blank"
											class="block-center"
										>
											sample
										</a>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				{:else}
					Searching...
				{/if}
			</div>
		{/if}

		<div class="flex-col gap1">
			<div class="flex-col gap1">
				{#each lists as list}
					<div
						class="card selectable black m1 p1"
						role="button"
						tabindex="0"
						onclick={(event) => {
							event.stopPropagation();
							set_current_list(list);
						}}
						onkeypress={(event) => {
							// TODO
						}}
					>
						<div class="flex-row space-around">
							<h3 class="grow">
								{list.title}
							</h3>
							<button
								class="red"
								onclick={async (event) => {
									event.stopPropagation();
									delete_list(lists, list);
									reload();
								}}
							>
								Delete
							</button>
							<button
								class="green"
								onclick={async (event) => {
									event.stopPropagation();
									set_current_list(list);
								}}
							>
								Search
							</button>
						</div>
						<ul
							class="scrollable no-padding no-style flex-col gap1"
						>
							{#each list.items as item}
								<li class="grey">
									{item}
									<button
										class="red"
										onclick={async (event) => {
											event.stopPropagation();
											let index =
												list.items.indexOf(item);
											if (index >= 0) {
												list.items.splice(index, 1);
												save_lists(lists);
												reload();
											}
										}}
									>
										Delete
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>
