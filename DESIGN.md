# Owen's field notes

## Scope

The personal site presents Personal Workstation, Tingdong, language-learning and the cat-host experiment. No company projects, recruiting language, fabricated metrics, or unpublished notes. Existing tools, authentication and support/legal routes remain available. This branch is a local design preview, not deployment authorization.

## Visual direction

A hand-kept index of real work. Use strong plain typography, ink lines, blue working marks and a few deliberately odd, project-specific objects. Keep the page legible and a little playful; avoid faux paper, generic inspirational slogans, decorative English, soft gradients, tilted cards and ornamental icons. Each project visual should resemble its actual medium: task flow, subtitle, vocabulary card or storyboard. These are clearly illustrations, not product screenshots. There are no fake live statuses or simulated success counters.

Shared styles live in `src/app/studio.css`, scoped to studio components. Existing tool/legal page styles stay in `globals.css`. Reuse Link, the existing MarkdownView and authentication helpers; common studio elements live in `components/studio`. Project content has one source in `lib/projects.ts`.

## Reading and interaction

- Main navigation: projects, notes, about; identity links home. Tools and account access remain secondary.
- Home: an opening naming actual interests, an interactive index of four open threads, three developed projects, a clearly early experiment, real published notes.
- Projects: category filters; stable detail pages; accurate status and open questions.
- Notes: actual Markdown content only; tags and series continue to work; no invented or automatically published articles.
- About: interests and existing public links, no invented career facts or contact details.
- Keyboard-visible focus, native controls, meaningful names, 44px touch targets, reduced-motion support, and 320px layout are required.
- Unavailable content gets a useful empty state, never fake sample articles. Illustrations remain static unless explicitly selected; no autoplay/audio/paid generation.

## Editorial boundary

The content reader excludes draft/private material and known company references from both indexes and direct article lookup. This is an editorial exclusion, not a guarantee of comprehensive data-loss prevention. The original content repository is not modified. New article-to-project links use optional `projects` frontmatter with known project slugs.

## Validation

Build and typecheck; automated tests for the project catalog, content exclusions, direct lookup, draft handling, project relations and empty content; browser review of desktop/mobile, keyboard navigation, project filters, article filters, detail links, legacy support/tool pages and login entry. Do not call model APIs or test production mutations.
