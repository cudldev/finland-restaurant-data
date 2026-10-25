# Contributing

Restaurant additions and corrections are welcome as GitHub pull requests.

## Record format

Edit [`data/restaurants.json`](data/restaurants.json). Keep one entry per physical restaurant location. Use these fields:

- `id`: stable location identifier. Use `osm:<type><id>` when the place is matched to OpenStreetMap, or `community:<city>:<slug>` otherwise.
- `name`, `city`: location name and city.
- `website`: official restaurant website, if available.
- `menuUrl`: official menu page, if available.
- `menuFeed`: feed published or linked by the restaurant itself, if verified.
- `menuFeedType`: `lunch` for an actual lunch-menu feed, `general_menu` for another menu feed.
- `sources`: the URLs that support the record. Include an OpenStreetMap object URL when its ID or facts are used.
- `checkedAt`: date the links were last checked in `YYYY-MM-DD` format.

## Source and reuse rules

- Prefer the restaurant's own website for its website, menu and feed links.
- Do not copy listings or content from commercial restaurant aggregators.
- Do not copy menu text, descriptions, photos, or dietary claims. Link to the source instead.
- Include enough source information to trace each record. Mark uncertain records for review instead of guessing.
- Keep restaurant branches as separate records.
- Do not remove a restaurant because one request failed; suggest a correction and source evidence.
- This database is licensed under ODbL. Do not submit third-party data unless its terms permit inclusion under ODbL or a compatible license. Record any required source attribution.

Before submitting, ensure the JSON is valid and the `id` is unique. A maintainer reviews sources, duplicates, and reuse terms before merging.
