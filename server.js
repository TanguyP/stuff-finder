/*
 * Main entry point for the application, it runs a server
 * accessible at http://localhost:8080
 */

/* IMPORTS */
const argparse = require('argparse');
const ejs = require('ejs');
const express = require('express');
const path = require('path');

const rentSearchApi = require('./rentSearchApi');

/* CODE */

// Parse CLI arguments
const argParser = new argparse.ArgumentParser({
	addHelp: true
});
argParser.addArgument('rentSearchServer', {help: "URL of the server for searching rented objects"});
argParser.addArgument('metaApiServer', {help: "URL of the \"meta-API\" server which allows accessing authentication-protected APIs"});
argParser.addArgument('metaApiPassword', {help: "Password for the \"meta-API\" which allows accessing authentication-protected APIs"});
const args = argParser.parseArgs();

// Create server
const server = express();
server.use(express.static(path.join(__dirname, 'web')));

// Remove trailing '/' (if any) in server URLs
args.metaApiServer = (args.metaApiServer || '').replace(/\/$/, '');
args.rentSearchServer = (args.rentSearchServer || '').replace(/\/$/, '');

// Map server routes
(function() {
	server.get('/search/:item', function(req, res) {
		rentSearchApi.search(req, res, args);
	});
	server.get('/dynamicData.js', function(req, res) {
		res.render(
			'dynamicData.ejs',
			{
				metaApiServer: args.metaApiServer,
				metaApiPassword: args.metaApiPassword
			}
		);
	});
})();

server.listen(8081);
console.log("Server started, press Ctrl+C to exit");