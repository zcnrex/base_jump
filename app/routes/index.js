'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var short_urls = {};
var validator = require("validator");

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	var clickHandler = new ClickHandler();

	app.route('/')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/index.html');
		});
	
	app.route('/*')
		.get(function(req, res, next) {
			var route = req.params[0];
		    if (route in short_urls){
		    	res.statusCode = 301;
				res.setHeader('Location', short_urls[route]);
				res.end();
		    }
		    else next();
		});
		
	app.route('/:str')
		.get(function(req, res, next){
			var date = (new Date(Number.isNaN(+req.params.str) ? req.params.str : +req.params.str)).getTime();
			var result;
			if (date > 0){
				result = {
					'unix': date,
					'natural': (new Date(date)).toDateString()
				};
			res.end(JSON.stringify(result));
			}
			else{
				// result = {
				// 	'unix': null,
				// 	'natural': null
				// }
				next();
			}
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});

	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});
		
	app.route('/api/whoami')
		.get(function (req, res) {
			var result = {
				'ipaddress': req.headers['x-forwarded-for'],
				'language': req.headers["accept-language"].split(',')[0],
				'software': req.headers['user-agent'].split('(')[1].split(')')[0]
			};
			// console.log(result);
			res.end(JSON.stringify(result));
		});

	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			res.json(req.user.github);
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));

	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
	
	app.route('/new/*')
		.get(function(req, res) {
		    var addr = req.params[0];
		    var result;
		    if (validator.isURL(addr)){
			    var num = Math.floor(Math.random() * 9000 + 1000).toPrecision(4);
			    var short_url = req.headers['x-forwarded-proto'] + '\:\/\/' + req.headers['host'] + '\/' + num;
			    result = {
			    	'original_url': addr,
			    	'short_url': short_url,
			    };
			    short_urls[num] = addr;
		    }
		    else{
		    	result = {"error":"Wrong url format, make sure you have a valid protocol and real site."};
		    }
		    res.end(JSON.stringify(result));
		});
	
};
