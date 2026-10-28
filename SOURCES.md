# Source register

Last reviewed: 2026-10-26. This is the maintainer's working list for finding and refreshing restaurant records. A source being public or reachable does not by itself mean its data can be copied into this ODbL database.

## Status key

- **Reusable (scoped):** the cited license permits reuse of the listed fields, subject to its terms and attribution. Keep source and license metadata on each record.
- **Discovery only:** use it to find leads; independently verify and source publishable facts from a reusable source.
- **Link / verification only:** retain a URL or use it to check a fact; do not copy its page contents or compiled dataset.
- **Permission needed:** use only after confirming an API, license, written permission, or operator submission covers the specific fields and our redistribution.
- **Not approved:** don't automate collection or republish its compiled data under the current evidence.

The status applies only to the stated use. Terms may change; check them again before adding a new automated collector or changing the database license.

## Sources

| Source | Useful information | Current status and limits | Refresh approach |
|---|---|---|---|
| [Helsinki metropolitan area Service Map API](https://hri.fi/data/en/dataset/paakaupunkiseudun-palvelukartan-rest-rajapinta) | Candidate venues, service categories, coordinates, and sometimes links, in Helsinki, Espoo, Vantaa and Kauniainen. | **Discovery only for this ODbL dataset.** The API dataset is CC BY 4.0 and requires attribution; that license does not remove the need to review compatibility before merging those records into our ODbL database. Do not treat a match as proof the venue is operating. Exclude public-art image fields from reuse. | Run the existing local `npm run discover` when refreshing the metro-area review queue. The source does not publish a clear update interval; check candidate branches against current evidence. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via the [Overpass API](https://overpass-api.de/) | Candidate venues, mapped names, categories, addresses and coordinates. | **Reusable under ODbL, with attribution and share-alike obligations.** Optional source; it does not establish that a place still operates. Keep OSM source IDs and attribution on records. | Run `npm run discover:osm` for an on-demand local candidate report. For frequent or broad collection, use an extract/local processing rather than putting regular load on a public Overpass service. |
| [Finnish Business Information System open data (YTJ/PRH)](https://ytj.fi/en/index/opendata.html) | Business name, Business ID, domicile, public address, business-line and some registration/status information. The service says data is updated daily. | **Cross-check lead; bulk reuse not yet approved here.** It describes free open data, but the reuse/license terms need to be checked against our ODbL database before importing fields. It is not a branch directory, may not identify individual restaurant locations, and excludes private traders/sole proprietors. A company status does not establish that a particular restaurant branch is open. | Check the current official endpoint and its full terms before scripting an import. If later approved, use it to match legal entities, not as the sole branch-operation check. |
| [Ruokavirasto Oiva / Tietolaari](https://www.ruokavirasto.fi/elintarvikkeet/elintarvikeala/elintarvikealan-uutiset/elintarvikevalvonnan-toimipaikkakohtaisia-tuloksia-voi-nyt-ladata-tietolaari-palvelusta/) | Food-control inspection records for companies or premises, municipalities and local authorities. Free downloads may be reused with source attribution; available results cover up to six years and change as inspections are made. | **Reusable for the limited inspection cross-check, with attribution.** Not a restaurant directory or proof of current operation. Inspection results do not establish dietary/allergen suitability or provide a current menu. | Manually download/check when reviewing a record; consider a local batch refresh after confirming a stable export format. Do not build an app dependency on the download. |
| Restaurant's own branch page or locator | Current branch name/address, official site, hours, menu/feed links, and evidence the branch is still listed as operating. | **Link / verification only by default.** Review the particular operator's terms before copying locator data, menu content, photos, or dietary claims. A URL may be recorded as evidence; a public page is not a blanket data-reuse license. | Human check when adding a candidate, then recheck on a planned maintenance pass (suggested quarterly) or when a correction is reported. A crawler requires per-domain review and permission where required. |
| Restaurant-published menu feed or restaurant submission | Live menu links/feed; with operator permission, potentially menu, allergens/dietary data, hours, and image display rights. | **Permission needed.** Prefer first-party feeds and direct operator submissions. Store a link for live content; only cache menu or diet fields if the operator's permission covers the exact content, fields, duration and redistribution. Dietary/allergen information should be attributed and time-stamped, and users should be directed to verify with the restaurant. | Use the restaurant's documented feed schedule or refresh live at view time. Do not scrape arbitrary feed endpoints without checking terms and load limits. |
| [Lounastaja](https://lounastaja.fi/infopaketti/) JSON/RSS offering | Potential menu-feed integration; the provider describes JSON and RSS interfaces for published menus. | **Permission needed; terms/access/pricing unconfirmed.** Do not assume an API is public, free, or licensed for redistribution. | Ask the provider for the current API documentation, rate limits, price, and written permission before building an importer. |
| Menu aggregators such as [Lounas.app](https://lounas.app/), [Lounasopas](https://lounasopas.com/en), [Lounasaika](https://www.lounasaika.fi/en) and [Lunchmenu.fi](https://lunchmenu.fi/) | Leads to restaurants and their menu/feed pages. | **Not approved for automated reuse of their compiled listings or menu data.** Aggregators' statements that data came from public or restaurant sources do not grant us rights. Lounas.app's published terms restrict automated access that unreasonably loads the service or circumvents limitations. Follow each site's current terms; use a direct restaurant source instead. | No scheduled scraping. Follow a lead to the restaurant's own source and review that source separately. |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Simple_media_reuse_guide) | Possible restaurant/location images and creator/license records. | **Reusable per file only after review.** Check the exact file page, license, creator, source and attribution requirements; use only a license compatible with the intended display (for example CC0, CC BY or CC BY-SA, or explicit permission). Keep the image hosted by Commons and link to its file page. Search results alone are not approval. | Find and review images individually when adding a venue or replacing a broken link. Recheck the file page and remote link during maintenance. |
| Community correction or restaurant-owner submission | New venue leads and corrections; an operator may supply first-party details, feeds, diet/allergen info or an image. | **Permission needed for submitted content.** Ask submitters to cite evidence and confirm they have authority to license any contributed non-factual text/image for the intended reuse. Record validation date and source. | Review through a pull request; revalidate operation and links on the normal maintenance pass. |

## Local update workflow

1. Refresh leads locally with `npm run discover` and, optionally, `npm run discover:osm`. These commands write ignored review reports under `.local/`; neither command updates `data/restaurants.json`.
2. Review new candidates only. Confirm a specific branch still operates using a current official branch page or other credible current evidence. Do not repeatedly recheck unchanged, already-reviewed candidates without a reason.
3. Before using a new source, add it to this register with its exact fields, license/permission, attribution and refresh limits. Treat it as discovery-only until reuse is clear.
4. Add only supported fields to `data/restaurants.json`, with a source URL and `checkedAt` for each field. Set `validated` and `lastValidatedAt` only when current operation was actually checked.
5. Link to menu pages/feeds and images by default. Do not copy menu text, restaurant descriptions, photos, or dietary claims from arbitrary sites. Add data from a direct feed or operator only when the permission explicitly covers our intended use.
6. Run `npm run validate` and submit the changes for review. Structural validation does not verify sources, licenses, operation, or link health.

## Suggested review cadence

These are our maintenance targets, not source update guarantees:

- New candidate sweep: monthly or before a planned geographic expansion.
- Existing operation and website links: quarterly, plus user/operator corrections.
- Live menus: source/feed-defined refresh only after permission and technical limits are confirmed.
- Photos and licensing: check when adding/replacing and during link maintenance.
- Oiva and YTJ cross-checks: when useful for a specific record; don't treat their update frequency as branch-level freshness.

