# Repo Rules

## Feature Structure

- Use a feature-based structure under `src/features/<feature>`.
- Keep UI in `src/features/<feature>/view`.
- Keep feature contracts and UI-facing types in `src/features/<feature>/interface` as `*.interface.ts`.
- Keep feature logic in `src/features/<feature>/logic` as `*.logic.ts`.
- Keep domain and infrastructure code in their own layers.
- Keep `src/pages` thin and prefer direct re-exports from feature page components.

## Layer Boundaries

- Only `pages` and `logic` may import from `domain` or `infrastructure`.
- `atoms`, `molecules`, `organisms`, and `templates` must stay presentational.
- Do not put business logic in `atoms`, `molecules`, `organisms`, or `templates`.
- Do not import domain types directly into `view` files.
- If a UI component needs shared data shape, define it in `src/features/<feature>/interface`.

## View Layer Rules

- Treat `view/pages` as the orchestration layer.
- Page logic may include:
  - data fetching hooks
  - context reads and writes
  - mapping domain data into UI props
  - pagination or selection state
  - handler wiring
- Pages should usually pass props into a single template component.
- `view/templates` is the top UI composition layer.
- `view/templates` may render `<Head>` when the metadata belongs to that page composition.
- `view/organisms`, `view/molecules`, and `view/atoms` must remain presentational and only use UI-facing interfaces.

## Naming

- Name component files with the layer suffix:
  - `*.atom.tsx`
  - `*.molecule.tsx`
  - `*.organism.tsx`
  - `*.template.tsx`
  - `*.page.tsx`
- Keep the component name in PascalCase before the suffix.
- Apply the same naming pattern to shared components in `src/common/components` when they are part of the atomic UI layer.

## UI Composition

- Prefer Mantine components over raw HTML when there is an equivalent.
- Use raw HTML only when Mantine does not fit the use case.
- Keep components small and purpose-specific.
- Split UI by responsibility:
  - `atoms` for small visual pieces
  - `molecules` for reusable grouped UI
  - `organisms` for larger sections
  - `templates` for page composition
  - `pages` for data and state orchestration

## Styling

- Keep styling local to each component.
- Avoid one shared styling file for multiple components.
- Use inline styles or Mantine `styles` / `vars` only when the component API needs it or the style cannot be expressed reliably with Mantine props.
- If a Mantine component is hard to override, prefer the component’s own style API before adding hacks.

## TypeScript

- Follow strict TypeScript practices.
- Type props explicitly once a component becomes reusable or non-trivial.
- Keep UI-facing interfaces in `interface`.
- Keep helper functions out of `interface`; put them in `logic`.
- Prefer `import type` for types that are only used at compile time.

## React / Next.js

- Use `next/head` where page metadata belongs to the feature composition.
- Keep route files thin.
- Use default export for page components only when the route requires it.
- Prefer named exports for feature components and helper hooks.
- Keep React Query configuration close to the feature hook.

## Workflow

- Run lint after larger refactors.
- Run TypeScript checks before finishing work.
- Do not run production builds unless the user explicitly asks for it.
- Leave `build` to the user.

## Git

- Do not run `git add` unless explicitly requested.
- When asked to commit, write a message that reflects the actual changes.
- Before every commit and push, bump the `version` field in `package.json`.
- Choose the version bump based on the change scope:
  - `patch` for small fixes, refactors, and internal cleanup
  - `minor` for new backward-compatible features
  - `major` for breaking changes
- Push only when the user asks for it.
