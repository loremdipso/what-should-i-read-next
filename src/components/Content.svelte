<script lang="ts">
	import type { IBook, IList, IResult } from "../lib/types";
	import {
		add_list,
		delete_list,
		get_all_lists,
		get_libraries,
		save_libraries,
		save_lists,
	} from "../lib/data";
	import { find_books, shuffle, try_parse_list } from "../lib/utils";
	import { notify, install_prompt } from "../lib/globals.svelte";

	function reload() {
		lists = get_all_lists();
	}

	async function set_current_list(list: IList, force_reload = false) {
		results = null;
		current_list = list;
		collapsed = {};
		results = (
			await find_books(current_list.items, libraries, force_reload)
		).filter((e) => e.books.length);
	}

	let current_list = $state<IList | null>(null);
	let results = $state<IResult[] | null>(null);
	let lists = $state(get_all_lists());
	let collapsed = $state<{ [key: string]: boolean }>({});
	let libraries_raw = $state(get_libraries().join(", "));
	let libraries = $derived(
		libraries_raw.split(",").map((e) => e.trim().toLowerCase())
	);
	let installed = $state(false);

	$effect(() => {
		save_libraries(libraries);
	});
</script>

<main class="flex-col gap1">
	<div class="flex-row">
		<button
			class="green"
			onclick={async () => {
				current_list = null;
				const text = await navigator.clipboard.readText();
				try {
					let list = try_parse_list(text);
					notify("Loading...");
					add_list(list);
					reload();
				} catch (e) {
					console.error(e);
					notify("ERROR: that doesn't look like a list", "error");
				}
			}}
		>
			Copy from clipboard
		</button>
		<button
			id="install-button"
			class="purple"
			hidden={!install_prompt.prompt || installed}
			onclick={async () => {
				await install_prompt.prompt.prompt();
				installed = true;
			}}
		>
			Install
		</button>
	</div>

	<div class="scrollable pb5">
		<label class="grow">
			Libraries:
			<input class="grow" bind:value={libraries_raw} />
		</label>

		{#if current_list}
			<div class="card selectable black flex-col gap1">
				{#if results}
					{#if results.length}
						<div class="flex-row">
							<button
								onclick={async (event) => {
									event.stopPropagation();
									current_list = null;
								}}
							>
								Close
							</button>
							<button
								class="blue"
								onclick={async (event) => {
									event.stopPropagation();
									if (current_list) {
										set_current_list(current_list, true);
									}
								}}
							>
								Reload
							</button>
							<button
								class="purple"
								onclick={async (event) => {
									event.stopPropagation();
									if (results) {
										shuffle(results);
									}
								}}
							>
								Shuffle
							</button>
						</div>

						{#each results as result}
							<div class="m1">
								<div class="flex-row">
									<h2>
										{result.query}
									</h2>
									<button
										class="shrink"
										onclick={async (event) => {
											event.stopPropagation();
											collapsed[result.query] =
												!collapsed[result.query];
										}}
									>
										{#if collapsed[result.query]}
											Expand
										{:else}
											Collapse
										{/if}
									</button>
								</div>
								{#if !collapsed[result.query]}
									{#each result.books as book}
										<div class="black m1 purple">
											<h3 class="no-spacing">
												{book.title}
											</h3>
											<h4 class="no-spacing subtitle">
												{book.author}
											</h4>
											<h4 class="no-spacing subtitle">
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
								{/if}
							</div>
						{/each}
					{:else}
						<h3>No results :/</h3>
					{/if}
				{:else}
					<h3>Searching...</h3>
				{/if}
			</div>
		{/if}

		<div class="flex-col gap1">
			<div class="flex-col gap1">
				{#each lists as list}
					<div class="card selectable black m1 p1 flex-col">
						<div class="flex-row">
							<input
								class="grow flex-row p1"
								bind:value={list.title}
								onchange={() => {
									save_lists(lists);
								}}
							/>
							<button
								class="green shrink"
								onclick={async (event) => {
									event.stopPropagation();
									set_current_list(list);
								}}
							>
								Search
							</button>
						</div>
						<div class="right">
							{list.items.length} rows
						</div>
						<div class="flex-row space-around">
							<div class="flex-col">
								<button
									class="blue"
									onclick={async (event) => {
										event.stopPropagation();
										let new_list = structuredClone(
											$state.snapshot(list)
										);
										new_list.items.splice(10);
										set_current_list(new_list);
									}}
								>
									Search first 10
								</button>
								<button
									class="purple"
									onclick={async (event) => {
										event.stopPropagation();
										let new_list = structuredClone(
											$state.snapshot(list)
										);
										shuffle(new_list.items);
										new_list.items.splice(10);
										set_current_list(new_list);
									}}
								>
									Search random 10
								</button>
							</div>
							<button
								onclick={async () => {
									await navigator.clipboard.writeText(
										list.items.join("\n")
									);
									notify("Copied to clipboard :)");
								}}
							>
								Copy to clipboard
							</button>
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
						</div>
						<ul
							class="scrollable no-padding no-style flex-col gap1"
							style="max-height: 30vh"
						>
							{#each list.items as item}
								<li class="grey flex-row">
									<span class="grow p1">{item}</span>
									<button
										class="red shrink"
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
