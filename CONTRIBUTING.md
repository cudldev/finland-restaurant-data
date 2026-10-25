# Contributing

Restaurant additions and corrections are welcome as GitHub pull requests.

## Record format

Edit [`data/restaurants.json`](data/restaurants.json). Keep one entry per physical restaurant location. Use these fields:

- `id`: stable Lunumi location identifier in `frd:<city>:<slug>` form. Do not base it on an external provider ID.
- `name`, `city`: location name and city.
- `website`: official restaurant website, if available.
- `menuUrl`: official menu page, if available.
- `menuFeed`: feed published or linked by the restaurant itself, if verified.
- `menuFeedType`: `lunch` for an actual lunch-menu feed, `general_menu` for another menu feed.
- `lat`, `lon`: coordinates for nearby search. Record the geocoder source separately from business facts. If using Nominatim, include its query URL, OSM object ID, ODbL license and OpenStreetMap attribution.
- `photo`: optional Wikimedia Commons thumbnail metadata (`url`, `sourceUrl`, `attribution`, `license`, `licenseUrl`). Check the exact file page and license first; link to the file, do not copy the image.
- `sourceRecords`: one or more source objects. Each must include the URL, fields supported by that source, and the date checked. Include source license and required attribution when data comes from an open dataset.
- `checkedAt`: date the links were last checked in `YYYY-MM-DD` format.

## Source and reuse rules

- Prefer the restaurant's own branch page for current name, address, official website and menu links.
- Use the Helsinki Metropolitan Area Service Map for candidate discovery, then verify details on the restaurant's own page. The catalog offers CC BY 4.0 data but does not state an update interval; include its attribution when using its records.
- Use Ruokavirasto Oiva data to cross-check food-premises records and inspection freshness. It is not a restaurant-only directory and must be attributed.
- OpenStreetMap can be an optional secondary check. Do not use its ID as the canonical ID or rely on it as the sole evidence for a record.
- Do not copy listings or content from commercial restaurant aggregators.
- Do not copy menu text, descriptions, photos, or dietary claims. Link to the source instead.
- For photo records, link only to images with an explicit reusable license or public-domain status and include creator, file page and license links. The app displays the attribution and license beside the image.
- Include enough source information to trace each record. Mark uncertain records for review instead of guessing.
- Keep restaurant branches as separate records.
- Do not remove a restaurant because one request failed; suggest a correction and source evidence.
- This database is licensed under ODbL. Do not submit third-party data unless its terms permit inclusion under ODbL or a compatible license. Keep source records separable and record any required attribution.

Before submitting, ensure the JSON is valid and the `id` is unique. A maintainer reviews sources, duplicates, and reuse terms before merging.
