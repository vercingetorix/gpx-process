var geometry = require('./geometry').geometry;
var parseString = require('xml2js').parseString;
var fs = require('fs');
var moment = require('moment');
var _ = require('underscore');
var utils = require('./utils').utils;

function findFastest(points, distance) {
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
						fastestTime.time = data.runTime - selectedPoint.runTime;
						fastestTime.distance = data.totalDistance - selectedPoint.totalDistance;
						//fastestTime.start = points[x2 - 1];
						//fastestTime.end = points[x];
						fastestTime.start = x2 - 1;
						fastestTime.end = x;
						fastestTime.pace = (fastestTime.time / fastestTime.distance) * (1000 / 60);
						fastestTime.adjustedTime = (fastestTime.time * distance) / fastestTime.distance;

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

	console.log(fastestTime[0]);
};

function processData(filePath) {
	fs.readFile(filePath, 'utf8', function(err, data) {
		if(err) console.log(err);
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

						lastPoint = point;
						points.push(point);
						i++;
					});

					_.each([100, 200, 400, 800, 804.672, 1000, 1500, 1609.34, 2000, 3218.69, 5000, 10000], function(distance) {
						findFastest(points, distance);
					});
				}
			});
		}
	});
};

//exports.index = function(req, res){
exports.index = function() {
	processData('public/run.gpx');
};