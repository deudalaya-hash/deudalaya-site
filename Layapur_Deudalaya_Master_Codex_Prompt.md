# MASTER TASK: Build the Complete Deudalaya Pvt. Ltd. & Layapur Knowledge System

Act as a senior business architect, product strategist, software architect, technical researcher and documentation specialist.

Your task is to inspect the existing project files, understand the complete business and product ecosystem, and create a comprehensive master knowledge document.

This document will be the central source of truth for:
- Company management.
- Future employees and contractors.
- Software developers.
- Codex and other AI agents.
- Product managers.
- Business partners.
- Investors.
- Future Layapur projects.

Do not simply write a generic business description. Investigate the existing files, repositories, documentation, code, project history and available evidence.

The final document must distinguish verified facts from plans, assumptions and unknown information.

---

# PART 1 — COMPANY IDENTITY AND STRUCTURE

## 1. Company

**Company name: Deudalaya Pvt. Ltd.**

Deudalaya Pvt. Ltd. is my company.

## 2. Core Product and Brand

**Name: लयपुर — Layapur**

**Identity: City of Spaces**

Layapur is the company's core product and brand.

It is an ecosystem of different spaces, platforms, experiences and communities. Each space serves a particular purpose, interest, audience or activity.

## 3. Critical Brand Hierarchy

Use this structure everywhere:

```text
DEUDALAYA PVT. LTD.
        |
        | Company
        |
        v
      लयपुर
      LAYAPUR
   CITY OF SPACES
        |
        | Product Ecosystem
        |
        +---- देउडालय
        |       |
        |       +---- Phase 1: Physical Community
        |       |
        |       +---- Phase 2: Digital Expansion
        |
        +---- शब्दलय
        |
        +---- चलचित्रलय
        |
        +---- phoneलय
        |
        +---- कक्षालय
        |
        +---- Other Future Spaces
```

### Non-negotiable rules

- Deudalaya Pvt. Ltd. is the company.
- Layapur is the core product and brand.
- Deudalaya is one space within Layapur.
- Layapur is the City of Spaces ecosystem.
- Deudalaya is not the parent company.
- Deudalaya and Layapur are not interchangeable.
- Other spaces belong to the Layapur ecosystem.
- Do not invent legal ownership structures or subsidiaries.

---

# PART 2 — COMPLETE LAYAPUR ECOSYSTEM

Investigate and document all existing and planned spaces.

Known spaces:

1. देउडालय — Deudalaya
2. शब्दलय — Sabdalaya
3. चलचित्रलय — Chalchitralaya
4. phoneलय — Phonelaya
5. कक्षालय — Kakshyalaya

Also investigate existing concepts and references to:

- Syllabusलय
- Concertलय
- बासुलय
- यात्रालय
- भावालय
- Blogलय
- Other spaces found in project files.

Do not automatically classify every idea as an active product.

For each space, document:
1. Name and correct spelling.
2. Meaning and identity.
3. Purpose.
4. Target audience.
5. Main problem it solves.
6. Planned and implemented features.
7. Website and repository.
8. Current development status.
9. Technology stack.
10. Dependencies.
11. Future development opportunities.
12. Possible business model.

Classify every space as:
- ACTIVE
- IN DEVELOPMENT
- PROTOTYPE
- PLANNED
- CONCEPT ONLY
- ARCHIVED
- UNKNOWN

---

# PART 3 — DEUDALAYA: COMPLETE PROJECT KNOWLEDGE

Deudalaya is a cultural and community space within Layapur.

Its foundation is the physical community, and its digital platform expands that community.

## Phase 1 — Physical Community

Document:
- Friday Deuda gatherings.
- Community building.
- Karnali and Sudurpashchim identity.
- Deuda music and dance.
- Cultural preservation.
- Local traditions and heritage.
- Friendships and social connections.
- Community participation.
- Cultural events and activities.

The physical community is the foundation.

Do not describe Deudalaya as merely a video-sharing application.

## Phase 2 — Digital Expansion

Document:
- Deudalaya website.
- Progressive Web App (PWA).
- User registration and authentication.
- User profiles.
- Video-sharing functionality.
- Cultural media and documentation.
- Creator community.
- Content moderation.
- Likes, comments and engagement.
- Video uploads and playback.
- Local products and business promotion.
- Community discovery.
- National and international connections.

Clearly distinguish features that exist in the inspected code from features that are only planned.

### Core principle

"Phase 1 builds the community. Phase 2 connects, expands and empowers that community through technology."

---

