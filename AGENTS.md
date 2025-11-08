## Mission
Build a performant brochure-to-storefront site with Astro that showcases the restaurant, surfaces real‑time WooCommerce product data, and drives users into a streamlined purchase flow hosted on WordPress/WooCommerce.

## Tech Stack Guardrails
- Astro 5 with content collections for static copy; sprinkle React islands only for interactive widgets (menu filters, cart preview).
- Tailwind CSS (v4) for styling; keep tokens in `src/styles`.
- WooCommerce REST API v3 for products, categories, and stock; call from server-side Astro endpoints to keep keys private.
- Deploy targets: Astro static output + SSR adapters optional; ensure WooCommerce base URL and credentials live in environment variables.

## Operating Principles
1. Data first: cache WooCommerce responses (Redis/Vercel KV/File) with a short TTL to avoid rate limits.
2. Component library: shared UI primitives (buttons, cards, badges) live in `src/components/ui`.
3. Accessibility: aim for WCAG AA, semantic HTML, keyboard-first nav.
4. Internationalization-ready: copy lives in JSON/content collections, never hard-code strings in components.

## Agents & Responsibilities

### 1. Product Architect Agent
- Define site map (Home, Menu, Catering, About, Contact) and component hierarchy diagrams.
- Decide when to SSR vs. SSG each route based on data freshness.
- Produce schema for WooCommerce DTOs -> UI props conversion.

### 2. WooCommerce Integration Agent
- Configure `.env` variables (`WOO_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`).
- Implement `src/lib/woocommerce.ts` wrapper with typed helpers (`listProducts`, `listCategories`, `getMenuByTag`).
- Add Astro API routes under `src/pages/api/` that proxy Woo data to the client with caching + error handling.

### 3. UI/UX Agent
- Create Tailwind design tokens, spacing scale, typography.
- Build core layout (`src/layouts/BaseLayout.astro`) with header/footer + CTA banner.
- Deliver hero, featured menu carousel, category tabs, chef highlights, and testimonials.
- Ensure mobile-first breakpoints, animations limited to 200ms for snappy feel.

### 4. Content & SEO Agent
- Draft copy deck (value prop, story, CTA) and map to content collection entries.
- Configure metadata (`<title>`, `<meta>` tags, OpenGraph, JSON-LD for Restaurant schema).
- Plan blog/updates section fed via Markdown to boost SEO.

### 5. QA & Performance Agent
- Write Playwright smoke tests: navigation, product listing render, API proxy fallback.
- Add CI script for `npm run check && npm run test`.
- Monitor Core Web Vitals budgets (LCP < 2.5s, CLS < 0.1, TTI < 3s) using Lighthouse CI.

## Implementation Phases
1. **Foundation**: clean Astro starter, global styles, BaseLayout, environment handling.
2. **Data Layer**: WooCommerce client, API proxy routes, static typing, caching.
3. **Pages & Components**: develop sections iteratively, wire to data hooks.
4. **Interactions**: filters, favorites, sticky reservation CTA, cart preview linking to Woo checkout.
5. **Testing & Optimization**: automated tests, Lighthouse tuning, deployment checklist.

## Backlog Snapshot
- [ ] Define `.contentlayer` or Astro collections for menu stories.
- [ ] Implement `/api/products` with category + dietary query params.
- [ ] Build `MenuSection` component consuming the API via `Astro.fetch`.
- [ ] Add "Order Now" flow: product selection -> deep link to Woo checkout with prefilled cart.
- [ ] Configure deployment secrets and document rotation.

Keep AGENTS.md updated whenever responsibilities change or a phase completes.
