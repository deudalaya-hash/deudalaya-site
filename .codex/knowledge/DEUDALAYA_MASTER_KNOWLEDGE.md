# Deudalaya Master Knowledge Base

**Purpose:** Give Codex a durable, evidence-aware reference for Deudalaya's identity, cultural mission, current website, and platform direction.

**Last reviewed:** 2026-11-06  
**Project root inspected:** `C:\deudalaya`  
**Evidence labels:** `User-provided`, `Code-observed`, `Publicly reported`, `Historical`, and `Unverified` describe provenance, not importance. Public reports describe what a source says; they do not automatically establish historical fact.

## Table of contents

1. [Executive Summary](#1-executive-summary)
2. [Company Identity](#2-company-identity)
3. [Company and Product Hierarchy](#3-company-and-product-hierarchy)
4. [Layapur — City of Spaces](#4-layapur-city-of-spaces)
5. [Complete Product Portfolio](#5-complete-product-portfolio)
6. [Deudalaya Overview](#6-deudalaya-overview)
7. [Deudalaya Phase 1 — Physical Community](#7-deudalaya-phase-1-physical-community)
8. [Deudalaya Phase 2 — Digital Expansion](#8-deudalaya-phase-2-digital-expansion)
9. [Brand Identity and Mission](#9-brand-identity-and-mission)
10. [Business Model](#10-business-model)
11. [Technical Architecture](#11-technical-architecture)
12. [Firebase Target Architecture and Configuration Status](#12-firebase-target-architecture-and-configuration-status)
13. [Supabase Existing / Legacy Integration](#13-supabase-existing-legacy-integration)
14. [GitHub and Repository Inventory](#14-github-and-repository-inventory)
15. [AI Workforce](#15-ai-workforce)
16. [Codex Skills](#16-codex-skills)
17. [Human Workforce](#17-human-workforce)
18. [Hiring and Recruitment Strategy](#18-hiring-and-recruitment-strategy)
19. [Development History](#19-development-history)
20. [Product Roadmap](#20-product-roadmap)
21. [Security and Operational Risks](#21-security-and-operational-risks)
22. [Unresolved Questions](#22-unresolved-questions)
23. [Evidence Register](#23-evidence-register)
24. [Instructions for Future AI Agents](#24-instructions-for-future-ai-agents)

## 1. Executive Summary

**Deudalaya Pvt. Ltd.** is the company identified by its owner as operating **लयपुर (Layapur), “City of Spaces.”** Layapur is the core product and brand: a proposed ecosystem of spaces for different communities and activities. **देउडालय (Deudalaya)** is one space in that ecosystem. Its user-defined model has two connected phases: Phase 1 builds the physical cultural community; Phase 2 extends its connections and work through digital tools.

The local Git repository at `C:\deudalaya` contains a deployed-target static website/PWA implementation for Deudalaya and several sibling app prototypes, plus a Layapur concept/prototype page. That code demonstrates product work; it does not establish that all spaces are launched, that physical gatherings currently operate on a particular schedule, that the company is legally registered, or that backend services are live.

The user has selected Firebase as Deudalaya's intended backend. No Firebase SDK, project config, rules, functions, or connection was found in the inspected codebase; its configuration and production readiness remain **unknown / requires confirmation**. Deudalaya's current code does contain a Supabase integration for authentication, `feed_posts`, and video Storage. Treat this as existing/legacy code to account for in a future authorized migration, not as the intended target. Do not delete Supabase code or change production data without explicit permission.

The company hierarchy, Layapur identity, Deudalaya’s place in it, and its physical/digital phases are user-provided. Product statuses and implementation claims below are classified separately. This document is an evidence-aware reference, not proof of corporate registration, live services, or commercial performance.

## 2. Company Identity

| Claim | Classification | Boundary |
|---|---|---|
| Company name: **Deudalaya Pvt. Ltd.** | `USER-PROVIDED` | The owner identifies this as their company. No company registration certificate or government registry evidence was inspected. Legal registration, jurisdiction, address, directors, and ownership percentages are `REQUIRES CONFIRMATION`. |
| Deudalaya Pvt. Ltd. operates the Deudalaya project and Layapur product ecosystem. | `USER-PROVIDED` | Do not infer subsidiaries, legal ownership instruments, or separate registered entities. |
| Core product and brand: **लयपुर — Layapur**; identity: **City of Spaces**. | `USER-PROVIDED` | This is the product hierarchy to use for company planning and future work. It is not proof that a complete technical ecosystem is deployed. |
| Project/community: **देउडालय — Deudalaya**. | `USER-PROVIDED` | A community space within Layapur, operated by the company. The root website is its current local implementation, not the total identity of the project. |

Do not substitute the Deudalaya mission, motto, or cultural identity for Layapur’s company-wide product identity. Preserve both levels distinctly.

## 3. Company and Product Hierarchy

```text
DEUDALAYA PVT. LTD.                 Company / user-identified operator
└── लयपुर — LAYAPUR                 Core product and brand: “City of Spaces”
    ├── देउडालय — DEUDALAYA         Cultural and community space
    │   ├── Phase 1: Physical Community
    │   └── Phase 2: Digital Expansion
    ├── शब्दलय — Sabdalaya
    ├── चलचित्रलय — Chalchitralaya
    ├── phoneलय — Phonelaya
    ├── कक्षालय — Kakshyalaya
    └── Other future spaces (only when confirmed)
```

Non-negotiable interpretation: Deudalaya Pvt. Ltd. is the company; Layapur is the core product/ecosystem; Deudalaya is one space and community within Layapur. Layapur and Deudalaya are not interchangeable. Do not describe Deudalaya as the parent company or invent subsidiaries. The user identifies the listed sibling spaces as Layapur spaces; their current implementation boundaries remain separate app directories in one repository.

## 4. Layapur — City of Spaces

Layapur is user-defined as an ecosystem of spaces, platforms, experiences, and communities organized around different purposes, interests, audiences, and activities. The root repository includes `index2.html` and `layapur.webmanifest`; the page presents a Layapur identity and an install flow, and its embedded directory describes many spaces. This is evidence of a **prototype/concept map**, not proof that those spaces have separate products, operators, customers, or active services.

The Layapur page includes this concept directory in Nepali: FACEलय, शब्दलय, Websiteलय, CONCERTलय, देउडालय + चियालय, अन्नालय, हाटालय, PodCastलय, किताबालय, साहित्यालय, देउडालय / Deuda Theatre, Appaलय, कवितालय, रचनालय, रारा + देउडालय + ध्यानालय, बडिमालिका + देउडालय + ध्यानालय, गणितालय, मौनालय, भावालय, कलालय, कपासालय, IDEAलय, शिखरालय / Everest–Pokhara, चित्रालय, Crochetलय, AI शिक्षालय, AIलय, अङ्ग्रेजी शिक्षालय, K-लय / K-Theory, देउडालय / Poetea, कल्पनालय, साइपाल हिमाल + अन्तरिक्षालय, कलाकारालय, देउडालय + NDL, रारा ध्यानलय, चलचित्रालय, स्मृतिलय, आवाजालय, दृश्यालय, साँझलय, कृष्णालय, ज्ञानलय, त्रिनेत्रलय, बासुलय, Graffitiलय, पुष्पलय, झुम्कालय, वर्षालय, Adiyogiलय, the Mallलय, खस सभ्यतालय, नारायणालय, यात्रालय, विज्ञानालय, Gen-Z सहिदालय, तस्बिरालय, UNIVERSEलय, गन्तव्यालय, ड्रोनालय, बाँसुरिलय / धुनालय, प्रतिबिम्बालय, लयपुरलय, माटोलय, काष्ठलय, शिलालय, गृहलय, बाध्यालय, नाटकालय, HOMESTAYलय, HELLOलय, व्यापारालय, कक्षालय, रूमलय, शुभविवाहालय, औषधालय, इलेक्ट्रोनिक्सालय, प्रतिकालय, and सम्पर्कालय. These labels/descriptions are `CODE-OBSERVED` in the prototype; their independent operation, audience, delivery model, business status, and legal availability remain `UNKNOWN` unless separately confirmed.

Names such as Syllabusलय and Blogलय occur in the task’s historical references or old/demo material, but no corresponding standalone implementation was found in the inspected local project. Concertलय, बासुलय, यात्रालय, and भावालय appear in the Layapur prototype’s concept directory. A prototype card or backup file does not promote a concept to an active product.

## 5. Complete Product Portfolio

Status vocabulary: `ACTIVE` means a working product/service and operation have evidence; `IN DEVELOPMENT` means ongoing implementation evidence; `PROTOTYPE` means a runnable or viewable prototype; `PLANNED` means a stated plan; `CONCEPT ONLY` means a name or proposal without a standalone implementation; `ARCHIVED` means explicitly retired; `UNKNOWN` means evidence is insufficient. A repository file alone is not evidence of public launch.

| Space / status | Identity, purpose, audience, and problem | Code-observed implementation, repository, stack, dependencies | Gaps and plausible next steps / model |
|---|---|---|---|
| **Layapur — PROTOTYPE** | User-defined City of Spaces ecosystem. Audience and customer segments are not yet validated. | Root `index2.html`, `layapur.webmanifest`; static HTML/CSS/JS and a concept directory/install flow. Same `deudalaya-hash/deudalaya-site` repository. No separate backend observed. | Confirm positioning, prioritize a small number of spaces, define common navigation/identity, and decide whether spaces share services. Potential sponsorship, memberships, marketplace, or services are `POTENTIAL`, not current revenue. |
| **देउडालय — IN DEVELOPMENT** (cultural community status: `USER-PROVIDED`; web app code: `CODE-OBSERVED`) | Cultural community space grounded in Deuda and Karnali/Sudurpashchim identity; the community is broader than the video website. | Root `index.html`, `social.js`, audio scripts, `assets/`, PWA manifest/service worker; static HTML/CSS/vanilla JS with existing Supabase client calls and TUS upload code. Firebase is the user-selected target but has no implementation/configuration observed. Test files under `tests/`. | Live backend and community operations need owner verification. Priorities: inspect Firebase project/config, design a safe migration plan, and establish consent-based archive/community workflows. Do not remove legacy code or change production data without explicit permission. |
| **शब्दलय — Sabdalaya — PROTOTYPE** | Audio/voice and story space; the manifest describes a shared Nepali voice/story feed. Intended audience and validated problem are not documented. | `sabdalaya/`; static HTML/CSS/JS, audio demo/recording interactions, manifest, scoped service worker, and tests. Interactions explicitly label demo-only behavior; no server backend observed in this app. | Define rights/consent, persistent storage, accounts, moderation, and creator workflows before launch. Sponsorship, subscriptions, or audio services are `POTENTIAL`. |
| **चलचित्रलय — Chalchitralaya — PROTOTYPE** | Nepali cinema/story discovery concept; manifest calls it a cinema space for Nepali stories. | `chalchitralaya/`; static HTML/CSS/JS, catalog/search/watchlist/demo scene, manifest, scoped service worker, tests. Watchlist/resume are session-backed demo behavior. UI states full-film viewing as unavailable pending licensed media, accounts, secure storage, and ticketing. | Obtain licensed films and distribution permissions; decide catalog, payments/ticketing, accounts, and secure playback. Ticketing/subscriptions are `POTENTIAL`, not live. |
| **phoneलय — Phonelaya — PROTOTYPE** | Contact backup/restore concept for people changing devices. | `phonelaya/`; static HTML/CSS/JS, contact parsing utilities for VCF/CSV, sample contacts, import/export UI, PWA manifest/worker, tests. No cloud backend observed. | Verify actual persistence, encryption, data deletion, and privacy disclosures before real contacts are used. Paid backup/support is `POTENTIAL`; do not upload contacts without an approved privacy/security model. |
| **कक्षालय — Kakshyalaya — PROTOTYPE** | Shared learning home; manifest/page presents class selection and classes 1–10. Audience: learners, but actual curriculum/providers are not documented. | `kakchhayalaya/`; static HTML/CSS/JS, class-selection route, manifest, scoped worker, tests. No LMS backend or course catalog confirmed. | Confirm educators, curriculum, age/privacy safeguards, content delivery and moderation. Courses, tutoring, or institutional partnerships are `POTENTIAL`. |
| **Syllabusलय — UNKNOWN** | Historical reference supplied in the task; purpose/audience not established by local files reviewed. | No local `syllabuslaya` directory or code found in `C:\deudalaya`. User cited historical repository `deudalaya-hash/syllabuslaya`; repository contents/status were not accessed or verified. | Requires repository access and owner confirmation before assigning a status, features, or business model. |
| **CONCERTलय, Blogलय, बासुलय, यात्रालय, भावालय, and other Layapur map entries — CONCEPT ONLY** | Prototype directory entries indicate ideas around concerts, blogs, flute/music, travel, feelings, and many other interests. | Labels/descriptions appear in `index2.html`; Bloglaya also appears in older demo/backup material. No standalone app was verified for these names. | Treat each as a hypothesis. Audience, feature set, website, stack, owner, feasibility, and business model are all `UNKNOWN`/`REQUIRES CONFIRMATION`. |
| **jack-portfolio — separate / UNKNOWN Layapur relationship** | A personal portfolio project; it is not identified in user-provided hierarchy as a Layapur space. | `jack-portfolio/`; React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide; package scripts for dev/build/preview. | Keep separate unless the owner confirms its relationship. Do not count it as a Layapur product or company asset based only on co-location. |

The root repository is a monorepo-like collection of separately scoped directories; there is no evidence here of separate GitHub repositories or independent production deployments for the sibling spaces. Product names, domain routes, and manifest metadata provide directory/app identities, not live hosting verification.

## 6. Deudalaya Overview

Deudalaya is a cultural and community space within Layapur. The physical community is its foundation; digital tools extend participation, documentation, and connection. It should never be reduced to “a video-sharing app.” The current root website is one implementation of Phase 2.

The user-provided definition, vision, motto, and objectives are recorded in Section 9 and in the preserved cultural/brand notes below. Current cultural activities and schedules should be treated as user-provided until dated, direct evidence confirms them.

## 7. Deudalaya Phase 1 — Physical Community

Phase 1 is the user-described physical foundation: Friday Deuda gatherings; community building; connections between people from Karnali and Sudurpashchim; cultural preservation and promotion; Deuda music and dance; local traditions and heritage; friendships and social connection; participation, events, and activities. These express organizational intent. This local code review did not verify the present schedule, locations, attendance, event continuity, consent processes, or operating capacity. Do not turn the user-provided Friday gathering description into a current public event listing without confirmation.

## 8. Deudalaya Phase 2 — Digital Expansion

| Capability | Evidence/status in inspected repository |
|---|---|
| Website/feed and PWA identity/install behavior | `CODE-OBSERVED`: root HTML, manifest, and service worker. The code implements UI/install flows; production behavior was not tested here. |
| Local cultural video feed/playback | `CODE-OBSERVED`: local media assets and feed code. Preserve media as user content. |
| Account registration/sign-in/session UI | `CODE-OBSERVED`: current browser code calls Supabase Auth. Firebase Authentication is part of the intended backend direction, but no Firebase implementation/configuration or successful live operation was verified. |
| Profiles and creator interactions | `CODE-OBSERVED`: profile UI and Supabase queries/mutations in `social.js`; live schema/policy and successful end-to-end use are unverified. Firebase replacement design is `PROPOSED / REQUIRES CONFIRMATION`. |
| Remote feed posts and video Storage | `CODE-OBSERVED`: existing `feed_posts` query and `videos` Storage calls. Production table, bucket, access policy, media availability, and playback authorization are unverified. Firebase Firestore/Storage target schema is not yet established. |
| Video uploads | `CODE-OBSERVED`: 50 MiB client guard, MP4/WebM interface and resumable TUS transfer code, and admin-claim UI guard. Successful production upload and server enforcement are unverified. |
| Likes/comments/follows/bookmarks | UI/client code and proposed migrations exist; classify as `CODE-OBSERVED / PROPOSED`, not confirmed live features. Some UI states explain backend dependency or demo limitations. |
| Moderation/admin controls | Browser-side `app_metadata.role=admin` check and proposed SQL controls exist. No deployed RLS/Storage policy or trusted admin assignment is verified. |
| Digital archive, business promotion, broad community discovery, national/international network | `USER-PROVIDED / PLANNED`; implementation not established by inspected root code. |

Core principle: **“Phase 1 builds the community. Phase 2 connects, expands and empowers that community through technology.”**

## 9. Brand Identity and Mission

### Deudalaya space identity — user-provided

- Definition: “कर्णाली र सुदूरपश्चिमको उत्पादन, कला, संस्कृति, इतिहास, भाषा, साहित्य, सीप र पहिचानलाई संरक्षण, प्रवर्द्धन र विश्वसामु चिनाउने साझा अभियान”
- Vision: “कर्णाली र सुदूरपश्चिमको उत्पादन, कला र संस्कृतिलाई राजधानीबाट देश हुँदै विश्वसम्म।”
- Motto: “One Circle • One Nepal”
- Objectives: preservation/promotion of Khas civilization; arts, culture, creativity, education, research, and innovation; local products and entrepreneurship; connections between Karnali/Sudurpashchim, Nepal, and the world.

These are the owner's supplied positioning, not verified legal mission text. Layapur's company-wide product identity remains **City of Spaces**. Keep the brands distinct, and avoid flattening regional communities or Deuda traditions into a single uniform culture.

## 10. Business Model

No audited revenue, profit, valuation, investment, customer/user numbers, subscriptions, ticket sales, advertising receipts, or partnerships were found in the inspected local files. Company registration and legal jurisdiction are `REQUIRES CONFIRMATION`.

| Opportunity | Status | Evidence/condition |
|---|---|---|
| Cultural events, sponsorship, and partnerships | `POTENTIAL` | User's project positioning and historical social-profile text describe sponsorship/partnership interest; current agreements or income are not verified. |
| Local product/business promotion and marketplace services | `POTENTIAL` | User-provided product direction and concept entries such as व्यापारालय/अन्नालय/हाटालय; no operating marketplace/payment system verified. |
| Creator/community subscriptions or digital services | `POTENTIAL` | No live billing or subscription system observed. |
| Film ticketing/distribution | `POTENTIAL` | Chalchitralaya UI explicitly says full-film viewing/ticketing requires licensed media and service infrastructure. |
| Education/tutoring | `POTENTIAL` | Kakshyalaya concept/prototype; no confirmed course delivery or payment. |
| Contact backup, AI services, events, ticketing, commerce, advertising | `POTENTIAL` | Ideas only unless verified in an actual service or company record. |
| Current revenue, profit, investment, valuation, ownership, customer base | `UNKNOWN / REQUIRES CONFIRMATION` | Do not invent or estimate. |

## 11. Technical Architecture

### Deudalaya root app

- Static site architecture: root `index.html` contains the feed, substantial inline CSS/JavaScript, auth and upload UI; `social.js` contains shared profile/engagement behavior; `deudalaya-audio.js`/`.css`, assets, manifests, and other UI files support it. No root `package.json` or root bundler/build script was found.
- Hosting target is documented as GitHub Pages. `CNAME` contains `deudalaya.com`; the configured Git origin points to `deudalaya-hash/deudalaya-site`. These local facts do not verify current GitHub Pages settings, deployment health, DNS, TLS, or public behavior.
- PWA: `manifest.webmanifest` identifies Deudalaya and root scope; `sw.js` is root-scoped and caches a small static shell. Do not change scope/install behavior without an approved, tested reason.
- Tests: `tests/` contains 27 Node built-in `.test.cjs` tests in this checkout. There is no root package manifest or CI workflow found. Tests are regression checks, not evidence of production backend/mobile behavior.
- No monitoring/alerting, operational backup schedule, disaster-recovery test, centralized server, or analytics system was verified in repository configuration.

### Sibling applications and Layapur

Sibling apps are isolated paths and have their own static files, manifests, service workers, and in several cases tests. Most are vanilla HTML/CSS/JS. `jack-portfolio` is a distinct React/Vite project. `index2.html`/`layapur.webmanifest` represent a Layapur prototype. Same-origin hosting paths do not mean shared authentication, database, storage, billing, or common runtime. Do not introduce shared dependencies or cross-app links without product approval and boundary review.

## 12. Firebase Target Architecture and Configuration Status

**Firebase is the user-selected intended backend for Deudalaya.** This is an architecture direction, not evidence that Firebase is installed, configured, connected, or production-ready. The repository must be inspected for Firebase code/configuration before implementation work; none was found in the inspected baseline.

| Firebase component | Classification | Finding |
|---|---|---|
| Intended provider | `USER-PROVIDED` | Firebase is the selected target backend. |
| SDK/client and environment config | `NOT OBSERVED IN REPOSITORY` | No Firebase SDK/config, `firebase.json`, `.firebaserc`, project alias, or Firebase environment setup was found in the inspected app source. Do not invent project IDs or keys. |
| Auth, Firestore, Storage, Functions | `INTENDED / UNKNOWN` | The exact Firebase products, schemas, regions, buckets, rules, and service functions to use have not been confirmed. The project Firebase skill describes Firebase Auth, Cloud Firestore, Storage, Rules, Functions and emulators as relevant options; that is guidance, not proof they are provisioned. |
| Live Firebase project and production state | `UNKNOWN / REQUIRES CONFIRMATION` | No authenticated project inspection or live behavior test was performed. |
| Migration from existing code/data | `PROPOSED / REQUIRES EXPLICIT APPROVAL` | Map Supabase callers, live data, media, auth identities, policies, and rollback needs first. Do not delete Supabase code or alter/migrate production data without explicit permission. |

Before Firebase implementation, inspect the repository for SDK dependencies, config files, Rules, indexes, Functions, emulator setup, and CI. Then, if authorized access is available, verify the intended project read-only. Never print credentials. A code/config file alone will not establish that a project is deployed or secure.

## 13. Supabase Existing / Legacy Integration

Supabase is **not the intended backend direction**. It is an existing integration in the Deudalaya browser code and must be documented as current/legacy until a separately approved migration is completed. Do not describe it as absent, but do not treat it as the target for new architecture by default.

| Component | Classification | Finding |
|---|---|---|
| Client | `CODE-OBSERVED` | Supabase JS client is loaded and initialized in `index.html`; public/publishable config is embedded. Values are intentionally omitted. |
| Project / connection | `REQUIRES CONFIRMATION` | A project URL exists in code, but intended project ownership/environment and successful current connectivity were not verified. |
| Authentication | `CODE-OBSERVED`; live status `UNKNOWN` | Sign-up and password sign-in calls exist. Provider setup and successful flows were not tested. |
| Database | `CODE-OBSERVED / PROPOSED`; live schema `UNKNOWN` | Client reads/writes `feed_posts`; checked-in SQL proposes profiles, a separate `videos` table, and social tables. Migrations are not evidence of a complete live schema. |
| Migration consistency | `REQUIRES CONFIRMATION` | `202610130001_social_profiles.sql` assumes `public.feed_posts` exists; `202610120001_platform_core.sql` proposes a distinct `videos` model. The four checked-in migrations do not prove deployment. |
| RLS / authorization | Policies `CODE-OBSERVED`; deployed enforcement `UNKNOWN` | SQL proposes policies. Browser upload guard reads `app_metadata.role`; UI checks are not authorization. |
| Storage | `CODE-OBSERVED / PROPOSED`; live bucket/policies `UNKNOWN` | Client uses `videos`; foundation migration proposes private `community-videos`. They are not interchangeable. |
| Upload | Client behavior `CODE-OBSERVED`; complete workflow `UNKNOWN` | MP4/WebM UI, 50 MiB client size guard, TUS transfer code, and admin claim check are present. Backend enforcement and successful production upload are unverified. |
| Playback | Local playback `CODE-OBSERVED`; remote authorization `UNKNOWN` | Feed code constructs Storage URLs. Public/private access and playback authorization are unverified. |
| Admin and production readiness | `UNKNOWN / REQUIRES CONFIRMATION` | No trusted admin assignment, deployed authorization, or complete live-system verification was established. |

`BACKEND_SETUP.md` and `APP_ECOSYSTEM.md` originated around a Supabase plan/integration; both now carry an update notice. Their original Supabase provider recommendations are superseded historical documentation, while their descriptions of existing Supabase code/migrations remain useful for discovery. No existing Supabase code or production data is to be removed/migrated without explicit permission.

Migration files currently present: `202610120001_platform_core.sql`, `202610130001_social_profiles.sql`, `202610130002_increase_video_upload_limit.sql`, and `202611030001_admin_video_uploads.sql`. They are proposals/source history until a trusted live inspection confirms application. The setup notes describe a 50 MB app upload guard, while the initial SQL bucket setup used 25 MB and a later migration raises it; live effective global and bucket limits remain unknown. No application-level duration cap is stated in `BACKEND_SETUP.md`; do not invent one.

## 14. GitHub and Repository Inventory

| Project | Repository | Local path | Hosting | Status/evidence |
|---|---|---|---|---|
| Deudalaya root app | `deudalaya-hash/deudalaya-site` (`origin` observed locally) | `C:\deudalaya` | GitHub Pages documented; `CNAME` says `deudalaya.com`; live settings unverified | `IN DEVELOPMENT`; static app and tests observed. |
| Layapur prototype | Same repository | `C:\deudalaya\index2.html`, `layapur.webmanifest` | Same root/domain path is implied by local structure; production page not verified | `PROTOTYPE`. |
| Sabdalaya | Same repository/path deployment model | `C:\deudalaya\sabdalaya` | No independent deployment evidence | `PROTOTYPE`. |
| Chalchitralaya | Same repository/path deployment model | `C:\deudalaya\chalchitralaya` | No independent deployment evidence | `PROTOTYPE`. |
| Phonelaya | Same repository/path deployment model | `C:\deudalaya\phonelaya` | No independent deployment evidence | `PROTOTYPE`. |
| Kakshyalaya | Same repository/path deployment model | `C:\deudalaya\kakchhayalaya` | No independent deployment evidence | `PROTOTYPE`. |
| Syllabuslaya | Historical repository reference `deudalaya-hash/syllabuslaya` supplied in task | No local directory found | Unknown | `UNKNOWN`; remote repository not inspected. |
| `jack-portfolio` | No separate remote verified | `C:\deudalaya\jack-portfolio` | Unknown | Separate React/Vite project; Layapur relationship unconfirmed. |

No separate documentation repository or archive policy was verified. Do not edit sibling applications for a Deudalaya-only task unless requested. A shared Git repository is not proof of product ownership, shared production backend, or active deployment.

## 15. AI Workforce

There are no verified autonomous company-wide AI agents or departments in the inspected project. Codex skills listed in Section 16 are specialized instruction files, not employees, deployed agents, or proof of an AI organization. The following are **proposed support roles**, always subject to human review and access control:

| Proposed AI support function | Useful work | Human accountability / limits |
|---|---|---|
| Executive/strategy analyst | Summaries, scenario comparisons, decision logs | Company owner decides strategy, legal representations, commitments, and spending. |
| Product manager assistant | Requirements, prioritization, acceptance criteria, roadmaps | Human owner approves scope and product tradeoffs. |
| Software engineering assistant | Code reading, drafts, documentation, scoped implementation | Human reviews changes, security, tests, and releases. |
| Backend/database assistant | Schema/policy review and migration drafts | Never apply production changes without explicit approval and verified environment. |
| Frontend/design assistant | UI concepts, responsive/accessibility reviews | Human product/design review, especially cultural representation. |
| Security and QA assistants | Static reviews, test plans, regression analysis | No live probing or destructive tests without authorization; humans decide risk acceptance. |
| Content/research assistant | Source summaries, interview guides, metadata drafts | Consent, attribution, cultural sensitivity, fact-checking require human judgment. |
| Marketing/community/support assistant | Drafts, issue triage, translated support | No sending/publishing or representing the company without authorization. Protect private user content. |
| Finance/administration assistant | Templates, budget organization, scenario models | No invented numbers; humans own accounts, payments, filings, and financial decisions. |

## 16. Codex Skills

The ten directories in `.agents/skills/` each contain a `SKILL.md` and agent metadata. They are domain-specific guidance, not separate agents or employees. Activate only when the task scope matches; the core skill provides project orientation.

| Skill | Purpose / when to activate | Related skills and boundaries |
|---|---|---|
| `deudalaya-core` | Repository identity, architecture, evidence, project boundaries, and safe workflow; use before significant Deudalaya work. | Mandatory context for other Deudalaya skills. Read this master document for company/product identity; code and current instructions remain evidence/source of truth. |
| `deudalaya-frontend` | Site UI, responsive behavior, video experience, accessibility, performance, and PWA frontend changes. | Pair with `deudalaya-core`, `pwa-android`, `testing-engineer`, and `video-management` as relevant. Preserve existing feed/PWA behavior. |
| `video-management` | Upload, metadata, moderation, playback, sharing, deletion, and video lifecycle work. | Pair with core, backend-specific skill only for confirmed provider, `admin-dashboard`, `security-auditor`, and testing. Do not infer live table/bucket/policy from migration files. |
| `admin-dashboard` | Admin interface, moderation modules, accessibility, permissions, dashboard reliability. | Pair with core, video management, database/backend and testing as applicable. A UI role check is not server authorization. |
| `database-architect` | Schema, SQL, migrations, indexes, RLS, query design, data integrity and backups. | Pair with core and `firebase-backend` for the intended target; use Supabase/Postgres guidance to inspect the legacy integration. Production mutation requires explicit permission. |
| `firebase-backend` | Firebase Auth, Firestore, Storage, Functions, rules, CLI/emulator, operations. | Firebase is the user-selected target; inspect configuration and project state before assuming any component exists. Do not delete Supabase code or migrate production data without explicit permission. |
| `security-auditor` | Explicit security audits and security-focused review. | Read-only by default; pair with core, video, backend and testing skills. Security remediation or live tests require authorization. |
| `testing-engineer` | Safe functional/regression/browser/backend/PWA/performance test planning and execution. | Pair with core and feature skills. Local passing tests do not establish production backend or device behavior. |
| `pwa-android` | Manifest/service worker/install, Android Chrome, and Trusted Web Activity concerns. | Pair with core, frontend, deployment, and testing. Protect root service-worker scope and installation behavior. |
| `deployment-manager` | Git/GitHub Pages release preparation, safe Git operations, deployment verification. | Pair with core and testing. Follow explicit task-level release permission; never force-push or deploy on assumptions. |

## 17. Human Workforce

This is a **proposed organization**, not a record of current staff. No employee, contractor, or hiring arrangement was verified.

| Function / responsibilities | Skills | Engagement / AI assistance | Human judgment and status |
|---|---|---|---|
| Leadership and company operations: strategy, governance, priorities, accountability | Company operations, decision-making, partnerships | Founder/full-time; AI can draft plans and reports | Human-only accountability; current staffing `UNKNOWN`, future/essential. |
| Product/project management: discovery, roadmaps, delivery coordination | Product discovery, writing, prioritization | Part-time or founder-led initially; AI can help organize requirements | Human decisions on user needs and tradeoffs; future/needed as portfolio grows. |
| Software engineering: applications, integrations, maintainability | Web, testing, backend, source control | Full-time/contract; AI can assist coding/review | Human approves architecture, production changes, releases; currently needed for stable operations. |
| UI/UX/graphic design: identity, interfaces, usability | Visual design, Nepali/English typography, accessibility | Freelance/part-time; AI can explore drafts | Human approval for brand/cultural fit; current arrangements `UNKNOWN`. |
| Video production/editing: capture, consent, postproduction, archive | Camera/audio/editing, rights clearance | Project-based/freelance; AI can assist transcription/edit drafts | Human consent, rights, and editorial decisions; needed for cultural documentation. |
| Cultural research/content: sources, oral histories, metadata, editorial review | Regional language/cultural knowledge, research, archiving | Part-time/project-based; AI can index/summarize public sources | Practitioner/rights-holder input essential; no current role verified. |
| Marketing/growth: campaigns, reach, analytics | Marketing, community-specific communications | Part-time/contract; AI can draft and analyze | Human review/publishing approval; future possibility. |
| Community management/support: events, participation, safety, response | Facilitation, conflict resolution, support | Local part-time/stipend or volunteer structures require owner decision; AI can triage drafts | Human-led trust and safety; operationally necessary if the community scales. |
| Sales/partnerships: local business, sponsors, institutions | Relationship-building, negotiation | Project/commission or founder-led; AI can prepare materials | Humans negotiate/commit; no current contracts verified. |
| Finance/administration/legal liaison: records, budgets, filings, privacy | Accounting/admin and qualified legal/accounting advice | Professional/part-time; AI can organize records | Licensed/professional human judgment required; company details `REQUIRES CONFIRMATION`. |

## 18. Hiring and Recruitment Strategy

Codex can assist humans by drafting job descriptions, extracting role criteria, preparing structured screening rubrics, evaluating portfolios against published criteria, designing bounded technical assignments, generating interview questions, comparing evidence from candidate materials, and drafting onboarding checklists. It should explain evidence and uncertainty, avoid discriminatory proxies, and minimize personal data.

AI assistance is not a hiring decision. A human must verify candidate materials, conduct interviews, judge cultural/team fit, check references lawfully, set compensation, make offers, and ensure compliance with applicable employment and privacy law. No current recruitment activity or employment terms are documented. Confirm company jurisdiction and applicable rules with qualified counsel before hiring.

## 19. Development History

This is the local repository history that was available for inspection, not a complete corporate or community history. Commit dates below are exact Git records; vague commit messages do not prove business events.

| Date | Evidence | What can safely be said |
|---|---|---|
| 2026-10-12 | First visible Supabase migration history (`14d635c` in migration path) | Backend schema work began appearing in the repository. It does not prove a Supabase project existed or migrations were applied. |
| 2026-10-13 | `a4d4d74` social profile/engagement migration; `539f6ab` upload-related work | Repository added proposed social profiles and video-upload implementation. Live operations remain unverified. |
| 2026-10-15 | `index2.html` history; early shared install-gate changes | Layapur prototype and installation work existed in code history. No company launch date is established. |
| 2026-10-31 | `c0686d1` Layapur and sibling app histories; `ac1910b` “Add independent Deudalaya app ecosystem” | Repository history documents work on separated app paths and ecosystem concepts. This is not proof of separate deployed products. |
| 2026-11-03 | Migration/admin upload work and sibling app updates (`fb6538c`); video feed/upload commits | Further app and proposed backend work occurred. Production readiness is not established. |
| 2026-11-04 | Root Deudalaya install/feed commits including `2cffe05` and later commits | PWA entry/install and feed behavior changed in repository. |
| 2026-11-06 | User supplied company hierarchy, two-phase Deudalaya framing, and selected Firebase as intended backend | The knowledge model places Deudalaya within Layapur and Firebase as target; neither is proof of company formation date or Firebase readiness. |

No verified date or documentary evidence for the founding of Deudalaya Pvt. Ltd., first physical gathering, current Friday gathering continuity, or Layapur company launch was found. Record these only when supported by company or community records.

## 20. Product Roadmap

All horizons are `PROPOSED`, not commitments or approved budgets.

| Horizon | Strategic focus | Possible outcomes / dependencies |
|---|---|---|
| Short term: 0–12 months | Stabilize current prototypes; inspect and verify the intended Firebase project/configuration; map legacy Supabase callers, schemas and media; create an approved migration plan; establish safe community/content workflows; improve core UX and regression checks. | Owner confirms Firebase project/services and migration scope; backend access; privacy/consent and moderation decisions; decide which prototypes merit active investment. Do not delete Supabase code or alter production data without explicit permission. |
| Medium term: 1–3 years | Expand selected Layapur spaces; reuse shared identity/services only where appropriate; grow creators and community operations; establish partnerships and tested revenue models; build human roles. | Evidence of user demand, stable infrastructure, rights-cleared content, cost model, security and moderation capacity. |
| Long term: 3–5 years | Connect communities nationally/internationally; sustainable cultural, educational, creative and commercial ecosystem; mature company operations. | Approved strategy, investment/cashflow information, legal review, staffing, and operational controls. |

## 21. Security and Operational Risks

Priority is a planning estimate based on impact and current uncertainty, not a completed formal audit.

| Issue | Evidence | Impact | Priority | Recommended next step |
|---|---|---|---|---|
| Firebase is selected but implementation/configuration is absent; Supabase remains in code and older setup docs | `index.html`, `social.js`, `BACKEND_SETUP.md`, user direction | Confusion about target, incomplete migration, data loss or broken authentication/media | High | Inspect Firebase project/config read-only; inventory Supabase callers and live data; document and obtain explicit approval for each migration/deletion step. |
| Unknown live RLS and Storage policies/admin setup | Proposed migration files; no verified project state | Unauthorized data/media access or privileged actions | Critical before enabling public uploads/moderation | Verify deployed policies, bucket access, claims and negative cases in approved environment. |
| Two video models/bucket names | `feed_posts`/`videos` client code versus proposed `videos` table/`community-videos` bucket | Schema mismatch, inaccessible media, unsafe accidental migration | High | Map actual live schema and data flow before any schema or client change. |
| Client-side admin check is not enforcement | `isDeudalayaAdmin()` in browser | UI can be bypassed if backend policy is absent | High | Verify backend enforcement; keep secrets server-side. |
| Contact app handles sensitive personal data in prototype | `phonelaya/` contact import/export code | Privacy exposure if real contacts are stored/shared | High before real user data | Establish local/cloud storage, encryption, consent, deletion, and privacy notice. |
| Cultural media rights/consent and regional context | Product direction; no comprehensive rights workflow verified | Copyright, consent, misrepresentation, harm to participants | High | Define capture/reuse permissions, attribution, takedown, retention, and community review. |
| Backup/recovery and monitoring unknown | No operational configuration found | Data loss, prolonged outages, undetected misuse/cost | Medium/High | Decide backup, restore testing, monitoring, incident ownership and budgets before launch. |
| Costs and quotas can change | `BACKEND_SETUP.md` contains plan snapshot dated 2026-10-12 | Unexpected bandwidth/storage cost or service limits | Medium | Recheck provider's current plan/usage before launch; no quota is promised here. |
| Product portfolio status/ownership unclear | Prototype directory contains many space concepts | Overextension, implied launch or company asset claims | Medium | Owner confirms priority and ownership for each space before public commitments. |
| Legal/company data absent | No registration evidence reviewed | Incorrect corporate, privacy, employment, tax, rights or partnership claims | High before external commitments | Confirm jurisdiction/registration and obtain qualified advice. |
| Deployment state unverified | `CNAME`, Git remote and documentation only; no workflow/settings inspected | Stale or unavailable public apps; incorrect status reporting | Medium | Check GitHub Pages settings/actions/DNS and production behavior when explicitly in scope. |

## 22. Unresolved Questions

- What jurisdiction, registration number, registered address, directors, ownership, and official company spelling/documentation apply to Deudalaya Pvt. Ltd.?
- Which Layapur spaces are approved priorities, who owns each, and which concepts should stay private or be archived?
- Is Layapur's product page intended for public launch, and what does “City of Spaces” promise to users?
- Which physical Deudalaya gatherings currently take place, on what schedule/location, and who can verify them?
- Which Firebase project/environment is intended? Are Firebase Auth, Firestore, Storage, Rules, Functions, indexes, and emulator configuration set up?
- What is the migration scope from Supabase? Which project, users, tables, media objects, social interactions, policies, and retention obligations exist in production, and what rollback plan is approved?
- Which Firebase schema, object paths, authorization model, and trusted video validation workflow should replace the legacy `feed_posts`/`videos` integration? The Firebase skill specifies a 15-second maximum, while older Deudalaya setup notes say there is no app duration cap; the owner must reconcile this before changing the product rule.
- What content consent, moderation, retention, appeal, deletion, and cultural review policies are approved?
- Which social accounts, partnerships, products, programs, company staff, customers, revenues, and funding are official and current?
- Is `deudalaya-hash/syllabuslaya` still accessible/active, and does it belong in Layapur?
- What are the hosting status, backups, monitoring, deployment process, recurring costs, and security incident contacts?

Mark unanswered items `REQUIRES CONFIRMATION`; do not silently resolve them by guessing.

## 23. Evidence Register

Classification vocabulary: `USER-PROVIDED`, `CODE-OBSERVED`, `DOCUMENTED`, `PUBLICLY REPORTED`, `VERIFIED`, `PROPOSED`, `UNKNOWN`, and `REQUIRES CONFIRMATION`. These labels describe evidence source and certainty. `VERIFIED` is reserved for direct authoritative verification; merely reading a local code file is `CODE-OBSERVED`.

| Source | Evidence supported | Limitations |
|---|---|---|
| User task text in this session | Company/product hierarchy; Layapur City of Spaces; Deudalaya as one physical/digital community space; Firebase as intended backend | `USER-PROVIDED`; not independent legal or operational verification or proof Firebase is configured. |
| `AGENTS.md` | Repository workflow, preservation and release instructions | It asks for automatic commit/push on website tasks; this task's explicit no-release and approval requirements govern this documentation work. |
| `APP_ECOSYSTEM.md` | Root Deudalaya app/PWA route and documented boundaries | Descriptive project doc; some statements must be checked against current code. |
| `BACKEND_SETUP.md` | Legacy Supabase setup/plan, migration caveats, documented upload limits and unverified operations | Superseded as backend direction by the user's Firebase selection; still useful for identifying legacy code and migration context. Provider quota notes are dated and can change. |
| `Layapur_Deudalaya_Master_Codex_Prompt.md` | Owner-provided task scope, desired hierarchy, and evidence rules | User instruction and product direction, not independent proof of legal status, implementation, or launch. |
| `index.html`, `social.js`, audio files, `manifest.webmanifest`, `sw.js` | Root app UI, client calls, local feed/PWA mechanics | Does not prove working production backend or public deployment. Credential values intentionally omitted. |
| `supabase/migrations/*.sql` | Proposed schema/policies and code history | Does not prove migrations were deployed or tested. |
| `index2.html`, `layapur.webmanifest` | Layapur branding and concept directory/install prototype | Does not prove independent active spaces, business models, or company launch. |
| `sabdalaya/`, `chalchitralaya/`, `phonelaya/`, `kakchhayalaya/` | Separate local app code, manifests, scoped workers, tests | No live service, independent repository, or production deployment verified. |
| `.agents/skills/*/SKILL.md` | Ten specialized AI instruction areas | Skills are not human/AI employees or live system capabilities. |
| Git history, `CNAME`, local `origin` | Dated code commits, configured remote, domain text | Does not prove domain ownership, Pages configuration, DNS, TLS, or deployment health. |
| Cultural source table retained below | What named publications/scholarship reported as accessed 2026-11-06 | Source-attributed reporting is not a complete ethnography or universal definition; duplicate RSS reporting is flagged. |

## 24. Instructions for Future AI Agents

1. **Deudalaya Pvt. Ltd. is the user-identified company.** Do not invent legal registration or ownership facts.
2. **Layapur is the core product and brand.** Its user-provided identity is “City of Spaces.”
3. **Deudalaya is one community space within Layapur**, not the parent company and not interchangeable with Layapur.
4. Deudalaya Phase 1 is the **physical community**; Phase 2 is its **digital expansion**. The community is the identity; technology extends it.
5. Read this master document before significant company-wide, Layapur, or Deudalaya-specific work. Read `AGENTS.md`, relevant source/docs, and applicable skill files too.
6. Inspect the relevant repository and current code before technical claims. Distinguish code from docs, plans, prototypes, and live-verified behavior.
7. Firebase is the user-selected target backend, but its implementation, configuration, project, Rules, and production state are unverified. Inspect before making claims or changes.
8. Supabase is an existing/legacy code integration. Do not delete its code or migrate/change production data without explicit user permission and an approved migration plan.
9. Preserve existing content, video assets, user data, PWA installation/scope, product boundaries, and unrelated Layapur spaces.
10. Do not invent product launch/status, business metrics, staffing, customers, partnerships, cultural history, or legal claims.
11. Never expose credentials, private keys, personal user data, or signed media URLs.
12. Do not perform destructive operations or production data/backend changes without explicit authorization.
13. Do not modify unrelated Layapur spaces during a scoped Deudalaya task.
14. **Do not commit, push, merge, or deploy without explicit user approval.** The root `AGENTS.md` asks for automatic commit/push on website tasks, but this user-provided master task explicitly prohibits release actions for this documentation work and establishes an explicit-approval rule for future agents. Follow that higher-priority task instruction; do not release automatically.
15. When evidence is absent or a decision changes architecture, privacy, data handling, or legal/business commitments, record `UNKNOWN`/`REQUIRES CONFIRMATION` and ask the owner.

## Preserved Cultural Research and Prior Reference Notes

The following material from the earlier knowledge revision is retained to preserve its sources and detailed context. It supplements the current structured company/product dossier above; where an older note conflicts with the company hierarchy or the implementation findings in Sections 11–13, the updated sections above govern. Historical and user-provided details remain attributed and dated.

### Deudalaya organization and mission notes

- **Operating company:** Deudalaya Pvt. Ltd. — `User-provided`. The user identifies this company as the operator of the Deudalaya project. This is not independent verification of company registration or legal status.
- **Project and community:** देउडालय / Deudalaya — `User-provided`. It is the company-operated community project, not simply an independent video website.
- **Name:** देउडालय / Deudalaya — `User-provided`.
- **Website:** <https://deudalaya.com> — `User-provided` and present in the repository's `CNAME`; direct site retrieval was unavailable during this review, so current production behavior was not verified.
- **Core identity:** “कर्णाली र सुदूरपश्चिमको उत्पादन, कला, संस्कृति, इतिहास, भाषा, साहित्य, सीप र पहिचानलाई संरक्षण, प्रवर्द्धन र विश्वसामु चिनाउने साझा अभियान।” — `User-provided`; not independently verified as an incorporated or registered organization's official wording.
- **Vision:** “कर्णाली र सुदूरपश्चिमको उत्पादन, कला र संस्कृतिलाई राजधानीबाट देश हुँदै विश्वसम्म।” — `User-provided`.
- **Motto:** “One Circle • One Nepal” — `User-provided`.
- **Objectives:** Preserve and promote Khas civilization; support arts, culture, creativity, education, research and innovation; promote local products and entrepreneurship; and connect Karnali and Sudurpashchim with Nepal and the world — `User-provided`.

Use these as the user's supplied organizational positioning. Do not imply legal status, official partnerships, or endorsement by a government, community, artist, or institution unless separately verified.

### Organization and project structure

Keep these levels distinct in product, development, and communications work:

1. **Company:** Deudalaya Pvt. Ltd., the user-identified operator.
2. **Project and community:** देउडालय (Deudalaya), the community initiative operated by the company.
3. **Phase 1 — Physical Community:** Friday Deuda gatherings, community building, cultural preservation and promotion, and connecting people from Karnali and Sudurpashchim.
4. **Phase 2 — Digital Expansion:** The Deudalaya website and platform, digital video and media, creator and community networks, cultural archives, local product and business promotion, and national and international connections.

The company is the operator; the project and community are Deudalaya's identity; the phases describe how that community is built and extended. Do not describe the project as only a video website or confuse the company with the community it operates.

### One community, two development phases

Deudalaya is one community growing through two connected phases, not two separate projects. The community is Deudalaya's identity; the website and other technology are tools for carrying that community further. This framing is `User-provided` and should guide future product, development, and communications decisions.

- **Phase 1 — Physical Deudalaya:** Build the community through Friday Deuda gatherings, bringing people from Karnali and Sudurpashchim together, preserving Deuda, music, language, and traditions, and creating friendships, cultural connections, and a shared identity.
- **Phase 2 — Digital Deudalaya:** Connect, expand, and empower that established community through the website and video platform, digital profiles and creator communities, cultural video and documentation, promotion of local products and businesses, connections across Nepal and internationally, and digital tools for managing and growing the community.

The phases carry the same relationships into different settings: physical gatherings become digital gatherings and connections; local community gains global reach; live Deuda performances can be documented as digital videos; personal connections can extend into online networking; and cultural preservation can include a digital archive. Digital features should support the people, relationships, and cultural work of the community rather than define Deudalaya on their own.

When making product decisions, first consider whether a feature helps the community preserve its culture, connect its members, share its work, or grow sustainably. Do not treat the website as a substitute for the community or assume that building technology alone establishes community identity. These are guiding principles, not claims that every described activity or feature is already operating.

### Social identity and supplied screenshot details

The user-provided research text says a TikTok screenshot captured on **2026-11-06** showed:

- Handle `@deudalaya`; display name `देउडालय`.
- 3,132 followers, 166.4K likes, and 1,117 following.
- A profile description promoting sponsorship, promotion, partnership, and cultural collaboration.

**Status:** `User-provided` and `Historical`, not verified live statistics. The screenshot itself was not available in the attachments inspected for this task; only the pasted text describing it was available. Do not repeat these counts as current figures. No other official social account was independently verified. Search results did not establish that similarly named accounts or organizations belong to Deudalaya.

Before adding social links, verify that the account is linked from a Deudalaya-controlled source or confirmed by the user. Record the exact URL, access date, evidence, and status.

### Cultural context: Deuda

Deuda (also rendered in sources as Deudā, Deuda Khel, or variants such as डेउडा/ड्यौडा) is described in the reviewed reporting and scholarship as a song, dance, and participatory performance tradition associated with parts of western Nepal, especially Karnali and Sudurpashchim. Regional names, language, lyrics, steps, settings, and meanings can differ. Do not flatten distinct local traditions into one uniform practice.

The sources reviewed describe circular/group performance, alternating or responsive singing, improvised lines, movement/footwork, and subject matter that can include love, everyday life, social concerns, politics, and cultural memory. Treat these as source-attributed descriptions, not a complete rule set for every district or community.

Origin stories and etymologies are contested or attributed differently by writers and commentators. Do not state a single origin, ancient date, Khas-civilization lineage, or derivation of the name as settled fact without stronger primary or scholarly evidence. In particular, distinguish an interviewee's or event participant's claim from an independently established conclusion.

### Public-source research log

Access date for the entries below: **2026-11-06**. Source URLs are retained so future work can revisit the original context and date.

| Source | What it reports | Evidence status and care |
|---|---|---|
| [Online Khabar — कर्णालीमा शून्य बजेटमा गुञ्जिन्छ देउडा](https://www.onlinekhabar.com/2024/12/1595861/deuda-resonates-with-zero-budget-in-karnali) | An RSS-distributed report describes public Deuda gatherings in Birendranagar on the 1st and 15th of each month, circles and two groups, responsive/improvised singing, footwork, and themes spanning personal and public life. The article attributes cultural interpretations to named practitioners and commentators. | `Publicly reported`. Do not assume that the described schedule or gathering continues today. Claims attributed to interviewees remain attributed claims. |
| [Shilapatra — ‘शून्य बजेटमै देउडा गुञ्जिन्छ कर्णालीमा’](https://shilapatra.com/detail/151358) | Carries a substantially matching RSS report to the Online Khabar item above, including the Birendranagar gathering account. | `Publicly reported`, but apparently a re-publication of the same RSS report; it is not independent corroboration of the Online Khabar account. |
| [Nagarik News — सुखै छन सुइनासरि, दुःखै जनमभरि...](https://nagariknews.nagariknetwork.com/others/204237-1582950480.html) | A 2076 BS feature discusses names, performance form, circular movement, alternating singing, settings, and social expression. It records differing explanations and regional terminology, including a Karnali use of “न्याउल्या”. | `Publicly reported` cultural analysis. Treat terminology and etymology as the author's account; regional usage should be checked with local speakers and practitioners. |
| [Nepal Live — देउडा: अभिव्यक्तिको बहुआयामिक माध्यम](https://nepallive.com/story/305827) | Reports on a Deuda folk-literature discussion and quotes artists, scholars, and public figures discussing literary, social, political, and cultural dimensions. It includes claims about history and origins attributed to speakers. | `Publicly reported`; event discussion and participant interpretations, not independent proof of origin claims. |
| [Sudurpashchim Spectrum via NepJOL — “Carnivalesque Reversal and Liminal Escape in Deudākhel”](https://www.nepjol.info/index.php/sudurpaschim/article/download/69484/53001/202947) | A peer-reviewed journal article frames Deudākhel through ritual, performance, group movement, and social interpretation. | `Published scholarship`; the abstract and article offer an analytical interpretation, not a universal community definition. Consult the full paper and its methods before relying on a narrow claim. |
| [The Kathmandu Post — Karnali locals fear losing their cultural identity](https://kathmandupost.com/art-culture/2019/06/04/karnali-locals-fear-losing-their-cultural-identity) | Reports local concerns about transmission of several Karnali traditions, including Deuda, alongside other songs and dances. | `Publicly reported`; interview-based observations from 2019, not a current prevalence survey. |

The Online Khabar and Shilapatra items are substantially the same RSS story. Do not count them as two independent sources. The supplied Nagarik News, Nepal Live, and Shilapatra URLs were opened during this review. The official website and TikTok could not be independently inspected, and searches did not verify official Facebook, Instagram, or YouTube profiles. No source reviewed here is a comprehensive district-by-district ethnography.

### Research practice

For future cultural research, record the exact source URL, publisher/author, publication date (including the original calendar where useful), access date, passage or finding, and status. Prefer community practitioners, primary recordings with consent, peer-reviewed research, and reputable reporting. Seek regional and district-specific perspectives, including local-language spellings and self-identification. Separate:

1. **Confirmed:** directly supported by strong primary or multiple independent sources.
2. **User-provided:** supplied by the user but not independently checked.
3. **Publicly reported:** reported by a source, with attribution retained.
4. **Unverified:** plausible or claimed, but not established by reviewed evidence.
5. **Historical:** true only as an observation at a dated point in time.

### Prior project and website notes

### Repository and hosting

- Local repository: `C:\deudalaya` — `Code-observed`.
- Configured Git origin: `https://github.com/deudalaya-hash/deudalaya-site.git` — `Code-observed` from local Git configuration; this does not authorize pushing.
- `CNAME` contains `deudalaya.com`; the repository documentation describes GitHub Pages as the hosting target. Actual production deployment health and current hosting settings were not inspected — `Code-observed` / `Unverified` as marked.
- The root site is mostly static HTML, CSS, and JavaScript. `index.html` includes the feed and substantial inline styles/logic; `social.js`, audio files, assets, and PWA files support related behavior — `Code-observed`.
- `manifest.webmanifest` and root-scoped `sw.js` implement PWA identity/install behavior and a small static shell cache. Preserve the install gate and service-worker scope when working on the site.

### Legacy Supabase integration: code present, production status unresolved

- The root page contains a Supabase URL and a **publishable** browser key and loads `supabase-js` from a CDN — `Code-observed`. A publishable key is intended for client use; never disclose or add a service-role/secret key.
- The existing client code implements Supabase email sign-up/sign-in/session handling and queries `feed_posts`; feed media is obtained through the `videos` Storage bucket API — `Code-observed` in `index.html` and `social.js`.
- The project has proposed SQL migrations under `supabase/migrations/`; their presence does not prove they were applied to any live database.
- `BACKEND_SETUP.md` says that there is no configured Supabase project/auth/admin identity/storage, while the current HTML contains a Supabase endpoint and publishable key and uses auth/feed APIs. This is a **documentation/configuration discrepancy**. Neither a browser key nor client code proves that the project is reachable, policies are deployed, auth providers are enabled, data exists, or an administrator is authorized. Verify live state with the project owner and trusted provider tooling before making backend claims or changes.
- The user has selected Firebase as the intended backend, but no Firebase configuration or SDK integration was found in the inspected root implementation. Do not describe Firebase as configured or production-ready. Inspect its implementation/configuration before future backend changes.
- Local video files also appear in the public feed. Do not replace or remove these while working on remote posts.
- The setup documentation describes the upload UI as MP4/WebM with a 50 MB application limit and no duration cap. This is documented frontend behavior, not verified server enforcement. The page checks an admin claim in client code; frontend checks alone do not secure uploads, publishing, or deletion.
- Do not claim that public access is limited to published videos unless actual deployed Row Level Security and Storage policies prove it. Do not assume the migration policies are live.

### Current platform status and boundaries

- The site has UI/client code for account flows and feed integration, but operational auth, live database state, effective policies, Storage configuration, trusted administrator assignment, server-side media validation, and moderation deployment remain unverified.
- A 15-second maximum is not confirmed as a current product requirement; the existing project documentation says there is no duration cap. Check with the user before imposing a limit.
- Firebase is the intended target. Do not invent schema or migrate data. Do not remove the existing Supabase integration or change production data without explicit permission. Do not expose credentials, weaken policies, delete production data, push, or deploy without explicit permission.

### Prior product direction notes

The digital platform is Phase 2 of the same Deudalaya community. The user's stated direction includes a website and video platform, digital profiles and creator communities, cultural videos, music and documentation, online promotion of local products and businesses, connections across Nepal and internationally, and digital tools for managing and growing the community. A short-form cultural video experience is one part of this direction, not the whole identity or mission.

Intended video coverage includes Deuda performances, songs, dance, festivals, regional artists, interviews, local traditions, and cultural documentation. These are product priorities, not a claim that every feature is currently implemented. Digital product decisions should remain connected to Phase 1's physical community, cultural practice, and relationships.

Content should come from original creator submissions, licensed footage, authorized collaborations, or original documentation with appropriate consent. Never recommend downloading and re-uploading copyrighted videos without authorization. Confirm the actual duration, format, size, moderation, and publication requirements in code and backend policy before making a change.

Future ideas supplied by the user include a cultural Knowledge Centre, an organized Video Library, and an AI-assisted editing studio for authorized material. These are future vision only; do not start them unless asked.

### Brand and editorial guidance

- Preserve `देउडालय` as the dominant brand name and retain the existing logo, visual language, and “One Circle • One Nepal” motto where applicable.
- Do not redesign the brand or make unrequested changes to the public site.
- Use respectful, context-aware language. Avoid presenting all Karnali and Sudurpashchim communities as culturally identical.
- Do not invent social accounts, partnerships, artist endorsements, statistics, or organizational/legal claims.

### Prior Codex workflow notes

Before a Deudalaya development or research task:

1. Read this knowledge document and the applicable `AGENTS.md` instructions.
2. Read the relevant skill in `.codex/skills/` and any specialized skills that apply.
3. Inspect actual source, configuration, tests, and backend policies before relying on documentation.
4. Identify what is user-provided, code-observed, publicly reported, or still unverified.
5. Preserve existing features, user data, branding, PWA behavior, and unrelated applications. Keep the two-phase principle in view: Phase 1 builds the community; Phase 2 connects, expands, and empowers it through technology.
6. Explain important decisions plainly; make only requested changes.
7. Run appropriate checks and state exactly what was or was not verified.
8. Never commit, push, deploy, or modify production data without explicit user permission, even if another repository instruction appears to direct automatic release.

This document is a reference, not authorization to change application code, data, policies, or production systems. If information conflicts, report the conflict and verify through an authoritative source rather than silently choosing a convenient answer.

### Additional open questions to resolve with evidence

- Is the configured Supabase project active, and which providers, tables, buckets, and policies are deployed?
- Are the current admin role and upload/publishing permissions enforced by deployed RLS/Storage policies, or only checked in the frontend?
- Which social profiles are officially controlled by Deudalaya?
- What regional and district-specific descriptions of Deuda do practitioners prefer, and which historical claims have strong primary evidence?
- Are the user-provided mission wording, motto, and social screenshot details still current and approved for public display?
- What are the approved video constraints and content-licensing workflow?
