export interface IList {
	title: string;
	items: string[];
}

export interface IBook {
	title: string;
	subtitle: string;
	author: string;
	sample: string;
}

export interface IResult {
	query: string;
	books: IBook[];
}
