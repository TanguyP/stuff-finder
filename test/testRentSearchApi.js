const apart = require('apart');
const fs = require('fs');
const path = require('path');

const rentSearchApi = require('../rentSearchApi');

exports.testExtractPrice = function(test) {
	test.expect(8);
	
	// Normal cases
	test.deepEqual(rentSearchApi.extractPrice('€ 12,50'), {currency: '€', amount: 12.5});
	test.deepEqual(rentSearchApi.extractPrice('   €   12,50'), {currency: '€', amount: 12.5});
	test.deepEqual(rentSearchApi.extractPrice('F 12,00'), {currency: 'F', amount: 12.0});
	test.deepEqual(rentSearchApi.extractPrice('€12'), {currency: '€', amount: 12.0});
	
	// Wrong input
	var blankValue = {currency: null, amount: null};
	test.deepEqual(rentSearchApi.extractPrice('12,50'), blankValue); // missing currency
	test.deepEqual(rentSearchApi.extractPrice('€ 12.50'), blankValue); // wrong decimal separator
	test.deepEqual(rentSearchApi.extractPrice('imuouiore'), blankValue); // completely wrong input
	test.deepEqual(rentSearchApi.extractPrice(null), blankValue); // test robustness
	
	test.done();
};

/**
 * @param {object} test	The nodeunit test object
 * @param {object?} err	Any potential error that may have occurred while reading the test resource file
 * @param {string} data	The contents of the test resource file, if reading it was successful
 */
function actualTestProcessSearchResult(test, err, data) {
	if (err) {
		test.done();
		throw err;
	}
	
	// Due to htmlparser2's async nature, our search result parser itself is async, so we need to pass it a callback which contains the test's assertions
	var parseSearchResultCallback = function(test, searchResults) {
		test.strictEqual(searchResults.name, 'Statafel huren');
		test.deepEqual(searchResults.price.firstDay, {currency: "€", amount: 12.5});
		test.deepEqual(searchResults.price.nonFirstDay, {currency: "€", amount: 3.75});
		test.done();
	}
	
	const searchResults = rentSearchApi.parseSearchResult(
		apart(parseSearchResultCallback, test),
		{data: data} // fake HTTP response
	);
}

exports.testProcessSearchResult = function(test) {
	test.expect(3); // assertions are in the parseSearchResultCallback() function
	const mockHtmlFilePath = path.resolve(__dirname, 'resources', 'rentSearchResult.html');
	fs.readFile(mockHtmlFilePath, 'utf8', apart(actualTestProcessSearchResult, test));
};
