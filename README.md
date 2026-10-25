# Finland Restaurant Data

A small, community-maintained list of restaurant locations and links for Finland, starting with the Helsinki metropolitan area. The data is public, versioned in Git, and open to additions and corrections by pull request.

## Data

The initial file is [`data/restaurants.json`](data/restaurants.json). It records stable restaurant facts and links to official sites and feeds. Menu contents, photos, descriptions, and dietary claims are not copied into the dataset.

Each place has a source URL and a `checkedAt` date. A feed is labeled as a lunch feed only when it actually publishes lunch menus; the starter Pancho Villa link is a general menu feed.

## License and attribution

The database is offered under the [Open Data Commons Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/); see [`LICENSE`](LICENSE). The starter record uses an OpenStreetMap place ID and name, so attribution is included in the data file: © OpenStreetMap contributors. OSM data is available under ODbL.

Links to restaurant websites are references, not copies of their page contents. The database license does not grant rights to third-party page content. Contributors should add only verifiable factual details, cite their sources, and check that collection and reuse are permitted. Do not copy restaurant descriptions, menu text, photos, or dietary claims.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). One record represents one location. Please submit corrections or new records as a pull request and include the source pages and date checked.

This repository is maintained separately from the Lunumi app. The app does not automatically import this file; a reviewed dataset release can be integrated later.
