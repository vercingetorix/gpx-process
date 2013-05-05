var geometry = require('./geometry').geometry;
var parseString = require('xml2js').parseString;
var fs = require('fs');
var moment = require('moment');
var _ = require('underscore');
var utils = require('./utils').utils;

var times = {};

function printRecords() {
	console.log('------------------------------------------');
	for(x in times) {
		console.log(
			times[x].name,
			' : ',
			times[x].time.toPrecision(5),
			' : ',
			times[x].speed.toPrecision(6),
			' : ',
			times[x].pace.toPrecision(5),
			' : ',
			times[x].dated
		);
	}
	console.log('------------------------------------------');
};

function findFastest(points, distance, name) {
	var x = 0;
	var fastestTimes = [];
	points.forEach(function(data) {
		if(data.totalDistance > distance) {
			var x2 = 0;
			var foundMatch = false;
			points.forEach(function(data2) {
				var diff = data.totalDistance - data2.totalDistance;
				if(diff > 0) {
					if( !foundMatch && (diff < distance) ) {
						foundMatch = true;
						var selectedPoint = points[x2 - 1];

						fastestTime = {};
						fastestTime.name = name;
						fastestTime.time = data.runTime - selectedPoint.runTime;
						fastestTime.distance = data.totalDistance - selectedPoint.totalDistance;
						fastestTime.startBlock = points[x2 - 1];
						fastestTime.endBlock = points[x];
						fastestTime.start = x2 - 1;
						fastestTime.end = x;
						fastestTime.pace = utils.round( (fastestTime.time / fastestTime.distance) * (1000 / 60), 4);
						fastestTime.adjustedTime = (fastestTime.time * distance) / fastestTime.distance;
						fastestTime.speed = utils.round( (fastestTime.distance / fastestTime.time) * (3600/1000), 4 );
						fastestTime.dated = moment( points[x2 - 1].time, 'X' ).format();

						fastestTimes.push( fastestTime );
					}
				}
				x2++;
			});
		}
		x++;
	});

	var fastestTime = _.sortBy(fastestTimes, function(trackPoint) {
		return trackPoint.pace;
	});

	if( !_.isUndefined(fastestTime[0]) ) {
		if( _.isUndefined(times[name]) ) {
			console.log(
				name,
				' : ',
				fastestTime[0].speed.toFixed(4),
				' : ',
				fastestTime[0].pace.toFixed(4),
				' : ',
				fastestTime[0].dated,
				' : ',
				fastestTime[0].time
			);
			times[name] = fastestTime[0];
		} else {
			if( fastestTime[0].pace < times[name].pace ) {
				console.log(
					name,
					' : ',
					fastestTime[0].speed.toFixed(4),
					' : ',
					fastestTime[0].pace.toFixed(4),
					' : ',
					fastestTime[0].time,
					' : ',
					fastestTime[0].dated,
					' : ',
				 	(fastestTime[0].speed - times[name].speed).toFixed(4),
					' : ',
				 	(times[name].pace - fastestTime[0].pace).toFixed(4),
				 	' : ',
				 	(times[name].time - fastestTime[0].time)
				);
				times[name] = fastestTime[0];
			} else {
				console.log(
					' : ',
					name,
					' : ',
					fastestTime[0].speed.toFixed(4),
					' : ',
					fastestTime[0].pace.toFixed(4),
					' : ',
					fastestTime[0].time,
					' : ',
					fastestTime[0].dated,
					' : ',
				 	(fastestTime[0].speed - times[name].speed).toFixed(4),
					' : ',
				 	(times[name].pace - fastestTime[0].pace).toFixed(4),
				 	' : ',
				 	(times[name].time - fastestTime[0].time)
				);
			}
		}
	}

	//console.log(times);
	//printRecords();
};

