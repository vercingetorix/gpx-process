const geometry = {
  earthRadius: 6371000,

  toRadians: (degrees) => {
    return (degrees * Math.PI) / 180;
  },

  getDistance: (lat1, long1, lat2, long2) => {
    const dLat = geometry.toRadians(lat2 - lat1);
    const dLong = geometry.toRadians(long2 - long1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLong / 2) *
        Math.sin(dLong / 2) *
        Math.cos(geometry.toRadians(lat1)) *
        Math.cos(geometry.toRadians(lat2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return c * geometry.earthRadius;
  },
};

exports.geometry = geometry;
