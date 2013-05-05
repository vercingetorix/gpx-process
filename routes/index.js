var geometry = require('./geometry').geometry;
var parseString = require('xml2js').parseString;
var fs = require('fs');
var moment = require('moment');
var _ = require('underscore');

function findFastest(points, distance) {
	var x = 0;
	var fastestTimes = [];
	points.forEach(function(data) {
		if(data.totalDistance > distance) {
			//console.log('comparing ' + x + ', actual distance = ' + (data.totalDistance - distance));
			var x2 = 0;
			var foundMatch = false;
			points.forEach(function(data2) {
				var diff = data.totalDistance - data2.totalDistance;
				if(diff > 0) {
					if( !foundMatch && (diff < distance) ) {
						//console.log('comparing ' + x + ' with ' + x2);
						//console.log('diff ' + diff + ', distance ' + distance);
						//console.log('matching on ' + (diff - distance));
						foundMatch = true;
						var selectedPoint = points[x2 - 1];

						fastestTime = {};
						fastestTime.time = data.runTime - selectedPoint.runTime;
						fastestTime.distance = data.totalDistance - selectedPoint.totalDistance;
						fastestTime.start = points[x2 - 1];
						fastestTime.end = points[x];
						fastestTime.pace = (fastestTime.time / fastestTime.distance) * (1000 / 60);
						fastestTime.adjustedTime = (fastestTime.time * distance) / fastestTime.distance;

						//console.log('diff ' + fastestTime.distance + ', time ' + fastestTime.time + ', pace ' + fastestTime.pace);

						fastestTimes.push( fastestTime );

						//console.log(fastestTimes);
					}
				}
				x2++;
			});
		} else {
			//console.log('totalDistance too short (' + data.totalDistance + ') : ignoring');
		}
		x++;
	});

	var times = _.sortBy(fastestTimes, function(trackPoint) {
		return trackPoint.pace;
	});

	//return _.isEmpty(times) ? {} : times[0];
	return times;
};

function processData(result) {
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
	//console.log(points);

	//var fastest400 = findFastest(points, 400);
	_.each([100, 200, 400, 800, 1500, 5000, 10000], function(distance) {
		var fastest = findFastest(points, distance);
		console.log( fastest );
	})
	//console.log(fastest400);

}



//exports.index = function(req, res){
exports.index = function() {
	fs.readFile('public/run.gpx', 'utf8', function(err, data) {
		if(err) console.log(err);
		else {
			parseString(data, function (err, result) {
				if(err) console.log(err);
				else processData(result);
			});
		}
	});
};