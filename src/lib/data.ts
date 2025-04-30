import { KEYS } from "./constants";
import { notify } from "./globals.svelte";
import type { IList } from "./types";

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

export function find_list_by_url(url: string): IList | null {
	let lists = get_all_lists();
	for (let list of lists) {
		if (list.url === url) {
			return list;
		}
	}
	return null;
}

export function add_list(data: IList): IList[] {
	let lists = get_all_lists();
	lists.push(data);
	save_lists(lists);
	return lists;
}

export function delete_list(lists: IList[], list_to_delete: IList): IList[] {
	lists = lists.filter((e) => e !== list_to_delete);
	save_lists(lists);
	return lists;
}
