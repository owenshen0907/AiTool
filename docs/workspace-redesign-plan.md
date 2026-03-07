# AiTool Redesign Plan

## 1. Goal

AiTool should stop presenting itself as a generic "all-in-one AI platform".
It should become:

`An AI-native workspace for work output, developer productivity, and Japanese learning.`

This redesign has three goals:

1. Raise daily usage frequency for the owner first.
2. Keep the public homepage understandable for new users.
3. Build a stable product skeleton that can later support personalized experiences.

## 2. Current Diagnosis

### 2.1 What is already strong

- Prompt management and prompt debugging are the deepest productized flows.
- The document directory system is reusable and already supports feature-based content spaces.
- Japanese notes already fit the "AI workspace + content accumulation" direction.
- TTS and a few creation flows are usable as focused tools.

### 2.2 What is currently weak

- Navigation promises far more than the site has actually delivered.
- The product positioning mixes tools, personal notes, demos, knowledge base, fine-tuning, and agents into one surface.
- The homepage is still a marketing-style landing page, not a real usage entry.
- "Personal productivity" and "user-facing product" are not separated cleanly.

### 2.3 Product risk

If AiTool keeps expanding sideways, it will become a feature catalog with low retention.
If it is rebuilt as a workspace, it can become a daily-use hub.

## 3. Product Positioning

### 3.1 One-sentence positioning

AiTool is an AI workspace for creation, thinking, and learning, centered on reusable prompts, structured content, and personal workflows.

### 3.2 Product pillars

- Workspace
  - daily entry point
  - tasks, recents, quick capture, shortcuts
- Create
  - prompts, image generation, audio, video-related output
- Learn
  - Japanese notes, reading, shadowing, review
- Library
  - reusable assets, documents, templates, generated results
- Me
  - preferences, models, account, integrations

## 4. User Layers

### 4.1 Public visitors

Need a clear answer to:

- What is AiTool?
- What can I do here?
- Why is this different from a bag of tools?
- Why should I sign in?

### 4.2 Logged-in owner / power users

Need:

- a daily-use workspace
- faster entry to repeated tasks
- persistent assets and history
- self-managed roadmap and execution

### 4.3 Later personalized users

Need:

- stable product skeleton
- role-based default modules
- recent behavior-based recommendations

## 5. Product Architecture

### 5.1 Public Homepage `/`

Purpose:

- explain the product
- show core scenarios
- drive sign-in

Recommended sections:

1. Hero
   - one-sentence positioning
   - sign in / try / explore actions
2. Scenario cards
   - Work with AI
   - Learn Japanese
   - Build reusable workflows
3. Featured capabilities
   - Prompt Studio
   - Japanese Lab
   - Voice / TTS
   - Visual creation
4. Example outputs
   - prompt templates
   - learning notes
   - generated assets
5. Why AiTool
   - reusable
   - accumulative
   - personalizable

Important:

- no private widgets on `/`
- no todo list on `/`
- no personal recents on `/`

### 5.2 Logged-in Workspace `/workspace`

Purpose:

- become the daily default entry point
- aggregate work, learning, and execution

Recommended sections:

1. Today
   - date
   - short AI summary
   - today's focus
2. Todo
   - personal tasks
   - requirements and implementation tasks
3. Quick Capture
   - quick note
   - quick Japanese sentence
   - quick requirement
   - quick prompt
4. Recents
   - recent documents
   - recent prompts
   - recent creation tasks
5. Frequently Used
   - pinned shortcuts
   - recent routes
6. Japanese Today
   - today's note
   - review queue
   - TTS / shadowing shortcut
7. AI Assistant Panel
   - suggested next action
   - continue yesterday's work
   - summarize open tasks

### 5.3 Requirements Space `/requirements`

Purpose:

- manage ideas and product work inside AiTool
- turn developer work into a first-class internal use case

Recommended statuses:

- Inbox
- Shaping
- Ready
- Doing
- Validating
- Archived

Recommended fields:

- title
- type
  - feature
  - bug
  - design
  - infra
  - content