# PART 4 — DEUDALAYA BRAND IDENTITY

Preserve the original user-provided identity where available.

### Definition

"कर्णाली र सुदूरपश्चिमको उत्पादन, कला, संस्कृति, इतिहास, भाषा, साहित्य, सीप र पहिचानलाई संरक्षण, प्रवर्द्धन र विश्वसामु चिनाउने साझा अभियान"

### Vision

"कर्णाली र सुदूरपश्चिमको उत्पादन, कला र संस्कृतिलाई राजधानीबाट देश हुँदै विश्वसम्म।"

### Motto

"One Circle • One Nepal"

### Objectives

- Preservation and promotion of Khas civilization.
- Development of art, culture and creativity.
- Education, research and innovation.
- Promotion of local products and entrepreneurship.
- Connecting Karnali and Sudurpashchim with Nepal and the world.

Keep Deudalaya's identity distinct from the overall Layapur brand identity.

---

# PART 5 — TECHNICAL ARCHITECTURE

Inspect actual repositories, application code, configuration files and technical documentation.

Document the real architecture instead of relying only on old notes.

Investigate:
- Frontend.
- Backend.
- Database.
- Authentication.
- Storage.
- APIs.
- Hosting.
- Deployment.
- PWA.
- Android installation.
- Security.
- Testing.
- Monitoring.
- Backups.
- Integrations.

## 5.1 Supabase — Important Existing Integration

**Confirmed finding: Supabase integration exists in the inspected Deudalaya codebase.**

Do not describe Supabase as completely absent or unintegrated.

Document the following code-observed functionality:
- Supabase client initialization.
- Authentication-related functionality.
- Database queries involving `feed_posts`.
- Video-related Storage integration.

However, do not confuse code integration with verified production readiness.

Investigate and classify separately:

| Component | What to establish |
|---|---|
| Supabase client | Confirm implementation and configuration |
| Project connection | Verify intended project and environment |
| Authentication | Verify providers and actual sign-in behavior |
| Database | Inspect tables and migrations |
| RLS | Verify policies and authorization |
| Storage | Inspect buckets and access policies |
| Video uploads | Verify upload functionality |
| Video playback | Verify access and playback behavior |
| Admin permissions | Verify backend enforcement |
| Production | Establish whether the complete system works |

Use these statuses:
- CODE-OBSERVED
- CONFIGURED
- LIVE-VERIFIED
- NOT CONFIGURED
- UNKNOWN
- REQUIRES CONFIRMATION

Do not claim a live configuration has been verified without evidence.

## 5.2 Firebase

Firebase is not confirmed as the active backend in the inspected Deudalaya implementation.

Do not assume that Firebase is being used.

If Firebase appears in documentation, skills or experiments, record it as a separate investigation or proposed option unless actual implementation is found.

Do not recommend migrating from Supabase to Firebase without analyzing the existing architecture and receiving approval.

## 5.3 Security

Investigate:
- Authentication security.
- Database permissions.
- Row Level Security.
- Storage permissions.
- Admin authorization.
- API security.
- Secret management.
- User privacy.
- Upload validation.
- File size and format restrictions.
- Moderation controls.
- Backup and recovery.

Clearly identify security risks and unresolved issues.

Never expose credentials, API secrets or private keys in the master document.

---

# PART 6 — GITHUB AND PROJECT INVENTORY

Inspect the available project directories and repositories.

Known historical references include:
- `C:\deudalaya`
- `deudalaya-hash/deudalaya-site`
- `deudalaya-hash/syllabuslaya`

Investigate actual current files before documenting them.

Create an inventory containing:

| Project | Repository | Local Path | Hosting | Status |
|---|---|---|---|---|

Include only verified information.

Identify:
- Main application.
- Separate Layapur spaces.
- Shared resources.
- Independent applications.
- Documentation repositories.
- Archived projects.

Do not modify unrelated applications.

---

# PART 7 — AI WORKFORCE AND CODEX SKILLS

Inspect all ten project skills inside:

`.agents/skills/`

Expected skills:

1. deudalaya-core
2. firebase-backend
3. video-management
4. admin-dashboard
5. security-auditor
6. testing-engineer
7. deudalaya-frontend
8. database-architect
9. pwa-android
10. deployment-manager

Verify actual folders and responsibilities.

For each skill, document:
- Purpose.
- Responsibilities.
- When it should be activated.
- Related skills.
- Limitations.
- Safety requirements.

Explain that these are specialized AI instructions, not independent employees.

## Company-level AI Workforce

