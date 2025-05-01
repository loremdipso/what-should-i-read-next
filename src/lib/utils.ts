import { add_results_to_cache, get_cache } from "./data";
import type { IBook, IList, IResult } from "./types";

export function try_parse_list(text: string): IList {
	try {
		let contents = JSON.parse(text.replaceAll(`\\"`, `\"`));
		if (contents instanceof Array) {
			if (!contents.find((e) => e instanceof String)) {
				return {
					title: "<Unknown title>",
					items: contents,
				};
			}
		}
	} catch (e) {
		console.error(e);
	}

	return {
		title: "<Unknown title>",
		items: text.split("\n"),
	};
}

export async function find_books(
	items: string[],
	libraries: string[],
	force_reload: boolean
): Promise<IResult[]> {
	const cache = force_reload ? [] : get_cache();
	let results = await Promise.all(
		items.map(async (item) => ({
			query: item,
			books: await find_single_book(cache, item, libraries),
		}))
	);
	add_results_to_cache(results);
	return results;
}

export async function find_single_book(
	cache: IResult[],
	query: string,
	libraries: string[]
): Promise<IBook[]> {
	for (const result of cache) {
		if (result.query == query) {
			console.info("hit the cache!");
			return result.books;
		}
	}

	console.info("didn't hit the cache :/");
	query = fix_query(query);
	let books = [];
	for (let library of libraries) {
		let url = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${query}&format=audiobook-overdrive,audiobook-mp3&page=1&perPage=20`;
		let response = await fetch(url);
		let json = await response.json();
		for (let item of json.items) {
			if (item.isAvailable) {
				let book: IBook = {
					title: item.title,
					subtitle: item.subtitle,
					description: item.description,
					subjects: (item.subjects || [])
						.map((e: any) => e.name)
						.join(", "),
					duration: (item.formats || []).map(
						(e: any) => e.duration
					)[0],
					author: item.firstCreatorName,
					sample: item.sample.href,
				};
				books.push(book);
			}
		}
	}

	return books;
}

export function shuffle<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		// Generate random index
		const j = Math.floor(Math.random() * (i + 1));

		// Swap elements at indices i and j
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

export function fix_query(query: string): string {
	return query
		.replaceAll(/,.*/g, "")
		.replaceAll(/ by .*/g, "")
		.toLowerCase();
}
