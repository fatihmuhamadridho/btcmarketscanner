## Repo Style

- Use a feature-based structure.
- Put UI in `src/features/<feature>/view`.
- Name main component files with `PascalCase`, for example `Home.tsx`, `HomeCard.tsx`, `Coin.tsx`, and `CoinChart.tsx`.
- Keep route files in `src/pages` thin.
- In `pages`, use direct re-exports from feature components when possible.
- Do not put large UI logic in route files.

## React / Next.js

- Export page components and main view components as default exports.
- For static Next.js pages, export `getStaticPaths` and `getStaticProps` from the feature file, then re-export them from the route.
- Use `next/link` and `next/head` as needed for the page.

## Styling

- Use Mantine as the main UI library.
- Prefer Mantine components over raw HTML elements when there is an equivalent.
- Keep the existing dark theme in `MantineProvider`.
- Keep the copy style mixed between English and Indonesian when the UI context already uses it.

## TypeScript

- Follow the existing strict TypeScript style.
- Type props explicitly when components become larger or reusable.

## Editor / Workflow

- Run lint after larger refactors.