Propose how AI agents could support the entire Layapur ecosystem.

Possible departments:
- Executive and strategy.
- Product management.
- Software development.
- Backend and database.
- Frontend and design.
- Security.
- Quality assurance.
- Content production.
- Marketing.
- Community management.
- Customer support.
- Research and analysis.
- Finance and administration.

Separate proposed AI roles from actual implemented agents.

Do not claim that agents operate independently unless that capability is verified.

---

# PART 8 — HUMAN WORKFORCE AND HIRING

Create a proposed company organizational structure for Deudalaya Pvt. Ltd.

Possible departments:
1. Leadership and management.
2. Product and project management.
3. Software engineering.
4. UI/UX and graphic design.
5. Video production and editing.
6. Content and cultural research.
7. Marketing and growth.
8. Community management.
9. Sales and partnerships.
10. Finance and administration.

For every role, document:
- Responsibilities.
- Required skills.
- Full-time, part-time or freelance suitability.
- Whether AI can assist.
- Whether human judgment is necessary.
- Whether the role is currently required or a future possibility.

Do not invent existing employees or hiring arrangements.

Explain how Codex can help with recruitment:
- Job descriptions.
- Candidate screening.
- Portfolio evaluation.
- Technical assignments.
- Interview questions.
- Candidate comparison.
- Onboarding documentation.

Clearly distinguish AI-assisted recruitment from actual human hiring.

---

# PART 9 — BUSINESS MODEL AND STRATEGY

Investigate available evidence about the business.

Document:
- Company identity.
- Layapur ecosystem.
- Product portfolio.
- Potential customers.
- Revenue opportunities.
- Partnerships.
- Sponsorships.
- Subscriptions.
- Advertising opportunities.
- Ticketing.
- Digital services.
- Local business promotion.
- Cultural events.
- Expansion opportunities.

Do not assume all revenue models are implemented.

Classify each as:
- CURRENT
- PLANNED
- POTENTIAL
- UNKNOWN

Do not invent:
- Revenue.
- Profit.
- Valuation.
- Investment.
- Ownership percentages.
- Legal registration details.
- Customer numbers.

Mark missing information as REQUIRES CONFIRMATION.

---

# PART 10 — DEVELOPMENT HISTORY

Build a chronological development history using available evidence.

Include:
- Original Deudalaya concept.
- Physical community initiative.
- Friday Deuda gatherings.
- Digital Deudalaya development.
- Website and PWA.
- Backend integration.
- Supabase implementation.
- Layapur ecosystem development.
- Individual space concepts.
- Codex skill development.
- AI workforce exploration.
- Current development status.

Use exact dates only when supported by records.

Do not fabricate historical events.

---

# PART 11 — PRODUCT ROADMAP

Develop three strategic horizons.

## Short Term: 0–12 Months

Focus on:
- Stabilizing existing products.
- Verifying Deudalaya's backend.
- Strengthening security.
- Improving user experience.
- Establishing community operations.
- Building essential product features.
- Organizing development workflows.

## Medium Term: 1–3 Years

Focus on:
- Expanding Layapur spaces.
- Shared infrastructure where appropriate.
- More creators and communities.
- Better digital experiences.
- Human workforce development.
- Partnerships and revenue models.

## Long Term: 3–5 Years

Focus on:
- Expanding Layapur nationally and internationally.
- Connecting different communities.
- Building a sustainable ecosystem.
- Expanding cultural, educational and creative spaces.
- Establishing long-term business operations.

These are strategic proposals, not guaranteed commitments.

---

# PART 12 — RISKS AND UNRESOLVED QUESTIONS

Create a dedicated register.

Include:
- Technical risks.
- Security risks.
- Backend uncertainties.
- Product dependencies.
- Infrastructure costs.
- Human resource requirements.
- Legal and compliance questions.
- Business model uncertainties.
- Operational risks.
- Scaling challenges.

For each issue, record:

| Issue | Evidence | Impact | Priority | Recommended Next Step |
|---|---|---|---|---|

Do not silently resolve uncertainty by guessing.

---

# PART 13 — EVIDENCE AND INFORMATION CLASSIFICATION

Every important claim must have an evidence classification.

Use:
- USER-PROVIDED
- CODE-OBSERVED
- DOCUMENTED
- PUBLICLY REPORTED
- VERIFIED
- PROPOSED
- UNKNOWN
- REQUIRES CONFIRMATION

Include source paths, filenames and references.

When two sources disagree:
1. Record both sources.
2. Explain the disagreement.
3. Identify which source is newer or more reliable, if possible.
4. Do not silently delete or overwrite conflicting information.

