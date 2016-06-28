const apart = require('apart');
const jsdom = require('jsdom');

const httpxUtils = require('./httpxUtils');

/**
 * Extracts structured information about a price
 * @param {string} priceStr	The unstructured price, e.g. "€ 12,50" or "+ € 3,75"
 * @return {object}	The structured price, e.g. {currency: "€", amount: 12.5} or {currency: "€", amount: 3.75}
 */
function extractPrice(priceStr) {
	var blankValue = {currency: null, amount: null};
	if (typeof priceStr !== 'string') {
		return blankValue;
	}
	
	var decimalSeparator = ','; // depends on the Rent Search API server's locale, so we may assume it's constant
	var priceRegex = new RegExp("^\\s*\\+?\\s*([^\\s\\d" + decimalSeparator + "])\\s*(\\d+)(?:" + decimalSeparator + "(\\d+))?$");
	var matches = priceRegex.exec(priceStr);
	
	if (!matches) {
		return blankValue;
	}
	
	var defaultDecimalSeparator = '.'; // separator which JS forces us to use with parseFloat()
	var currency = matches[1];
	var amount = parseFloat(matches[2] + defaultDecimalSeparator + (matches[3] || '00'));
	return {
		currency: currency,
		amount: amount
	};
}

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
			var searchResults;
			if (error || !window || !window.document) {
				console.error('An error occurred while parsing the content: ' + error);
				searchResults = {msg: "An error occurred while parsing the result of the search API: technical error while creating DOM document"};
			}
			else {
				var $ = window.$;
				var productDom = $('#product');
				
				try {
					// Get product name
					var name = $('h1.name', productDom).html().trim();
					
					// Get product price on first day and on subsequent days
					var priceTable = $('.price table', productDom);
					var priceFirstDay = $('tr th+th h3', priceTable).html().trim();
					var priceNonFirstDay = $('tr+tr td+td', priceTable).html().trim();
					
					searchResults = {
						name: name,
						price: {
							firstDay: extractPrice(priceFirstDay),
							nonFirstDay: extractPrice(priceNonFirstDay)
						}
					};
				}
				catch(e) {
					if (e instanceof TypeError) {
						// "Recoverable" error: we couldn't get the information where we expected it in the HTML: most likely, it means there are no results for this search
						searchResults = {msg: "Item not found"};
					}
					else {
						// Unexpected error
						console.error(e);
						searchResults = {msg: "An error occurred while parsing the result of the search API: technical error while navigating in DOM document"};
					}
				}
			}
			
			callback(searchResults);
		}
	);
}

/**
 * Sends the result of the search API to the client
 * @param {object} _	The request from the client to us
 * @param {object} res	The response object we'll send to the client
 * @param {object} htmlResult	The search result returned to us by the renting data server
 */
function respondWithSearchResult(_, res, searchResult) {
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(searchResult));
}

/**
 * Search feature for rented stuff
 * Runs an HTTP request to search, with a callback who's in charge of returning the data to the client
 */
function search(req, res, args) {
	const item = sanitize((req.params.item || '').toLowerCase());
	const url = args.rentSearchServer + "/p/" + item + "-huren?search=true&explanation=false";
	httpxUtils.getAndFollow(url, apart(parseSearchResult, apart(respondWithSearchResult, req, res)));
}

/**
 * Sanitizes a string for use in the Rent Search API, by replacing whitespace by "-"
 * @param {string} input	The string to sanitize
 * @return {string|*}	The sanitized string, or the unchanged input if it's not a string
 */
function sanitize(input) {
	return (typeof input === 'string') ? input.replace(/\s+/g, '-') : input;
}

exports.extractPrice = extractPrice;
exports.parseSearchResult = parseSearchResult;
exports.search = search;
