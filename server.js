#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongodb = require('mongodb');

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;
    var Provider = require('./provider').Provider;
    var provider = new Provider();


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };
        self.routes.get = { };
        self.routes.post = { };

        //self.routes['/asciimo'] = function(req, res) {
            //var link = "http://i.imgur.com/kmbjB.png";
            //res.send("<html><body><img src='" + link + "'></body></html>");
        //};

        self.routes.get['/'] = function(req, res) {
            res.setHeader('Content-Type', 'application/json');
            res.json( {"response": "Welcome to Openshift!"} );
        };

        /*self.routes.get['/trips/cleardb'] = function(req, res) {
            provider.clearDB();
            res.setHeader('Content-Type', 'application/json');
            res.json( {"success": true });
        };*/

        /*self.routes.get['/trips'] = function(req, res) {
            provider.getAllTrips(function(data){
                res.setHeader('Content-Type', 'application/json');
                res.json( data );
            });
        };*/

        self.routes.get['/trips/:id'] = function(req, res) {
            var user_id = req.params.id;
            provider.getTrips(user_id, function(data){
                res.setHeader('Content-Type', 'application/json');
                res.json( data );
            });
        };

        self.routes.post['/trips/:id'] = function(req, res) {
            var user_id = req.params.id;
            provider.insertTrip(user_id, req.body.startLat, req.body.startLng, req.body.endLat, req.body.endLng, req.body.purpose, req.body.odometerEnd, req.body.distance, req.body.tripDate, req.body.tripId, function(success, doc){
                 res.setHeader('Content-Type', 'application/json');
                 res.json( {"response": doc} );
            });
        };

        self.routes.post['/waypoints/:tripid'] = function(req, res) {
            var trip_id = req.params.tripid;
            var success = provider.insertWaypoint(trip_id, req.body.lat, req.body.lng);
            res.setHeader('Content-Type', 'application/json');
            res.json( {"response": success} );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();
        self.app.use(express.json());       // to support JSON-encoded bodies
        self.app.use(express.urlencoded()); // to support URL-encoded bodies

        //  Add handlers for the app (from the routes).
        for (var r in self.routes.get) {
            self.app.get(r, self.routes.get[r]);
        }

        for (var r in self.routes.post) {
            self.app.post(r, self.routes.post[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();