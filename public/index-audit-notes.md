# Index cleanup audit — 2026-08-29

Before refactoring `index.html`, preserve all existing DOM IDs, form controls, visible labels, and user flows. The file contains inline application logic and duplicated calculation concerns. Refactor only after extracting the complete source and validating references.

Required post-refactor checks:
- no duplicate Meatfest calculation implementation in HTML
- no stale 2.2.3 references
- raw requirement remains mathematical requirement before purchase rounding
- 3.2 birds can display 16 lb raw requirement while recommending 4 birds
- canonical 48-eater Meatfest anchors remain 1 packer / 4 chuck / 2 butts / 5 racks / 8 sausage links / 4 chickens
- Family, Turkey, Prime Rib, Fish, and PBBE paths remain intact