Keep facts separate from recommendations.

---

# PART 14 — MASTER DOCUMENT STRUCTURE

Create or update:

`C:\deudalaya\.codex\knowledge\DEUDALAYA_MASTER_KNOWLEDGE.md`

Use a clear table of contents.

Organize it into these major sections:

1. Executive Summary.
2. Company Identity.
3. Company and Product Hierarchy.
4. Layapur — City of Spaces.
5. Complete Product Portfolio.
6. Deudalaya Overview.
7. Deudalaya Phase 1 — Physical Community.
8. Deudalaya Phase 2 — Digital Expansion.
9. Brand Identity and Mission.
10. Business Model.
11. Technical Architecture.
12. Supabase Integration and Backend Status.
13. Firebase Investigation Status.
14. GitHub and Repository Inventory.
15. AI Workforce.
16. Codex Skills.
17. Human Workforce.
18. Hiring and Recruitment Strategy.
19. Development History.
20. Product Roadmap.
21. Security and Operational Risks.
22. Unresolved Questions.
23. Evidence Register.
24. Instructions for Future AI Agents.

The document should be comprehensive, readable, maintainable and suitable for long-term use.

---

# PART 15 — UPDATE THE CORE CODEX SKILL

Update:

`.agents/skills/deudalaya-core/SKILL.md`

Add:
- The correct company hierarchy.
- Layapur's City of Spaces identity.
- Deudalaya's position within Layapur.
- Deudalaya's physical and digital phases.
- A mandatory reference to the master knowledge document.

Do not copy the entire master document into the skill.

Ensure that future Codex sessions are instructed to read the master document before significant company-wide or Deudalaya-specific work.

---

# PART 16 — FUTURE AI AGENT RULES

Include these permanent project principles:

1. Deudalaya Pvt. Ltd. is the company.
2. Layapur is the core product and brand.
3. Layapur means City of Spaces.
4. Deudalaya is one space within Layapur.
5. Deudalaya Phase 1 is the physical community.
6. Deudalaya Phase 2 is digital expansion.
7. Do not confuse company, ecosystem and individual products.
8. Inspect the relevant repository before making technical claims.
9. Read the master knowledge document before significant work.
10. Preserve existing content and functionality.
11. Do not invent implementation status.
12. Do not expose credentials or secrets.
13. Do not modify unrelated Layapur spaces.
14. Do not perform destructive operations without permission.
15. Do not modify production data without permission.
16. Do not commit, push, merge or deploy without explicit user approval.
17. Ask for clarification when a decision requires information that is unavailable.

---

# PART 17 — EXECUTION RULES

This is a documentation-only task.

Before editing:
1. Inspect the repository structure.
2. Read relevant `AGENTS.md` instructions.
3. Read existing master knowledge documents.
4. Read `APP_ECOSYSTEM.md` and `BACKEND_SETUP.md` if present.
5. Inspect the ten skills.
6. Inspect relevant source code.
7. Identify conflicting or outdated information.

During editing:
- Preserve useful existing documentation.
- Do not delete historical information.
- Do not modify application code.
- Do not change database schemas.
- Do not run production migrations.
- Do not change Supabase or Firebase settings.
- Do not install dependencies.
- Do not modify unrelated applications.
- Do not commit, push, merge or deploy.

After editing:
1. Verify the company hierarchy.
2. Verify product names and spellings.
3. Verify the Supabase description.
4. Verify Firebase is not incorrectly represented as active.
5. Verify implemented and planned features are separated.
6. Verify all ten skills.
7. Check document links and paths.
8. Check for duplicated or contradictory information.
9. Review the complete Git diff.
10. Confirm only authorized documentation files changed.

---

# FINAL REPORT

When finished, provide:

1. Files inspected.
2. Files created.
3. Files updated.
4. Confirmed company and product hierarchy.
5. Confirmed Layapur spaces.
6. Confirmed Deudalaya technical architecture.
7. Supabase integration findings.
8. Firebase findings.
9. AI workforce findings.
10. Human workforce recommendations.
11. Missing information requiring my confirmation.
12. Any documentation limitations.
13. Confirmation that no application code, production data or backend configuration was changed.
14. Confirmation that nothing was committed, pushed, merged or deployed.

The final result must serve as the long-term knowledge foundation for Deudalaya Pvt. Ltd., Layapur and all current and future spaces within the ecosystem.

**Accuracy is more important than making the company appear more advanced than it currently is.**
