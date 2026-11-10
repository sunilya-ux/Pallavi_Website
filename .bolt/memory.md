# Project memory

## Product intent & audience

- Event marketing/registration site with an Event page (`/event`) showcasing a paid event (date: 31 Oct 2026).
- Includes homepage, dashboards, database, and edge functions (Supabase-backed).

## Brand personality & voice

- Production-quality, fully-featured pages; beautiful, non-cookie-cutter designs.
- Authoritative global design instructions live in `.bolt/prompt` (beauty, Tailwind, Lucide React, JSX).

## Visual design & UX direction

- Stack: Vite + React (JSX), Tailwind CSS, React hooks, Lucide React icons.
- Event page sections: hero, schedule, bonuses, "By the End of the Day" takeaways, "Real Wins" testimonials/results, pricing, FAQ.
- A reusable thank-you card component exists and is kept in code for future toggling.

## Decisions, constraints & rationale

- Event page visibility is controlled manually via `showThankYouPage` flag in `src/config/eventConfig.ts` (currently `false`).
- Removed automatic date-based switching (`isEventActive()` / `getIndiaToday() <= eventDate`) so the page never auto-changes when the event date passes.
- `showThankYouPage: false` → full event page; `true` → thank-you card only.
- Thank-you card component preserved (not deleted) for future reactivation.
- User strongly prefers scoped changes; do not alter unrelated pages, content, prices, links, dashboards, DB, or edge functions.
- Config file `src/config/eventConfig.ts` centralizes event settings (date, flags). `getIndiaToday()` helper implies India timezone handling.

## Open questions & assumptions

- No open questions from this turn.
- Assumed: Supabase powers database + edge functions (inferred from mention of those layers).