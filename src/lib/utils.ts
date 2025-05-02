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
	const cache = get_cache();
	let results = await Promise.all(
		items
			.map((e) => e.trim())
			.filter((e) => e.length)
			.map(async (item) => {
				let cache_value = cache.find((result) => result.query === item);
				if (cache_value && !force_reload) {
					console.info("hit the cache!");
					return cache_value;
				}

				let result: IResult = {
					query: item,
					books: await find_single_book(item, libraries),
					match: cache_value?.match,
				};
				return result;
			})
	);

	for (let result of results) {
		if (
			result.match &&
			!result.books.find((book) => book.title === result.match)
		) {
			result.match = undefined;
		}
	}

	add_results_to_cache(results);
	return results;
}

export async function find_single_book(
	query: string,
	libraries: string[]
): Promise<IBook[]> {
	console.info("didn't hit the cache :/");
	query = fix_query(query);
	let books = [];
	for (let library of libraries) {
		let url = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${query}&format=audiobook-overdrive,audiobook-mp3&page=1&perPage=20`;
		let response = await fetch(url);
		let json = await response.json();
		for (let item of json.items) {
			if (item.isAvailable) {
				console.log(item);
				let book: IBook = {
					id: item.id,
					title: item.title,
					subtitle: item.subtitle,
					description: item.description,
					cover: Object.values(item.covers || {}).map(
						(e: any) => e.href
					)[0] as any,
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

export function get_libby_url(query: string): string {
	return `https://libbyapp.com/search/spl/search/audiobooks/query-${fix_query(
		query
	)}/page-1`;
}
