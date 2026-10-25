# Finland Restaurant Data

A small, community-maintained list of restaurant locations and links for Finland, starting with the Helsinki metropolitan area. The data is public, versioned in Git, and open to additions and corrections by pull request.

## Data

The current file is [`data/restaurants.json`](data/restaurants.json). It records restaurant facts with a source record for each field. Restaurant IDs are Lunumi IDs; source IDs such as OSM are optional cross-references and never define a place's identity. Menu contents, photos, descriptions, and dietary claims are not copied into the dataset.

Each place has source URLs and `checkedAt` dates. A feed is labeled as a lunch feed only when it actually publishes lunch menus; the Pancho Villa feed is a general menu feed.

## Source approach

- Use the restaurant's own branch page as the primary source for its current name, address, official website, and menu links.
- Use the [Helsinki Metropolitan Area Service Map](https://hri.fi/data/en/dataset/paakaupunkiseudun-palvelukartan-rest-rajapinta) to discover candidate locations in Helsinki, Espoo, Vantaa and Kauniainen. It covers public and some private services, including restaurants, and offers REST/JSON and WFS APIs. Its catalog does not specify an update interval, so confirm candidate details against the restaurant's own page before adding them. The catalog lists CC BY 4.0; record its attribution if any of its data is used.
- Use [Ruokavirasto's Oiva/Tietolaari data](https://www.ruokavirasto.fi/elintarvikkeet/elintarvikeala/elintarvikealan-uutiset/elintarvikevalvonnan-toimipaikkakohtaisia-tuloksia-voi-nyt-ladata-tietolaari-palvelusta/) as a regulatory cross-check, not as the restaurant directory. Its inspection results are published as local authorities perform inspections, cover up to six years, and are freely downloadable with source attribution. Food-premises data also includes businesses outside our restaurant scope.
- OpenStreetMap may be used as an optional cross-check, but never as the sole source or canonical ID. Keep each field's source and license visible so records can be replaced when better evidence appears.

No single source provides both a complete restaurant list and current branch details. The list therefore uses multiple sources with separate roles and manual review.

## License and attribution

The database is offered under the [Open Data Commons Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/); see [`LICENSE`](LICENSE). The current starter record is sourced from the restaurant's own location page and menu feed. Earlier repository history included an OSM-derived ID; current records use independent IDs and do not require OSM data.

Links to restaurant websites are references, not copies of their page contents. The database license does not grant rights to third-party page content. Contributors should add only verifiable factual details, cite their sources, and check that collection and reuse are permitted. Do not copy restaurant descriptions, menu text, photos, or dietary claims. Government datasets with separate licenses must retain their attribution and be reviewed for compatibility before their records are merged into this ODbL database.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). One record represents one location. Please submit corrections or new records as a pull request and include the source pages and date checked.

This repository is maintained separately from the Lunumi app. The app does not automatically import this file; a reviewed dataset release can be integrated later.
