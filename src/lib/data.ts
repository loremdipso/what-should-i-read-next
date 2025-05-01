import { KEYS } from "./constants";
import { notify } from "./globals.svelte";
import type { IList, IResult } from "./types";

export function get_libraries(): string[] {
	try {
		return JSON.parse(localStorage.getItem(KEYS.LIBRARIES) || "[]");
	} catch (e) {
		console.error(e);
		return [];
	}
}

export function save_libraries(libraries: string[]) {
	localStorage.setItem(KEYS.LIBRARIES, JSON.stringify(libraries));
}

export function get_all_lists(): IList[] {
	try {
		return JSON.parse(localStorage.getItem(KEYS.LISTS) || "[]");
	} catch (e) {
		console.error(e);
		return [];
	}
}

export function save_lists(lists: IList[]) {
	localStorage.setItem(KEYS.LISTS, JSON.stringify(lists));
}

export function add_list(data: IList): IList[] {
	let lists = get_all_lists();
	lists.splice(0, 0, data);
	save_lists(lists);
	return lists;
}

export function delete_list(lists: IList[], list_to_delete: IList): IList[] {
	lists = lists.filter((e) => e !== list_to_delete);
	save_lists(lists);
	return lists;
}

let overall_cache: IResult[] = JSON.parse(
	localStorage.getItem(KEYS.CACHE) || "[]"
);
export function get_cache(): IResult[] {
	return structuredClone(overall_cache);
	// try {
	// 	return JSON.parse(localStorage.getItem(KEYS.CACHE) || "[]");
	// } catch (e) {
	// 	console.error(e);
	// 	return [];
	// }
}

const max_cache_length = 150;
export function add_results_to_cache(results: IResult[]) {
	// Only keep the most result of these results
	for (let result of results) {
		let index: number = 0;
		while (
			(index = overall_cache.findIndex((e) => e.query === result.query)) >
			-1
		) {
			overall_cache.splice(index, 1);
		}

		overall_cache.push(result);
	}

	// Save the last n to browser storage
	const cache = [...results, ...get_cache()];
	cache.splice(max_cache_length);
	localStorage.setItem(KEYS.CACHE, JSON.stringify(cache));
}
