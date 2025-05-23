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
		get_libby_url,
		shuffle,
		try_parse_list,
	} from "../lib/utils";
	import { notify, install_prompt } from "../lib/globals.svelte";
	import SlideCheck from "./SlideCheck.svelte";
	import { onMount } from "svelte";
	import Collapsible from "./Collapsible.svelte";
	import CloseIcon from "../lib/icons/close_icon.svelte";
	import ShuffleIcon from "../lib/icons/shuffle_icon.svelte";
	import ReloadIcon from "../lib/icons/reload_icon.svelte";
	import TrashCanIcon from "../lib/icons/trash_can_icon.svelte";

	function reload() {
		lists = get_all_lists();
	}

	async function set_current_list(list: IList, force_reload = false) {
		results = undefined;
		current_list = list;
		results = (
			await find_books(current_list.items, libraries, force_reload)
		).filter((e) => e.books.length);
	}

	let filters = $state({ only_matches: false, only_non_matches: false });
	let current_list = $state<IList | null>(null);
	let results = $state<IResult[] | undefined>(undefined);
	let filtered_results = $derived(
		results
			?.map((result) => {
				let new_books = result.books.filter((book) => {
					if (filters.only_matches) {
						return result.match && book.title === result.match;
					} else if (filters.only_non_matches) {
						return !result.match;
					} else {
						return !result.match || book.title === result.match;
					}
				});

				return {
					...result,
					books: new_books,
				};
			})
			.filter((result) => result.books.length)
	);
	let lists = $state(get_all_lists());
	let libraries_raw = $state(get_libraries().join(", "));
	let libraries = $derived(
		libraries_raw
			.split(",")
			.map((e) => e.trim().toLowerCase())
			.filter((e) => e.length)
	);
	let installed = $state(false);

	function update_result(new_result: IResult) {
		if (results && new_result.query) {
			for (let i = 0; i < results.length; i++) {
				if (new_result.query === results[i].query) {
					results[i] = { ...new_result };
					add_results_to_cache([$state.snapshot(new_result)]);
				}
			}
		}
	}

	$effect(() => {
		save_libraries(libraries);
	});

	// onMount(() => {
	// 	let new_list = structuredClone($state.snapshot(lists[0]));
	// 	new_list.items.splice(10);
	// 	set_current_list(new_list);
	// });
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

	<div class="scrollable flex-col gap1 pb5">
		<div class="black p1 rounded">
			<label class="grow flex-row gap1">
				Libraries:
				<input class="grow" bind:value={libraries_raw} />
			</label>
		</div>

		{#if current_list}
			<div class="card selectable gray flex-col gap1">
				{#if results}
					<div class="flex-row">
						<button
							class="blue vertically-centered gap0_5 flex-row justify-center"
							onclick={async (event) => {
								event.stopPropagation();
								if (current_list) {
									set_current_list(current_list, true);
								}
							}}
						>
							<ReloadIcon />
							Reload
						</button>
						{#if results.length}
							<button
								class="purple vertically-centered gap0_5 flex-row justify-center"
								onclick={async (event) => {
									event.stopPropagation();
									if (results) {
										shuffle(results);
									}
								}}
							>
								<ShuffleIcon />
								Shuffle
							</button>
						{/if}
						<button
							class="vertically-centered gap0_5 flex-row justify-center"
							onclick={async (event) => {
								event.stopPropagation();
								current_list = null;
							}}
						>
							<CloseIcon />
							Close
						</button>
					</div>

					<div class="flex-col gap1">
						<SlideCheck
							text="Only matches"
							onchange={(checked) => {
								filters.only_matches = checked;
								filters.only_non_matches = false;
							}}
							checked={filters.only_matches}
						/>
						<SlideCheck
							text="Only non-matches"
							onchange={(checked) => {
								filters.only_non_matches = checked;
								filters.only_matches = false;
							}}
							checked={filters.only_non_matches}
						/>
					</div>

					{#if filtered_results?.length}
						{#each filtered_results as result}
							<Collapsible title={result.query} collapsed={false}>
								{#snippet prefix()}
									<!-- <div class="flex-row right">
										<a
											href={get_libby_url(result.query)}
											target="_blank"
										>
											Open search in libby
										</a>
									</div> -->
									<div class="shrink flex-col gap0_5">
										<button
											class="red flex-row vertically-centered gap0_5 rounded"
											onclick={async (event) => {
												event.stopPropagation();
												if (result.query) {
													results = results?.filter(
														(some_result) => {
															return (
																result.query !==
																some_result.query
															);
														}
													);
													current_list!.items =
														current_list!.items.filter(
															(item) =>
																item !==
																result.query
														);
													// TODO: add a list id
													for (let list of lists) {
														list.items =
															list.items.filter(
																(item) =>
																	item !==
																	result.query
															);
													}
													save_lists(lists);
												}
											}}
										>
											<TrashCanIcon />
											Delete
										</button>
									</div>
								{/snippet}

								{#snippet content()}
									<div class="black">
										<div class="ph1 flex-col gap0_5">
											{#each result.books as book (book)}
												<div
													class="rounded lightgray p1 mw1"
												>
													<div class="flex-row gap1">
														{#if book.cover}
															<img
																src={book.cover}
																alt="Cover"
															/>
														{/if}
														<div class="grow">
															<h3
																class="no-spacing"
															>
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
																	Duration: {book.duration}
																</h6>
															{/if}
															<div class="ph1">
																<SlideCheck
																	text="This is the match"
																	onchange={(
																		checked
																	) => {
																		update_result(
																			{
																				...result,
																				match: checked
																					? book.title
																					: undefined,
																			}
																		);
																	}}
																	checked={Boolean(
																		book.title &&
																			book.title ===
																				result.match
																	)}
																/>
															</div>
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
											{/each}
										</div>
									</div>
								{/snippet}
							</Collapsible>
						{/each}
					{:else}
						<h3>No results :/</h3>
					{/if}
				{:else}
					<h3>Searching...</h3>
				{/if}
			</div>
		{:else}
			<div class="flex-col gap1 mt1">
				<div class="full-width flex-row center">
					<button
						class="green"
						onclick={() => {
							add_list({ items: [], title: "New list" });
							reload();
						}}
					>
						Add new list
					</button>
				</div>
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
									class="p0_5"
									onclick={async () => {
										await navigator.clipboard.writeText(
											list.items.join("\n")
										);
										notify("Copied to clipboard :)");
									}}
									disabled={!list.items.length}
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
							<div class="flex-col grow gap0_5">
								<button
									class="green p0_5"
									onclick={async (event) => {
										event.stopPropagation();
										set_current_list(list);
									}}
									disabled={!libraries.length}
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
									disabled={!libraries.length}
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
									disabled={!libraries.length}
								>
									Search random 10
								</button>
							</div>
						</div>
						<ul
							class="scrollable no-padding no-style flex-col gap1"
							style="max-height: 30vh"
						>
							{#each list.items as item, i}
								<li class="grey flex-row">
									<input
										class="grow"
										bind:value={list.items[i]}
										onkeydown={(event) => {
											if (event.key === "Enter") {
												list.items.push("");
											}
										}}
										onchange={() => {
											save_lists(lists);
										}}
									/>
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
						<button
							class="green"
							onclick={(event) => {
								event.stopPropagation();
								list.items.push("");
							}}
						>
							Add item
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>
