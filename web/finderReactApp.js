/**
 * Represents one result of the Amazon Search API
 */
var AmazonSearchResult = React.createClass({
	
	render: function() {
		return React.createElement(
			'li',
			{className: 'amazon-search-result'},
			React.createElement('h3', null, this.props.ItemAttributes.Title),
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
			var className = '';
			var children = [];
			
			if (results.metaApiStatus !== 0 || !results.apiResponse || !results.apiResponse.Items.Item) {
				// No results, or there was a problem in the Amazon API call
				var msg;
				if (results.metaApiStatus !== 0) {
					msg = results.metaApiMessage || 'An unknown error occurred during the call to the Amazon API (sorry, that\'s vague but we have no additional information)';
				}
				else {
					msg = "No results were found.";
				}
				
				children = React.createElement('span', {className: 'error-or-no-results'}, msg);
			}
			else {
				// Found results: display them
				children = React.createElement(
					'ul',
					null,
					results.apiResponse.Items.Item.map(function(item, index) {
						return React.createElement(AmazonSearchResult, item);
					})
				);
			}
			
			return React.createElement(
				'div',
				{className: 'list-amazon-search-results'},
				React.createElement('h2', null, 'Buy it on Amazon'),
				children
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
			'li',
			{className: 'rent-search-result'},
			React.createElement('h3', null, this.props.name),
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
			var className = '';
			var children = [];
			
			if (! (results.name && results.price)) {
				// No results for search, or malformed API response
				var msg = results.msg || 'An error occurred while searching.';
				children = React.createElement('span', {className: 'error-or-no-results'}, msg);
			}
			else {
				// Found results: display them
				children = [
					React.createElement('h2', null, 'Rent it from us'),
					React.createElement(
						'ul',
						null,
						React.createElement(RentSearchResult, results)
					)
				];
			}
			
			return React.createElement(
				'div',
				{className: 'list-rent-search-results'},
				children
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
	 * Returns the form's data if it is valid, false otherwise
	 * (that way the caller does not need to retrieve the form's data from
	 * the DOM again)
	 * @param {object|boolean}
	 */
	validateFormData: function() {
		var itemInput = $('#searchedItemInput');
		if (! (itemInput && itemInput[0] && itemInput[0].value)) {
			return false;
		}
		return {
			item: itemInput[0].value
		};
		
	},
	
	/**
	 * Searches the desired item
	 */
	searchItem: function(evt) {
		evt.preventDefault();
		var formData = this.validateFormData();
		if (formData === false) {
			alert('Please fill in the form!'); // alert() is ugly but this is just a POC
			return; // invalid form data
		}
		
		// Call Rent Search API
		var fullRentApiUrl = this.props.rentApiUrl + formData.item;
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
				Keywords: encodeURIComponent(formData.item)
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
			React.createElement('label', {htmlFor: 'searchedItemInput'}, 'What are you looking for?'),
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
			{className: 'stuff-finder'},
			React.createElement('h1', {id: 'main-title'}, 'Stuff Finder - Need something to rent/buy?'),
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