/*
 * Main entry point for the application, it runs a server
 * accessible at http://localhost:8080
 */

const express = require('express');
const localSearchApi = require('./localSearchApi');

const server = express();

server.get('/', localSearchApi.mainPage);

server.listen(8080);