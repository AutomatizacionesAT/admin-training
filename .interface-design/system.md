# Interface design system

## Direction

Operational training calendar focused on helping coordinators scan upcoming
pending developments and narrow the list by campaign, owner, and schedule.
Keep the interface calm, compact, and information-first.

## Palette

- Slate surfaces and text establish hierarchy without competing with schedule data.
- Blue marks projected work and interactive focus states.
- Orange is a restrained accent for upcoming work and detail disclosures.
- White is the working surface; slate-50 distinguishes section headers.
- Use semantic colors only when they convey status.

## Depth

Use subtle shadows sparingly to separate major white work surfaces from the page.
Use low-contrast slate borders for table rows, controls, and section boundaries.

## Spacing and typography

- Use a 4px spacing base and multiples for component and section spacing.
- Use the existing sans-serif typeface.
- Use compact uppercase, tracked labels for table headers and filters.
- Use readable 14px body text and tabular numerals for counts and indexes.

## Data-table pattern

- Ground tables with a clear title, a short purpose statement, and a visible result count.
- Put related filters together above the data; derive filter options from the visible dataset.
- Keep headers sticky and table content horizontally scrollable for wide records.
- Show a concise empty state when filters yield no rows.
- Keep scan-critical columns visible and reveal secondary fields with an inline
  eye-button disclosure; include campaign imagery and all record fields inside.
- Group projected developments by campaign, client, and segment; show one
  expandable summary per group and keep every development's name and notes visible
  in its detail.
- Use a restrained blue zebra stripe, a stronger hover state, and a distinct
  orange-accented expanded row. Fix table column widths and truncate summary
  values so long names never push neighboring data out of place.
- Pair filter labels with meaningful icons and provide an explicit clear-filters
  action next to the result count.