- scene
- reason
- expected value
- priority
- status
- related route
- validation note

Implementation note:

- this can reuse the existing `DirectoryLayout` + content system
- `feature = requirements`

### 5.4 Navigation

Recommended top-level nav:

- Home
- Workspace
- Create
- Learn
- Library
- Me

Recommended second-level grouping:

- Create
  - Prompt Studio
  - Image
  - Audio
  - Video Dubbing
- Learn
  - Japanese Notes
  - Review
  - TTS Practice
- Library
  - Documents
  - Templates
  - History
- Me
  - Account
  - Models
  - Integrations
  - Requirements

Deprecated from top-level:

- large "Agent" mega-menu
- fine-tune as top-level promise
- demo as primary nav item
- personal notes mixed with product navigation

## 6. Personalization Strategy

Do not build "every user sees a different site".

Build:

`stable skeleton + personalized modules`

### 6.1 Personalize only these layers

- pinned shortcuts
- recent activity
- recommended actions
- default landing module in workspace
- learning progress widgets

### 6.2 First-stage personas

- Builder
  - prompt-heavy
  - requirement-heavy
  - creation-heavy
- Learner
  - Japanese-first
  - review-first
  - voice-first
- Creator
  - image/video/audio-first

### 6.3 Rules

- public homepage stays stable
- workspace modules can reorder by usage
- no hidden navigation logic
- all personalization should be reversible

## 7. XiaoLongXia Integration

Assumption:

- "小龙虾" is an external assistant or execution system deployed on both work and personal machines

AiTool should own:

- organization
- context
- records
- tasks

XiaoLongXia should own:

- execution
- conversation
- long-running actions
- automation

### 7.1 Integration levels

#### Level 1: Jump integration

- open XiaoLongXia from AiTool
- pass selected text / task context
- store return link or manual result summary

Use when:

- no stable API exists

#### Level 2: Local API integration

- send requirement / document / prompt to XiaoLongXia
- receive status and result summary back
- show recent executions in workspace

Use when:

- XiaoLongXia exposes HTTP or WebSocket locally

#### Level 3: Execution queue integration

- create task in AiTool
- dispatch to XiaoLongXia
- poll status
- archive result into Library / Requirements / Documents

Use when:

- XiaoLongXia supports structured job execution

### 7.2 First recommended integration

Start with Level 1 or Level 2 only.

Do not block the redesign on deep XiaoLongXia coupling.

## 8. Build Order

### Phase 1: Structure

Goal:

- fix product skeleton

Tasks:

1. simplify top nav
2. add `/workspace`
3. keep `/` as public homepage
4. define login redirect behavior

### Phase 2: Daily-use workspace

Goal:

- create daily opening habit

Tasks:

1. todo widget
2. recent items widget
3. quick capture widget
4. pinned shortcuts widget
5. Japanese today widget

### Phase 3: Internal product management

Goal:

- let AiTool manage its own evolution

Tasks:

1. add `/requirements`
2. requirement lifecycle
3. link requirements to pages / modules
4. validation notes

### Phase 4: Integration and AI-native behaviors

Goal:

- make the workspace feel alive

Tasks:

1. XiaoLongXia entry and dispatch
2. AI daily summary
3. suggested next action
4. recommended shortcuts by usage

## 9. Immediate Implementation Recommendation

Start with these exact deliverables:

1. Redesign navigation
2. Create `/workspace`
3. Create `/requirements`
4. Redirect sign-in success to `/workspace`
5. Update homepage copy to match the new positioning

This is the smallest meaningful redesign that changes the product direction without overbuilding.

## 10. Success Criteria

The redesign is working if:

- the owner opens AiTool daily
- workspace replaces ad hoc entry points
- requirements are managed inside AiTool
- Japanese usage and work usage both increase
- top navigation becomes easier to explain in one minute

The redesign is failing if:

- more modules are added before workspace becomes useful
- public homepage and personal workspace remain mixed
- too many incomplete routes stay visible
- personalization is attempted before the base workflow is stable
