/**
 * Represents one result of the Amazon Search API
 */
var AmazonSearchResult = React.createClass({
	
	render: function() {
		return React.createElement(
			'div',
			null,
			React.createElement('h2', null, this.props.ItemAttributes.Title),
			React.createElement('a', {href: this.props.DetailPageURL}, 'See details')
		);
	}
	
});

/**
 * List of results of the Amazon Search API
 */
var ListAmazonSearchResults = React.createClass({
	
	render: function() {
		if (this.props.results !== null) {
			var results = this.props.results;
			
			// No results, or there was a problem in the Amazon API call
			if (results.metaApiStatus !== 0 || !results.apiResponse || !results.apiResponse.Items.Item) {
				var msg;
				if (results.metaApiStatus !== 0) {
					msg = results.metaApiMessage || 'An unknown error occurred during the call to the Amazon API (sorry, that\'s vague but we have no additional information)';
				}
				else {
					msg = "No results were found";
				}
				
				return React.createElement('div', {className: 'search-api-message'}, msg);
			}
			
			// Found results: display them
			return React.createElement(
				'div',
				null,
				results.apiResponse.Items.Item.map(function(item, index) {
					return React.createElement(AmazonSearchResult, item);
				})
			);
		}
		
		// Nothing to display yet (initial state)
		return React.createElement('div', null);
	}
	
});

/**
 * Represents one result of the Rent Search API
 */
var RentSearchResult = React.createClass({
	
	render: function() {
		var priceForFirstDayText = 'Price for first day: ' + this.props.price.firstDay.currency + ' ' + this.props.price.firstDay.amount;
		var priceForNonFirstDayText = 'Price for each subsequent day: ' + this.props.price.nonFirstDay.currency + ' ' + this.props.price.nonFirstDay.amount;
		return React.createElement(
			'div',
			null,
			React.createElement('h2', null, this.props.name),
			React.createElement('span', null, priceForFirstDayText),
			React.createElement('br'),
			React.createElement('span', null, priceForNonFirstDayText)
		);
	}
	
});

/**
 * List of results of the Rent Search API
 * Actually, for the moment this list only handles one item (limitation of our API)
 * but, for better scalability, 2 distinct React components have been created for (1) the list
 * of results and for (2) each individual result
 */
var ListRentSearchResults = React.createClass({
	
	render: function() {
		if (this.props.results) {
			var results = this.props.results;
			
			// No results for search, or malformed API response
			if (! (results.name && results.price)) {
				var msg = results.msg || 'An error occurred while searching';
				return React.createElement('div', {className: 'search-api-message'}, msg);
			}
			
			// Found results: display them
			return React.createElement(
				'div',
				null,
				React.createElement(RentSearchResult, results)
			);
		}
		
		// Nothing to display yet (initial state)
		return React.createElement('div', null);
	}
});

/**
 * The search form
 */
var SearchForm = React.createClass({
	
	/**
	 * Searches the desired item
	 */
	searchItem: function(evt) {
		evt.preventDefault();
		var item = $('#searchedItemInput')[0].value;
		
		// Call Rent Search API
		var fullRentApiUrl = this.props.rentApiUrl + item;
		$.ajax({
			url: fullRentApiUrl,
			success: function(data) {
				// Trigger refresh from StuffFinder
				this.props.updateRentSearchResults(data);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(fullRentApiUrl, status, err.toString());
			}.bind(this)
		});
		
		// Call Amazon Meta-API (extra layer of security)
		var fullAmazonApiUrl = globalConfig.metaApiServer + "/meta_api/ajax.php";
		$.ajax({
			url: fullAmazonApiUrl,
			data: {
				password: globalConfig.metaApiPassword,
				api: 'amazon',
				SearchIndex: 'All',
				Keywords: encodeURIComponent(item)
			},
			success: function(data) {
				// Trigger refresh from StuffFinder
				this.props.updateAmazonSearchResults(data);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(fullAmazonApiUrl, status, err.toString());
			}.bind(this)
		});
	},
	
	render: function() {
		return React.createElement(
			'form',
			{onSubmit: this.searchItem},
			React.createElement('label', {htmlFor: 'searchedItemInput'}, 'Desired item:'),
			React.createElement('input', {type: 'text', name: 'searchedItem', id: 'searchedItemInput'}),
			React.createElement('input', {type: 'submit', value: 'Search'})
		);
	}
});

/**
 * Root component of the application
 */
var StuffFinder = React.createClass({
	
	getInitialState: function() {
		return {
			rentSearchResults: null,
			amazonSearchResults: null
		};
	},
	
	/**
	 * Triggers an update of the ListRentSearchResults component
	 * @param {object} rentSearchResults	The new search results
	 */
	updateRentSearchResults: function(rentSearchResults) {
		this.setState({rentSearchResults: rentSearchResults});
	},
	
	/**
	 * Triggers an update of the ListAmazonSearchResults component
	 * @param {object} amazonSearchResults	The new search results
	 */
	updateAmazonSearchResults: function(amazonSearchResults) {
		this.setState({amazonSearchResults: amazonSearchResults});
	},
	
	render: function() {
		return React.createElement(
			'div',
			null,
			React.createElement(
				SearchForm,
				{
					rentApiUrl: '/search/',
					updateRentSearchResults: this.updateRentSearchResults.bind(this),
					updateAmazonSearchResults: this.updateAmazonSearchResults.bind(this)
				}
			),
			React.createElement(
				ListRentSearchResults,
				{
					results: this.state.rentSearchResults
				}
			),
			React.createElement(
				ListAmazonSearchResults,
				{
					results: this.state.amazonSearchResults
				}
			)
		);
	}
});

ReactDOM.render(
	React.createElement(StuffFinder, null),
	document.getElementById('content')
);