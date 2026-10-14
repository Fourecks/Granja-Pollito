# Controlled terrain coherence pass

The approved map is retained. This changes only dry/submerged rock texture, road surface rendering and crossing integration. The seven cliff profiles, height, coastline, water, islands, parcel outlines, historical road centerlines, ten bridge footprints and eight terrain passages are unchanged. All six terrain/navigation masks match the before-pass SHA-256 checksums.

## Rock and crossing materials

Replace regularly spaced masonry joints with irregular native-pixel facets, partially open vertical/diagonal fractures, interrupted strata, restrained moss, an uneven turf/earth rim, a shadow directly below that rim and a darker foot. Side rock beside the stairs uses exactly the same shaded material as the cliff. No extra height or new terrain geometry is introduced.

Underwater rock uses the same pattern with a darker, cooler wet palette. Its existing 30-world-unit fade, 13 chunks, 13,274 pixels and depth -28.5 are preserved underneath the existing water surface. The water's sampling palette is intentionally left unchanged: neither the water surface/bed nor the six-frame waterfall textures change. Before/after SHA-256 checks of every riverbed, water-depth and topographic waterfall canvas are identical. The independent foam and ripple code is untouched.

Seven stone stairs retain their existing treads with minor edge shadows/wear. They have no timber accessories. Native mask registration fills the former pale road gaps beside coastal stairs, which visually resembled ropes. The eighth terrain passage is the existing wooden fishing-pier transition; it remains wood. The timber post artwork is now restricted to rustic/rope bridges; four stone/arched bridges retain their decks and low stone edges without wooden posts. No bridge is removed, resized or relocated.

## Road/land classification and audit

The broad earth areas around the mixed barn, chicken area, greenhouse and rabbit area are reserved structure/enclosure parcels, not road widening. The soil rectangle is the crop parcel and the paved oval is the central plaza. All 18 zone shapes and surface masks are preserved, including the plazas, sand and decorative forest ground. Draw the 25 existing routes with rounded joins/caps at their original widths (20–36 world units); navigation, grass, plants and shore-root masks are not regenerated from this rendering correction.

| Segment | Classification / destinations |
| --- | --- |
| plaza-coop | Road: paved plaza ↔ chicken parcel |
| plaza-mixed | Road: plaza ↔ mixed barn parcel |
| mixed-cows | Secondary road: mixed barn ↔ cows; existing plaza bridge |
| plaza-cows | Road: plaza ↔ cows |
| plaza-crops | Road: plaza ↔ shared crop/greenhouse junction |
| crops-entry | Structure/parcel access: junction ↔ existing crop entrance |
| crops-greenhouse | Road: shared junction ↔ greenhouse parcel |
| plaza-home | Road: plaza ↔ house, connecting beach route |
| home-redil | Road: house ↔ sheep/goat parcel |
| redil-rabbits | Road: sheep/goats ↔ rabbit parcel and fishing route |
| coop-pandas | Road: chicken area ↔ panda sanctuary; existing panda bridge |
| mixed-north | Road: mixed barn ↔ north forest through existing bridge/stairs |
| cows-woodland | Road: cows ↔ woodland |
| forest-woodland | Secondary road: north forest ↔ woodland via existing stairs |
| panda-forest | Secondary road: panda sanctuary ↔ existing western logging clearing via west-pass |
| coop-ducks | Road: chicken area ↔ duck bank via duck bridge |
| ducks-lake | Shore access: duck bank ↔ western lake shore; now joins west-coast in a short loop |
| plaza-beach | Road/beach access: home junction ↔ existing sand below coastal stairs |
| lake-island | Secondary road: beach route ↔ lake island via existing rope bridge |
| island-beach | Secondary road: lake island ↔ existing beach via stone bridge/stairs |
| east-shore | Secondary road/coastal access: greenhouse ↔ existing sand above coastal cliff, using east bridge |
| fishing | Structure access: rabbit area ↔ existing fishing pier |
| coop-south | Secondary road: chicken junction ↔ shared lake/beach junction |
| home-south | Secondary road: house ↔ sheep/goats via existing house stairs |
| west-coast | Shore road: duck bank ↔ ducks-lake; former free grass end now closes a short loop |

Only three small terminal tie-ins are added visually: 68-unit west shore connection, 56-unit access to the existing stump at (1020,153), and 33-unit east coastal sand access. Every segment is walkable with the unchanged vegetation obstacle plan; no tree, stump, decoration, building, reserved parcel or physical road route moves. Beach paths may end in the beach's traversable sand; they do not need an invented structure. The fishing pier intentionally ends above fishing water: it is a pier, not a failed stone bridge. All nine bank-to-bank bridges have dry walkable endpoints and a real water crossing.

## Validation

- Production build and complete existing test suite pass: 124 routes / 14,313 navigation samples, 25 historical roads and 18 zones connected, task/interior/offline behavior preserved.
- All 14 historical topography geometry groups match the original fixture.
- Browser coverage: no missing cliff pixels, 25,385 wall pixels at water intersections, no bridge deck painting over a cliff, valid submerged mask/depth, all five waterfalls retained.
- 54 simulated worker/chick/cow crossings over all ten bridges and eight passages: all complete, no illegal navigation samples.
- Visual inspection: 12 sectors cover the whole map; individual views of all seven cliffs, ten bridges and eight passages. Desktop WebGL and mobile Canvas render without runtime errors (mobile Canvas about 54 FPS in this check).
- Every approved water/fall canvas and every land/water/surface/path/cliff mask matches its saved pre-pass checksum. General grass, surface and original water canvas textures also match.
