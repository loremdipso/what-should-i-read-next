<script lang="ts">
	import type { IBook, IList, IResult } from "../lib/types";
	import {
		add_list,
		add_results_to_cache,
		clear_cache,
		delete_list,
		get_all_lists,
		get_libraries,
		save_libraries,
		save_lists,
	} from "../lib/data";
	import {
		find_books,
		fix_query,
		get_libby_url,
		shuffle,
		try_parse_list,
	} from "../lib/utils";
	import { notify, install_prompt } from "../lib/globals.svelte";
	import SlideCheck from "./SlideCheck.svelte";

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
			onclick={async () => {
				clear_cache();
			}}
		>
			Clear cache
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
						{#if results.length}
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
						{/if}
					</div>

					{#if results.length}
						{#each results as result}
							<div class="m1 flex-col gap1">
								<div class="flex-row center">
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
									<div class="flex-row right">
										<a
											href={get_libby_url(result.query)}
											target="_blank"
										>
											Open search in libby
										</a>
									</div>
									{#each result.books as book}
										{#if !result.match || book.title === result.match}
											<div class="black p1 purple">
												<div class="flex-row gap1">
													{#if book.cover}
														<img
															src={book.cover}
															alt="Cover"
														/>
													{/if}
													<div class="grow">
														<h3 class="no-spacing">
															{book.title}
														</h3>
														{#if book.author}
															<h4
																class="no-spacing subtitle"
															>
																{book.author}
															</h4>
														{/if}
														{#if book.duration}
															<h6
																class="no-spacing subtitle"
															>
																Duration {book.duration}
															</h6>
														{/if}
													</div>
												</div>
												{#if book.subtitle}
													<hr />
													<h4
														class="no-spacing subtitle"
													>
														{book.subtitle}
													</h4>
												{/if}
												{#if book.description}
													<hr />
													<p
														class="no-spacing subtitle description"
													>
														{@html book.description}
													</p>
												{/if}
												{#if book.subjects}
													<hr />
													<h6
														class="no-spacing subtitle"
													>
														{book.subjects}
													</h6>
												{/if}
												<SlideCheck
													text="This is the match"
													onchange={(checked) => {
														if (checked) {
															result.match =
																book.title;
														} else {
															result.match =
																undefined;
														}
														add_results_to_cache([
															$state.snapshot(
																result
															),
														]);
													}}
													checked={Boolean(
														book.title &&
															book.title ===
																result.match
													)}
												/>
												<div class="flex-row">
													<a
														href={book.sample}
														target="_blank"
													>
														sample
													</a>
													<a
														href={get_libby_url(
															book.title
														)}
														target="_blank"
													>
														Open search in libby
													</a>
												</div>
											</div>
										{/if}
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
							<!-- <button
								class="green shrink"
								onclick={async (event) => {
									event.stopPropagation();
									set_current_list(list);
								}}
							>
								Search
							</button> -->
						</div>
						<div class="right">
							{list.items.length} rows
						</div>
						<div class="flex-row gap0_5">
							<div class="flex-col grow gap0_5">
								<button
									class="green p0_5"
									onclick={async (event) => {
										event.stopPropagation();
										set_current_list(list);
									}}
								>
									Search all
								</button>
								<button
									class="blue p0_5"
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
									class="purple p0_5"
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
							<div class="flex-col grow gap0_5">
								<button
									class="p0_5"
									onclick={async () => {
										await navigator.clipboard.writeText(
											list.items.join("\n")
										);
										notify("Copied to clipboard :)");
									}}
								>
									Copy list to clipboard
								</button>
								<button
									class="red p0_5"
									onclick={async (event) => {
										event.stopPropagation();
										delete_list(lists, list);
										reload();
									}}
								>
									Delete list
								</button>
							</div>
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
