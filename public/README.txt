V2.2.3 hotfix: the deployed HTML shell had retained the older Family-mode rib display function even though app.js contained the corrected half-rack logic. The inline index.html function is now corrected too.

MEATFEST APP 2.2.1

V2.2.1 RIB PURCHASE-UNIT FIX
-----------------------------
Family-mode ribs now expose the actual half-rack purchase increments instead of only
showing the equivalent whole-rack count. Examples: 1 half-rack, 1 rack (2 half-racks),
3 half-racks (1½ racks total), etc. The underlying 2.25 lb/rack planning unit and
70% yield are unchanged. Rounding always moves up to the next half-rack, so the
calculator never recommends less raw rib weight than the modeled requirement.

Deep validation performed:
- JavaScript syntax check: PASS.
- Exact half-rack threshold tests: PASS.
- 0.1–30.0 lb raw-requirement boundary sweep: PASS.
- Every result is a valid 0.5-rack increment and never underbuys.
- Family purchase paths for pork, brisket, ribs, prime rib, brats, fish, chicken,
  and burnt ends remain callable and return practical purchase units.
- Meatfest/non-family code path remains separate from family purchase logic.

Purpose
-------
V2.1.0 preserves the validated V2.0 side quantity model and V1.8.2 protein/yield
engine while correcting the side recommendation engine and fixing low-headcount side scaling.

RECOMMENDATION ENGINE
---------------------
Recommendations are driven by the selected protein AND the selected preparation.
Section 4 (Pick Your Sides) and Section 5 (Shopping List) use the same
sideRecommendation() function so there is one source of truth.

Examples:
- Whole Fryer — Pulled chicken can recommend Hawaiian Rolls.
- Leg Quarters and Bone-In Thighs do not recommend Hawaiian Rolls.
- Pulled Pork and Brisket can recommend Hawaiian Rolls.
- Polish / Brats recommend Sauerkraut.
- Baked Beans remain intentionally unhighlighted because Meatfest history shows
  chronic overproduction.

Recommendations are guidance only. They do not auto-select sides and do not
change side quantities, protein yields, headcount, or purchase-unit math.

V2 SIDE MODEL
-------------
The side model is Meatfest-specific. It is based on:
- Public serving/yield research as the quantitative starting point.
- Meatfest full scoop planning volume: approximately 3/8 cup.
- Meatfest tasting scoop planning volume: approximately 1/4 cup.
- 2.5-inch-deep 12 x 9 half tins; full tin = two half tins; quarter tins supported.
- Mac & Cheese and Cauliflower Mac are filled nearly to the top.
- Wet/slosh-prone sides leave thumb clearance for handling.
- Practical output units: recipe(s), full/half/quarter tin, ear(s), piece(s), package(s).
- Consumption units are separated from purchase/preparation units.
- Meatfest is modeled as a feast: enough food to avoid running out, with modest useful leftovers.
- Number of proteins reduces side demand; fewer proteins increases side demand.
- More selected main sides create variety dilution, but anchor sides are less affected.
- Historical Meatfest calibration is built into the starting values.

Historical calibration encoded in 2.0
------------------------------------
- Regular Mac: 1/2 tin ran out in 2024 -> V2 minimum 3/4 tin at baseline scale.
- Cauliflower Mac: full tin had leftovers -> V2 starts at 3/4 tin.
- Coleslaw: double recipe ran out in 2024; one recipe serves 6-8 standard portions -> V2 baseline is 2.5 recipes.
- Collards: historically overproduced, then reduced and later ran out -> V2 baseline 1.25 recipes and low desired-leftover tolerance.
- Broccoli Salad: one recipe ran out without disappointment -> V2 baseline 1 recipe.
- Cucumber Salad: one recipe ran out without disappointment -> V2 baseline 1 recipe.
- Sauerkraut: approximately 25% left -> V2 baseline 1/2 tin, with a pairing boost for Polish Brats and low leftover tolerance.
- Baked Beans: chronic overproduction -> V2 starts at 1/2 tin and is not highlighted as a recommendation.
- Corn: half-ear serving; historical quantity was intentionally reduced -> V2 baseline 7 ears.
- Cornbread: separate BBQ accompaniment pool; plan pieces, not side-scoop competition.
- Hawaiian Rolls: separate sandwich pool; plan pieces, then convert to whole packages.

IMPORTANT
---------
Recipe-based quantities are expressed as recipe(s), not batches. The calculator's
starting recipe counts are practical Meatfest planning assumptions. They can be
calibrated later when exact recipes/yields are entered without changing the core
behavior model.

REGRESSION CHECK
----------------
JavaScript syntax check: PASS.
Recommendation-engine regression checks:
- Whole Fryer — Pulled + Fish: Hawaiian Rolls recommended.
- Leg Quarters + Fish: Hawaiian Rolls not recommended.
- Bone-In Thighs + Fish: Hawaiian Rolls not recommended.
- Polish Brats + Brisket + Pulled Pork: Sauerkraut and sandwich pairings recommended.
Protein calculations and side quantity formulas were not changed in V2.0.2.


