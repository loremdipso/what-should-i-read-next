export interface IList {
	title: string;
	items: string[];
}

export interface IResult {
	query: string;
	match?: string;
	books: IBook[];
}

export interface IBook {
	id: string;
	title: string;
	cover?: string;
	subtitle?: string;
	description?: string;
	subjects?: string;
	duration?: string;
	author: string;
	sample: string;
}
