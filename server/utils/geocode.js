// Turns a typed address like "Maple Rd & 3rd St" into real coordinates
// (latitude/longitude), using OpenStreetMap's free Nominatim search API --
// no API key, no billing account, same "stick to free tools" pattern this
// project has followed for Cloudinary.
//
// Nominatim's usage policy (nominatim.org/release-docs/latest/api/Search/)
// requires a real identifying User-Agent header on every request -- it's
// a shared free service, and an unidentified client can get blocked. We
// send a simple made-up-but-descriptive one below.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Returns { latitude, longitude } on success, or null if the address
// couldn't be found or the lookup failed for any reason. Deliberately
// never throws -- a bad/unrecognized address should not stop someone from
// reporting an issue, it should just mean no map pin for that one issue.
async function geocodeLocation(locationText) {
  if (!locationText) return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(locationText)}`;

  try {
    const response = await fetch(url, {
      headers: {
        // Node 24 has fetch() built in, no extra package needed.
        'User-Agent': 'CivicFix/1.0 (student project; civic issue reporting app)',
      },
    });

    if (!response.ok) {
      console.error('Geocoding request failed with status', response.status);
      return null;
    }

    const results = await response.json();

    // Nominatim returns an array, newest/most-relevant match first. An
    // empty array just means "couldn't find that address" -- not an error.
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const [match] = results;
    return {
      latitude: parseFloat(match.lat),
      longitude: parseFloat(match.lon),
    };
  } catch (err) {
    console.error('Geocoding lookup threw an error:', err.message);
    return null;
  }
}

module.exports = geocodeLocation;