V2.0.2 UI FIX
--------------
Section 4 side recommendation badges are now refreshed whenever a protein is
selected/deselected or its preparation changes. Section 4 and Section 5 both
use the same sideRecommendation() function; the fix only synchronizes the
Section 4 display with the already-correct recommendation engine.

Regression validation:
- Recommendation function unchanged from V2.0.1.
- Side quantity function unchanged from V2.0.1.
- Protein/yield calculation unchanged from V2.0.1.
- Protein selection and preparation-change handlers now call renderSideCards().
- Service-worker cache version bumped to 2.0.2 to prevent stale UI code.


SIDE QUANTITY FIX
------------------
The prior V2.0.2 side model had practical minimums set equal to the 47-person
anchor quantities. That caused the calculator to remain at the 50-person
quantities even for much smaller events. V2.1.0 keeps the validated 47-person
anchor quantities and lets demand scale downward, with lower practical floors:
quarter-tin minimums for tin sides, half-recipe minimums for recipe sides,
12 pieces for cornbread, and 8 pieces for Hawaiian rolls. Purchase/package
rounding remains a separate final step.


V2.1.0 reset behavior: Reset clears saved event details, resets event name to "Your Event", resets the event date to today, clears adults and kids, removes all protein and side selections, clears the guest list, returns to manual headcount, and restores Standard (1/3 lb/person) as the default portion setting.


V2.1.0 fix: recommendation badges in the side-selection panel remain visible after a recommended side is selected, matching the recommendation status shown in the shopping list.

V2.1.0 AUDIT CORRECTIONS
- Restored Meatfest 4.0 empirical purchase units: whole fryer 4.5 lb, bone-in Boston butt 8.5 lb, Prime Rib 5 lb, ribs 2.25 lb/rack.
- Restored fish to a filet-based purchase unit of approximately 1/3 lb per filet while preserving the 76% yield and 1/4-lb finished serving model.
- Preserved the validated V2 recommendation engine, side model, reset behavior, original 1–7 protein multiplier table, and Whole Hog 40/45/50% logic.
- Whole Hog remains a feature-protein-only scenario; no multi-protein dilution is applied beyond its own one-protein multiplier.


V2.1.1 FULL AUDIT CORRECTIONS
------------------------------
- Fixed portion-selector math: Light / Standard / Generous now pass the selected portion setting into the multiplier engine correctly.
- Extended the empirical protein multiplier table to 8 non-hog proteins. The 8-protein values are conservative extrapolations from the last three validated Meatfest points and are marked as such for future calibration.
- Whole Hog is now exclusive: it cannot be combined with another protein. Selecting Whole Hog clears other proteins; selecting another protein clears Whole Hog. This matches the Meatfest rule that a hog is the feature protein and only sides accompany it.
- Whole Hog planning is now based on hanging weight, not a headcount yield switch. The model translates the original Meatfest 4.0 40/45/50% yield bands into hanging-weight anchors under the standard 1/3-lb model (about 41.7 lb @ 40%, 55.6 lb @ 45%, and 66.7 lb @ 50%), then increases yield with size more gradually to 55% @ 100 lb and 60% @ 150 lb and above.
- Whole Hog is solved as a hanging-weight/yield relationship so the yield depends on the hog size being purchased.
- Whole Hog output explicitly says hanging weight and displays a cooker-capacity warning above 100 lb. The 100 lb figure is a reminder, not a hard limit.
- Corrected the Whole Hog purchase note from dressed weight to hanging weight.


V2.1.2 SIDE SCALING / REFRESH FIX
-----------------------------------
- Fixed stale side-shopping-list results when adults, children, serving size,
  guest mode, or protein selection changes. The side list now recalculates from
  the same current state as the meat calculation.
- Corrected low-headcount floors: the 47-person historical values remain
  calibration anchors, not hard minimums. Practical minimums are defined by each
  side's min value and final unit rounding.
- Protein/yield math, Whole Hog hanging-weight logic, cooker warning, mutual
  exclusion, recommendations, and reset behavior are otherwise unchanged.


V2.2.0 REGRESSION FIX
---------------------
Fixed a headcount-to-side refresh regression in the deployed inline calculator:
the protein calculation recalculated on headcount changes, but Section 5 side
quantities were only refreshed on initial render. The side recalculation is now
executed inside calc(), so selected side quantities update whenever adults,
kids, serving size, or other calculation inputs change.

Validation performed after the fix:
- 10, 40, and 100 adult scenarios: protein and selected side quantities update.
- 1-protein brisket scenario: side quantities scale with headcount.
- Whole Hog remains mutually exclusive with other proteins.
- Hog cooker-capacity reminder remains present above typical 100-lb hanging weight.
- JavaScript syntax check passes.


V2.2.3: Family-mode ribs use true half-rack purchase increments and display the half-rack count explicitly (e.g. 4 half-racks = 2 full racks). Service-worker cache bumped to 2.2.3.
