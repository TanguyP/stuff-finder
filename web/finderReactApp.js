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
var RentSearchResultWrapper = React.createClass({
	
	render: function() {
		if (this.props.results) {
			var results = this.props.results;
			
			// No results for search, or malformed API response
			if (! (results.name && results.price)) {
				var msg = results.msg || 'An error occurred while searching';
				return React.createElement('div', {className: 'rent-search-api-message'}, msg);
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
		$.ajax({
			url: this.props.url + item,
			success: function(data) {
				// Trigger refresh from StuffFinder
				this.props.updateRentSearchResults(data);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
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
			rentSearchResults: null
		};
	},
	
	updateRentSearchResults: function(rentSearchResults) {
		this.setState({rentSearchResults: rentSearchResults});
	},
	
	render: function() {
		return React.createElement(
			'div',
			null,
			React.createElement(SearchForm, {url: '/search/', updateRentSearchResults: this.updateRentSearchResults.bind(this)}),
			React.createElement(RentSearchResultWrapper, {results: this.state.rentSearchResults})
		);
	}
});

ReactDOM.render(
	React.createElement(StuffFinder, null),
	document.getElementById('content')
);