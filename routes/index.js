/* eslint-disable no-console */
const fs = require("fs");
const moment = require("moment");
const _ = require("underscore");
const { parseString } = require("xml2js");
const { geometry } = require("./geometry");

function findFastest(points, distance) {
  let x = 0;
  const fastestTimes = [];
  points.forEach((data) => {
    if (data.totalDistance > distance) {
      // console.log('comparing ' + x + ', actual distance = ' + (data.totalDistance - distance));
      let x2 = 0;
      let foundMatch = false;
      points.forEach((data2) => {
        const diff = data.totalDistance - data2.totalDistance;
        if (diff > 0) {
          if (!foundMatch && diff < distance) {
            // console.log('comparing ' + x + ' with ' + x2);
            // console.log('diff ' + diff + ', distance ' + distance);
            // console.log('matching on ' + (diff - distance));
            foundMatch = true;
            const selectedPoint = points[x2 - 1];

            const fastestTime = {};
            fastestTime.time = data.runTime - selectedPoint.runTime;
            fastestTime.distance =
              data.totalDistance - selectedPoint.totalDistance;
            fastestTime.start = points[x2 - 1];
            fastestTime.end = points[x];
            fastestTime.pace =
              (fastestTime.time / fastestTime.distance) * (1000 / 60);
            fastestTime.adjustedTime =
              (fastestTime.time * distance) / fastestTime.distance;

            // console.log('diff ' + fastestTime.distance + ', time ' + fastestTime.time + ', pace ' + fastestTime.pace);

            fastestTimes.push(fastestTime);
            // console.log(fastestTimes);
          }
        }
        x2 += 1;
      });
    } else {
      // console.log('totalDistance too short (' + data.totalDistance + ') : ignoring');
    }
    x += 1;
  });

  const times = _.sortBy(fastestTimes, (trackPoint) => {
    return trackPoint.pace;
  });

  // return _.isEmpty(times) ? {} : times[0];
  return times;
}

function processData(result) {
  const trackPoints = result.gpx.trk[0].trkseg[0].trkpt;

  let i = 0;
  const points = [];
  let firstPoint = {};
  let lastPoint = {};
  let totalDistance = 0;

  trackPoints.forEach((data) => {
    const point = {};
    point.i = i;
    point.latitude = data.$.lat;
    point.longitude = data.$.lon;
    [point.elevation] = data.ele;
    point.time = moment(data.time[0]).format("X");

    firstPoint = _.isEmpty(points) ? point : points[0];

    point.runTime = point.time - firstPoint.time;
    point.distanceDelta = _.isEmpty(points)
      ? 0
      : geometry.getDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          point.latitude,
          point.longitude
        );

    totalDistance += point.distanceDelta;
    point.totalDistance = totalDistance;

    lastPoint = point;
    points.push(point);
    i += 1;
  });
  // console.log(points);

  // var fastest400 = findFastest(points, 400);
  _.each([100, 200, 400, 800, 1500, 5000, 10000], (distance) => {
    const fastest = findFastest(points, distance);
    console.log(fastest);
  });
  // console.log(fastest400);
}

// exports.index = function(req, res){
exports.index = () => {
  fs.readFile("public/run.gpx", "utf8", (err, data) => {
    if (err) console.log(err);
    else {
      parseString(data, (err, result) => {
        if (err) console.log(err);
        else processData(result);
      });
    }
  });
};