function processData(filePath, url, callback) {
	fs.readFile(filePath + '.gpx', 'utf8', function(err, data) {
		if(err) console.log('URL: ' + url + '/export_gpx, FILE: ' + filePath + ', ERROR: ' + err);
		else {
			parseString(data, function (err, result) {
				if(err) console.log(err);
				else {
					var trackPoints = result.gpx.trk[0].trkseg[0].trkpt;

					var i = 0;
					var points = [];
					var firstPoint = {};
					var lastPoint = {};
					var totalDistance = 0;

					trackPoints.forEach(function(data) {
						var point = {};
						point.i = i;
						point.latitude = data.$.lat;
						point.longitude = data.$.lon;
						point.elevation = data.ele[0];
						point.time = moment( data.time[0] ).format('X');

						firstPoint = _.isEmpty(points) ? point : points[0];
						
						point.runTime = point.time - firstPoint.time;
						point.distanceDelta = _.isEmpty(points) ? 0 : geometry.getDistance(
								lastPoint.latitude,
								lastPoint.longitude,
								point.latitude,
								point.longitude
							);

						totalDistance += point.distanceDelta;
						point.totalDistance = totalDistance;

						point.speed = _.isEmpty(points) ? 0 : (point.distanceDelta / (point.time - lastPoint.time)) * (3600 / 1000);
						//console.log(point.speed);

						//if(point.speed > 36) {
							lastPoint = point;
							points.push(point);
						//} else {
						//	console.log(points);
						//}

						i++;
					});

					var distances = [
						{ name: '100m___', distance: 100 },
						{ name: '200m___', distance: 200 },
						{ name: '400m___', distance: 400 },
						{ name: '800m___', distance: 800 },
						{ name: '1/2mile', distance: 804.672 },
						{ name: '1km____', distance: 1000 },
						{ name: '1.5km__', distance: 1500 },
						{ name: '1mile__', distance: 1609.34 },
						{ name: '2km____', distance: 2000 },
						{ name: '2mile__', distance: 3218.69 },
						{ name: '5k_____', distance: 5000 },
						{ name: '10km___', distance: 10000 },
						{ name: '15km___', distance: 15000 },
						{ name: '20km___', distance: 20000 }
					];

					//console.log(points);
					_.each(distances, function(distance) {
						findFastest(points, distance.distance, distance.name);
					});

					callback();
				}
			});
		}
	});
};

