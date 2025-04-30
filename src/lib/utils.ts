import type { IBook, IList, IResult } from "./types";

export function try_parse_list(text: string): IList {
	try {
		let contents = JSON.parse(text);
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
	libraries: string[]
): Promise<IResult[]> {
	return Promise.all(
		items.map(async (item) => ({
			query: item,
			books: await find_single_book(item, libraries),
		}))
	);
}

export async function find_single_book(
	query: string,
	libraries: string[]
): Promise<IBook[]> {
	query = query
		.replaceAll(/,.*/g, "")
		.replaceAll(/ by .*/g, "")
		.toLowerCase();
	let books = [];
	for (let library of libraries) {
		let url = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${query}&format=audiobook-overdrive,audiobook-mp3&page=1&perPage=20`;
		let response = await fetch(url);
		let json = await response.json();
		for (let item of json.items) {
			if (item.isAvailable) {
				let book: IBook = {
					// id: item.id,
					title: item.title,
					subtitle: item.subtitle,
					author: item.firstCreatorName,
					sample: item.sample.href,
				};
				books.push(book);
			}
		}
	}

	return books;
}
