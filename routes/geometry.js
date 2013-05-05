var geometry = {

	earthRadius: 6371000,

	toRadians: function(degrees) {
		return degrees * Math.PI / 180;
	},

	getDistance: function(lat1, long1, lat2, long2) {
		var a, c, dLat = geometry.toRadians(lat2 - lat1), dLong = geometry.toRadians(long2 - long1);
		a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLong / 2) * Math.sin(dLong / 2) * Math.cos(geometry.toRadians(lat1)) * Math.cos(geometry.toRadians(lat2));
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return c * geometry.earthRadius;
	}

};

exports.geometry = geometry;