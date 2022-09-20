 'use strict';

 var express = require('express')(),
     server = require('http').Server(express),
     io = require('socket.io')(server),
     tacUtils = require('tac-1d-utils'),
     floodio = require('./floodio'),
     constants = require('./utilities/constants')
     ;
 
 var PORT = process.env.SERVER_PORT || constants.DEFAULT_PORT;
 var ACCESS_TOKENS = process.env.ACCESS_TOKENS || constants.DEFAULT_ACCESS_TOKENS;
 var AUTH_ENABLED = constants.DEFAULT_AUTH_ENABLED;
 if (process.env.AUTH_ENABLED !== undefined) {
     AUTH_ENABLED = (process.env.AUTH_ENABLED === 'true');
 }
 
 var startInterval;
 var startTimeout = 1000 * 20;
 
 startServer();
 
 function startServer() {
     if (startInterval) {
         clearInterval(startInterval);
     }
     console.log('Starting server');
 
     tacUtils.authentication.prepareAuthentication(constants.API_CODE, ACCESS_TOKENS, AUTH_ENABLED)
     .then(() => {
         // general resource authentication
         io.use(tacUtils.authentication.socketAuth());
 
         // multiplexer authentication
         io.of('/multiplexers').use(tacUtils.authentication.socketAuth({roles: constants.MP_ROLES}));
         io.of('/multiplexers').on('connection', floodio.multiplexerConnection);
 
         // client authentication
         io.of('/controlui').use(tacUtils.authentication.socketAuth({roles: constants.CLIENT_ROLES}));
 
         // pipeline messages
         io.of('/pipemessages').use(tacUtils.authentication.socketAuth({roles: constants.CLIENT_ROLES}));
         io.of('/pipemessages').use(function(socket, next) {
             if (!socket.handshake.query.hasOwnProperty('clientId') || !socket.handshake.query.hasOwnProperty('pipelineId')) {
                 next(new Error('Missing handshake parameters'));
             }
             else {
                 next();
             }
         });
         io.of('/pipemessages').on('connection', floodio.pipeMessageConnection);
 
         // telemetry authentication
         io.of('/telemetry/*').use(tacUtils.authentication.socketAuth({roles: constants.TEL_ROLES}));
         io.of('/telemetry/bubble').on('connection', floodio.telemetryBubbleConnection);
         io.of('/telemetry/stats').on('connection', floodio.telemetryStatsConnection);
 
         // initialise server
         server.listen(PORT);
         console.log('Listening on port ' + PORT.toString());
         express.route('/health')
             .get(getHealth)
             .all(invalidMethod);
     })
     .catch((err) => {
         console.error('Unable to start server');
         console.error(err);
         startInterval = setInterval(startServer, startTimeout);
     });
 }
 
 function invalidMethod(req, res) {
     res.sendStatus(405);
 }
 
 function getHealth(req, res) {
     res.set('Content-Type', 'text/html');
     res.status(200).send('OK');
 }