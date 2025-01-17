import { buildQueryString, fetch } from '../../../http/fetch';
import { SearchClient, SearchResponse } from './SearchClient';

// https://www.mediawiki.org/wiki/API:REST_API/Reference#Search_result_object
// Example: https://en.wikipedia.org/w/rest.php/v1/search/title?q=Jupiter&limit=5
export interface RestResponse {
	pages: RestResult[];
}

interface RestResult {
	id: number;
	key: string;
	title: string;
	description?: string;
	thumbnail?: RestThumbnail | null;
}

interface RestThumbnail {
	url: string;
	width?: number | null;
	height?: number | null;
}

function adaptApiResponse( query: string, restResponse: RestResponse ): SearchResponse {
	return {
		query,
		results:
			restResponse.pages
				.map( ( page ) => ( {
					id: page.id,
					key: page.key,
					title: page.title,
					description: page.description,
					thumbnail: page.thumbnail ? {
						url: page.thumbnail.url,
						width: page.thumbnail.width ?? undefined,
						height: page.thumbnail.height ?? undefined
					} : undefined
				} ) )
	};
}

// https://www.mediawiki.org/wiki/API:REST_API/Reference#Autocomplete_page_title
function fetchByTitle(
	query: string,
	domain: string,
	limit: number
): Promise<SearchResponse> {
	query = query.trim();
	if ( !query ) {
		return Promise.resolve( adaptApiResponse( query, { pages: [] } ) );
	}
	const params = {
		q: query,
		limit: limit
	};
	const headers = {
		accept: 'application/json'
	};

	const url = `//${domain}/w/rest.php/v1/search/title?${buildQueryString( params )}`;
	return fetch( url, { headers } )
		.then( ( response ) => response.json() )
		.then( ( response ) => adaptApiResponse( query, response ) );
}

export function restSearchClient(): SearchClient {
	return {
		fetchByTitle( query, domain, limit = 10 ) {
			return fetchByTitle( query, domain, limit );
		}
	};
}
