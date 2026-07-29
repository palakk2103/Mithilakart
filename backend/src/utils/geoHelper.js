function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildGeoPoint(latitude, longitude) {
  if (latitude == null || longitude == null) return undefined;
  return { type: 'Point', coordinates: [longitude, latitude] };
}

function parseLocationFields(data) {
  const latitude = data.latitude != null ? Number(data.latitude) : null;
  const longitude = data.longitude != null ? Number(data.longitude) : null;
  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    location: buildGeoPoint(latitude, longitude),
  };
}

module.exports = {
  haversineKm,
  buildGeoPoint,
  parseLocationFields,
};
