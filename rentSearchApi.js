const apart = require('apart');
const fdHttpRequest = require('fd-http-request');
const jsdom = require('jsdom');

/**
 * Parses the result of a rented object search
 * @param {function} callback	The function to call when the search results have been parsed; this function must take a single argument, in which the parsed information will be passed
 * @param {object} httpResponse	The HTTP response of the search
 *		@subparam {string} httpResponse.data	The content of the HTTP response
 */
function parseSearchResult(callback, httpResponse) {
	// TODO more error-checking in this method (httpResponse can have a 5xx HTTP code, response can be well-formed HTML but not have the expected content, etc.)
	jsdom.env(
		httpResponse.data,
		["http://code.jquery.com/jquery.js"],
		function (error, window) {
			if (error) {
				console.error('An error occurred while parsing the content'); // TODO also return an error to the client
			}
			else {
				var $ = window.$;
				var productDom = $('#product');
				
				// Get product name
				var name = $('h1.name', productDom).html().trim();
				
				// Get product price on first day and on subsequent days
				var priceTable = $('.price table', productDom);
				var priceFirstDay = $('tr th+th h3', priceTable).html().trim();
				var priceNonFirstDay = $('tr+tr td+td', priceTable).html().trim();
				
				var searchResults = {
					name: name,
					price: {
						firstDay: priceFirstDay,
						nonFirstDay: priceNonFirstDay
					}
				};
				
				callback(searchResults);
			}
		}
	);
}

/**
 * Processes the result of the rent search result,
 * and returns the processed information to the client
 * @param {object} _	The request from the client to us
 * @param {object} res	The response object we'll send to the client
 * @param {object} htmlResult	The search result returned to us by the renting data server
 */
function respondWithSearchResult(_, res, searchResult) {
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(searchResult));
}



/**
 * Search feature for rented stuff
 * Runs an HTTP request to search, with a callback who's in charge of returning the data to the client
 */
function search(req, res, args) {
	const item = req.params.item;
	const url = args.rentSearchServer + "/p/" + item + "-huren?search=true&explanation=false";
	fdHttpRequest.get(url, apart(parseSearchResult, apart(respondWithSearchResult, req, res)));
}

exports.parseSearchResult = parseSearchResult;
exports.search = search;