//exports.index = function(req, res){
exports.index = function() {
	var cycling = [];
	cycling.push('http://app.strava.com/activities/3541379');
	cycling.push('http://app.strava.com/activities/3541513');
	cycling.push('http://app.strava.com/activities/3564976');
	cycling.push('http://app.strava.com/activities/3588691');
	cycling.push('http://app.strava.com/activities/3613492');
	cycling.push('http://app.strava.com/activities/3638350');
	cycling.push('http://app.strava.com/activities/3692293');
	cycling.push('http://app.strava.com/activities/3728493');
	cycling.push('http://app.strava.com/activities/3755042');

	// var cycling_count = cycling.length;
	// cycling.forEach(function(data) {
	// 	processData('downloads/' + utils.md5(data), data, function() {
	// 		cycling_count--;
	// 		if(cycling_count == 0) {
	// 			printRecords();
	// 		}
	// 	});
	// });	

	var running = [];
	running.push('http://app.strava.com/activities/3755140');
	running.push('http://app.strava.com/activities/3768260');
	running.push('http://app.strava.com/activities/3784695');
	running.push('http://app.strava.com/activities/3809908');
	running.push('http://app.strava.com/activities/3834368');
	running.push('http://app.strava.com/activities/3901642');
	running.push('http://app.strava.com/activities/3926649');
	running.push('http://app.strava.com/activities/3955433');
	//running.push('http://app.strava.com/activities/3978508');
	running.push('http://app.strava.com/activities/4003948');
	running.push('http://app.strava.com/activities/4055062');
	running.push('http://app.strava.com/activities/4085686');
	running.push('http://app.strava.com/activities/4119567');
	running.push('http://app.strava.com/activities/4143169');
	running.push('http://app.strava.com/activities/4166684');
	running.push('http://app.strava.com/activities/4285694');
	running.push('http://app.strava.com/activities/4324878');
	running.push('http://app.strava.com/activities/4355333');
	running.push('http://app.strava.com/activities/4387469');
	running.push('http://app.strava.com/activities/4418500');
	running.push('http://app.strava.com/activities/4447478');
	running.push('http://app.strava.com/activities/4591887');
	running.push('http://app.strava.com/activities/4626273');
	running.push('http://app.strava.com/activities/4654210');
	running.push('http://app.strava.com/activities/4720217');
	running.push('http://app.strava.com/activities/4765086');
	running.push('http://app.strava.com/activities/4813419');
	//running.push('http://app.strava.com/activities/4849737');
	running.push('http://app.strava.com/activities/4956594');
	running.push('http://app.strava.com/activities/5007546');
	running.push('http://app.strava.com/activities/5058907');
	running.push('http://app.strava.com/activities/5186605');
	//running.push('http://app.strava.com/activities/5229746');
	running.push('http://app.strava.com/activities/5467097');
	running.push('http://app.strava.com/activities/5605077');
	running.push('http://app.strava.com/activities/5697032');
	running.push('http://app.strava.com/activities/5826715');
	running.push('http://app.strava.com/activities/5980992');
	running.push('http://app.strava.com/activities/6037524');
	//running.push('http://app.strava.com/activities/6073828');
	running.push('http://app.strava.com/activities/8451248');
	running.push('http://app.strava.com/activities/8944224');
	running.push('http://app.strava.com/activities/13471109');
	running.push('http://app.strava.com/activities/19140106');
	running.push('http://app.strava.com/activities/19142268');
	running.push('http://app.strava.com/activities/19262814');
	//running.push('http://app.strava.com/activities/19783929');
	running.push('http://app.strava.com/activities/20581514');
	running.push('http://app.strava.com/activities/21384122');
	running.push('http://app.strava.com/activities/22020584');
	running.push('http://app.strava.com/activities/22388948');
	running.push('http://app.strava.com/activities/22485664');
	running.push('http://app.strava.com/activities/22910110');
	running.push('http://app.strava.com/activities/25345522');
	running.push('http://app.strava.com/activities/25560772');
	running.push('http://app.strava.com/activities/25687602');
	running.push('http://app.strava.com/activities/26013148');
	running.push('http://app.strava.com/activities/26099105');
	running.push('http://app.strava.com/activities/26453620');
	running.push('http://app.strava.com/activities/26614375');
	running.push('http://app.strava.com/activities/28242899');
	running.push('http://app.strava.com/activities/28453781');
	running.push('http://app.strava.com/activities/29299185');
	running.push('http://app.strava.com/activities/29303529');
	running.push('http://app.strava.com/activities/30569205');
	running.push('http://app.strava.com/activities/31129721');
	running.push('http://app.strava.com/activities/32751723');
	running.push('http://app.strava.com/activities/32889079');
	running.push('http://app.strava.com/activities/33167115');
	running.push('http://app.strava.com/activities/33603077');
	running.push('http://app.strava.com/activities/33973661');
	running.push('http://app.strava.com/activities/34127853');
	running.push('http://app.strava.com/activities/37195733');
	running.push('http://app.strava.com/activities/37385306');
	running.push('http://app.strava.com/activities/37941270');
	running.push('http://app.strava.com/activities/37944123');
	running.push('http://app.strava.com/activities/39623211');
	running.push('http://app.strava.com/activities/47789302');
	running.push('http://app.strava.com/activities/48774643');
	running.push('http://app.strava.com/activities/51716102');
	running.push('http://app.strava.com/activities/51718365');
	running.push('http://app.strava.com/activities/52267482');

	// Buggy Codes
	//running = [];
	//running.push('http://app.strava.com/activities/3978508');
	//running.push('http://app.strava.com/activities/4849737');
	//running.push('http://app.strava.com/activities/5229746');
	//running.push('http://app.strava.com/activities/6073828');
	//running.push('http://app.strava.com/activities/19783929');

	var running_count = running.length;
	running.forEach(function(data) {
		processData('downloads/' + utils.md5(data), data, function() {
			console.log('Processed (' + utils.md5(data)  + ') ' + data);
			running_count--;
			if(running_count == 0) {
				printRecords();
			}
		});
	});	

};