exports.mainPage = function(req, res) {
	res.setHeader("Content-Type", 'text/plain');
	res.end('Bonjour !');
}