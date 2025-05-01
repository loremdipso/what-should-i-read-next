export interface IList {
	title: string;
	items: string[];
}

export interface IBook {
	title: string;
	subtitle?: string;
	description?: string;
	subjects?: string;
	duration?: string;
	author: string;
	sample: string;
}

export interface IResult {
	query: string;
	books: IBook[];
}
