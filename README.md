# Finland Restaurant Data

A small, community-maintained list of restaurant locations and links for Finland, starting with the Helsinki metropolitan area. The data is public, versioned in Git, and open to additions and corrections by pull request.

## Data

The current file is [`data/restaurants.json`](data/restaurants.json). It records restaurant facts with a source record for each field. Restaurant IDs are Lunumi IDs; source IDs such as OSM are optional cross-references and never define a place's identity. Menu contents, descriptions, and dietary claims are not copied into the dataset. Reviewed photo links may be included with creator and license metadata; the image files remain hosted by Wikimedia Commons.

Each place has source URLs and `checkedAt` dates. Every field is tied to its source. Use an official restaurant or branch page for business facts only when its reuse terms allow that. When a source restricts copying or redistribution, use an openly licensed source such as OpenStreetMap for the record fields and consult the official page only to confirm that the location is currently operating. Coordinates include their source and license. A feed is labeled as a lunch feed only when it actually publishes lunch menus; the Pancho Villa feed is a general menu feed.

## Source approach

- Use the restaurant's own branch page as the primary source for its current name, address, website, and menu links when the source's reuse terms permit it. Otherwise, don't copy its locator data; independently source reusable location facts and use the official page only to check current operation.
- Use the [Helsinki Metropolitan Area Service Map](https://hri.fi/data/en/dataset/paakaupunkiseudun-palvelukartan-rest-rajapinta) to discover candidate locations in Helsinki, Espoo, Vantaa and Kauniainen. It covers public and some private services, including restaurants, and offers REST/JSON and WFS APIs. Its catalog does not specify an update interval, so confirm candidate details against the restaurant's own page before adding them. The catalog lists CC BY 4.0; record its attribution if any of its data is used.
- Use [Ruokavirasto's Oiva/Tietolaari data](https://www.ruokavirasto.fi/elintarvikkeet/elintarvikeala/elintarvikealan-uutiset/elintarvikevalvonnan-toimipaikkakohtaisia-tuloksia-voi-nyt-ladata-tietolaari-palvelusta/) as a regulatory cross-check, not as the restaurant directory. Its inspection results are published as local authorities perform inspections, cover up to six years, and are freely downloadable with source attribution. Food-premises data also includes businesses outside our restaurant scope.
- OpenStreetMap Nominatim may geocode an address after an official restaurant source verifies the branch. Record the query, OSM object ID, ODbL license and attribution for `lat`/`lon`. Do not use OSM as evidence that a restaurant still operates.
- Use Wikimedia Commons photos only after checking the exact file page. Store the thumbnail URL, file page, creator, license and license URL. The app links to the file page and license; it does not host the image.
- Keep each field's source and license visible so records can be replaced when better evidence appears.

No single source provides both a complete restaurant list and current branch details. This manually checked collection is not complete. Source roles differ by record: a reusable source such as OSM can provide identity, address and coordinates, while an official restaurant page can confirm current operation. Nominatim is used only to geocode when OSM has no appropriate mapped object; Commons is used only for individually reviewed photos.

## Local sourcing tools

The repository includes local scripts to help maintainers find new candidates and catch malformed records. They use Node.js built-ins only; no API key, paid service, or hosted runner is required. Use Node.js 22.15 or later for the system certificate support used by the discovery command.

```sh
npm run discover
npm run discover:osm
npm run validate
```

`discover` queries the Service Map's restaurant and cafe categories across Helsinki, Espoo, Vantaa, and Kauniainen. It writes `.local/candidates.json` with source IDs, category labels, coordinates, and required CC BY 4.0 attribution. This generated report is git-ignored because it contains unreviewed source data; it is a local review queue, not part of the published restaurant dataset. When refreshing the same output path, the script preserves manual review status by source ID, so reviewed candidates do not return to the unverified queue. A matching Service Map result alone is not evidence that a restaurant currently operates. Check a current official branch page and add only facts supported by that official page to `data/restaurants.json`. Do not copy source-derived fields into the ODbL dataset without reviewing license compatibility. To choose another output location, pass `--output <path>`; `--max-pages <number>` controls the per-query pagination limit.

`discover:osm` queries OpenStreetMap through the public Overpass API for restaurant, cafe, fast-food, and food-court candidates in a Helsinki-region bounding box. It writes `.local/osm-candidates.json`, marks OSM object IDs or addresses already represented in the curated dataset, and retains ODbL attribution. Manual review statuses are preserved by OSM object ID when the same report is refreshed. The report is local-only and does not add or refresh published records; verify each new candidate with a current source before publishing.

`validate` checks required fields, unique IDs, coordinates, dated source records, and photo license metadata in the published dataset. It does not check whether external pages are reachable or prove that a business is open.

The Service Map API is a candidate-discovery source and may be incomplete or stale. It is provided under CC BY 4.0; the script keeps the source and attribution with every local candidate. Review the source terms before adding any new source. There is no safe general-purpose script that can confirm operation across arbitrary restaurant websites, so the final official-page check remains a human review step.

## License and attribution

The database is offered under the [Open Data Commons Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/); see [`LICENSE`](LICENSE). OSM-derived facts and coordinates are attributed per record under ODbL; users of this database should preserve that attribution. Official branch pages are linked as appropriate for current operating evidence or business links. Earlier repository history included an OSM-derived ID; current restaurant IDs are independent of provider IDs.

Links to restaurant websites and Commons file pages are references; the database does not copy restaurant page contents or photo files. The database license does not grant rights to third-party content. Contributors should add only verifiable factual details, cite their sources, and check that collection and reuse are permitted. Some operator websites prohibit reusing their locator content without written permission; in those cases, use an openly licensed record for names, addresses and coordinates, and record the operator page only as evidence of current operation. Do not copy restaurant descriptions, menu text, or dietary claims. Government datasets with separate licenses must retain their attribution and be reviewed for compatibility before their records are merged into this ODbL database.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). One record represents one location. Please submit corrections or new records as a pull request and include the source pages and date checked.

This repository is maintained separately from the Lunumi app. Lunumi's Pages build checks out the public `main` branch and packages this file into both live and staging sites.
