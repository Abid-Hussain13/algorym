# Software Requirements Specification

**Project:** Algorym — A Live Collaborative Coding Interview Platform

**Document type:** Software Requirements Specification (SRS)

**Standard:** Structured to the IEEE 830 recommended practice, adapted for a final year project

**Version:** 1.0

**Status:** Submitted for approval

---

## Table of Contents

1. Introduction
2. Overall Description
3. Specific Requirements
4. Data Requirements
5. Use Case Specifications
6. System Models
7. Validation Criteria
8. Appendices

---

# 1. Introduction

## 1.1 Purpose

This document specifies the complete requirements for Algorym, a web based platform for conducting and reviewing live coding interviews. It defines what the system must do, the interfaces it exposes, the qualities it must possess, and the conditions under which those requirements are considered satisfied.

This document is intended for the developer implementing the system, for any reviewer assessing it against its stated objectives, and for a future maintainer who must understand why the system is shaped as it is. It is written to be read alongside the project proposal, which explains the motivation and the scope boundary, and alongside the interface contract, which records the exact shapes exchanged between the client and the server.

## 1.2 Scope

Algorym allows an interviewer, who holds an account, to create a coding session, share a tokenised invite link, and conduct a live session with a candidate who may have no account at all. During the session both participants edit the same code in a shared editor, execute code in five supported languages, and observe identical results. When the session ends the host records a private assessment, and the platform retains a complete event log so that the session can be reviewed afterwards. Interviewers additionally manage a personal question bank and review aggregate statistics about their sessions.

The system covers account management, the question bank, the session lifecycle, the invite and join flow, the collaborative editor, code execution, host notes and evaluation, the event log and replay, dashboard and reporting, and the public marketing and legal pages.

The system does **not** cover audio or video communication, automated assessment of candidate code, payment or subscription handling, native mobile applications, or organisational tenancy with teams and shared workspaces.

## 1.3 Definitions, Acronyms and Abbreviations

| Term | Definition |
| --- | --- |
| Algorym | The system specified by this document. |
| Host | The authenticated account that creates and controls a session. Automatically recorded as a participant with the role `host`. |
| Guest | A participant who joins a session through an invite link. May be anonymous or may hold an account. Recorded with the role `guest`. |
| Session | One interview or practice meeting. The central aggregate of the system. |
| Access token | A random string generated when a session is created. Embedded in the invite link and used by the guest to join. |
| Participant | A record of a person in a session, carrying a role, a display name and an optional link to an account. |
| Event | A persisted record of something that happened inside a session: a code snapshot, a run result, a question change, a status transition. |
| Evaluation | The host's private rating of a guest, recorded when an interview session completes. |
| CRDT | Conflict free Replicated Data Type. The data structure underlying the shared editor. |
| Awareness | The Yjs presence channel carrying cursor position, selection and participant identity. |
| Room | The set of WebSocket connections associated with one session identifier. |
| Verdict | The outcome classification of an execution: accepted, wrong answer, time limit exceeded, compile error, runtime error, internal error or error. |
| Starter code | The initial buffer contents supplied with a question for a given language. |
| SSE / WS | Not used. All real time traffic uses WebSocket. |
| HTTP | Hypertext Transfer Protocol, used for all request and response traffic. |
| REST | Representational State Transfer, the style used for the HTTP interface. |
| JWT | JSON Web Token, used for the authenticated session cookies. |
| CRUD | Create, Read, Update, Delete. |

## 1.4 References

| Reference | Relevance |
| --- | --- |
| Project Proposal and Synopsis, version 1.0 | Motivation, objectives, scope boundary, risk analysis. |
| Backend and frontend interface contract | The authoritative record of every endpoint, payload and WebSocket message exchanged between the two applications. |
| Database schema document | Table definitions, column types, constraints and the canonical DDL file. |
| Design system reference | Colour tokens, typography scale, spacing, motion and component naming. |
| Design decision log | The reasoning behind architectural choices, including those later revised. |
| Yjs protocol documentation | Wire format and merge semantics of the shared document. |
| Sandbox execution provider API documentation | Supported languages, request shape, response shape and status values. |

## 1.5 Overview

Section 2 describes the system as a whole: what it does, who uses it, the environment it runs in, and the constraints its design must respect.

Section 3 states the requirements themselves. Functional requirements are numbered, grouped by module and given a priority: **shall** denotes a mandatory requirement, **should** a strong recommendation, and **may** an optional feature. External interface, performance, security and attribute requirements follow in the same section.

Section 4 specifies the persistent data. Section 5 specifies the principal use cases in full. Section 6 describes the system models. Section 7 defines how the requirements are validated and traces them to their tests.

---

# 2. Overall Description

## 2.1 Product Perspective

Algorym is a standalone web application. It is not a component of a larger system and it does not embed third party products, although it calls two external services: a code execution sandbox and a transactional email provider.

The application is divided into two deployable units and one shared package.

| Unit | Technology | Responsibility |
| --- | --- | --- |
| Client | React 19, Vite, CodeMirror 6, Yjs | All user interface, including the marketing site, the interviewer dashboard and the live room. |
| Server | Node.js, Express 5, PostgreSQL, WebSocket | All business rules, all persistence, and both real time channels. |
| Shared types | TypeScript declarations | Every entity, request body, WebSocket message and payload used by both sides. |

The client is a single page application. Public marketing pages, the interviewer dashboard and the live room are three distinct route trees with different layouts and different navigation rules, described in section 3.1.11.

The server is a single Node process serving HTTP and both WebSocket channels from one listener, dispatching connections by path. It owns the data and is the sole authority for state transitions, authorisation and validation.

## 2.2 Product Functions

The system performs the following functions, each expanded into numbered requirements in section 3.

| Function | Summary |
| --- | --- |
| Account management | Registration, sign in, token issuance and renewal, revocation, and per user preferences. |
| Question bank | Owner scoped storage of interview questions with difficulty, language support and starter code, with search and filtering. |
| Session lifecycle | Creation, scheduling, automatic start and expiry, completion, cancellation, and the rules governing which transitions are legal. |
| Invitation and joining | Generation of an invite URL and a consent based join flow that admits an anonymous participant. |
| Live collaboration | A shared multi file editor with real time synchronisation, remote cursors and presence. |
| Code execution | Submission of code in a supported language and delivery of a complete verdict to every participant. |
| Host session control | Starting, completing, cancelling, changing the active question, and keeping private notes. |
| Assessment | A private rating and notes on a guest, restricted to the host. |
| Event logging and replay | Persistence of session activity and its presentation in chronological order. |
| Reporting | Per account statistics on sessions, duration, completion, language mix and ratings, with CSV export. |
| Public information | A marketing site and the privacy policy and terms of service. |

## 2.3 User Classes

| Class | Description | Authentication | Primary capabilities |
| --- | --- | --- | --- |
| Host (interviewer) | A registered user who runs interviews. | Required, account based | Everything in the dashboard zone: sessions, questions, reports, settings, plus all live room capabilities. |
| Guest (candidate) | A person invited to a session. | None required; a token and participant identifier are sufficient | Join a session, edit the shared code, run code, read the shared output. |
| Anonymous visitor | Anyone reaching the public site. | None | Browse the marketing site, register, sign in, read the legal pages. |
| Background process | The expiry job inside the server. | None, runs in process | Start scheduled sessions on time and expire unattended live sessions. |

The host and the guest may be the same person when practising alone, which is why the system distinguishes the **role** in a session from the **identity** of a person. A role is always present; an identity is not.

## 2.4 Operating Environment

**Client.** Any modern evergreen browser with support for ES modules, WebSocket and the WebAssembly free CRDT library used for collaboration. Tested and supported on the current two versions of Chrome, Edge, Firefox and Safari on desktop. The marketing, dashboard and replay zones are usable from 360 px viewport width upwards. The live room requires a desktop viewport of at least 1024 px and a physical keyboard; smaller viewports receive an explanatory notice rather than a broken room.

**Server.** Node.js 22 or later, deployed as a single process. A PostgreSQL 15 instance reachable over TLS. Two WebSocket endpoints on the same host and port as the HTTP API. An outbound internet connection to the code execution provider and, where transactional email is enabled, to the email provider.

**Development.** A pnpm workspace with three packages. The client runs on a development server with hot reloading; the server runs under a watch process. The test suite rebuilds its database from the canonical schema file before each run, so tests always execute against the current data definition.

## 2.5 Design Constraints

The following constraints shaped the architecture and are binding on any future change.

| # | Constraint | Consequence |
| --- | --- | --- |
| C1 | The candidate must be able to join with no account and no installation. | Guest access is capability based. An invite token and a participant identifier, both unguessable, are the credential. |
| C2 | Collaboration must converge without a central authority resolving conflicts. | The shared document is a CRDT and the server relays updates rather than arbitrating them. |
| C3 | The guest is never an application administrator. | Every operation a guest can perform is checked against that guest's participation in that specific session. |
| C4 | Session state must survive a server restart. | All state that matters is persisted. The in memory document store holds only the live working set and can be discarded. |
| C5 | The host's assessment must not be readable by the guest. | Evaluations and host notes are returned only to the session owner, never by the room endpoints. |
| C6 | Both real time channels must not corrupt one another. | JSON application events and binary CRDT updates are carried on separate paths and dispatched by request path. |
| C7 | Contracts must not drift between the two applications. | Shared type declarations are imported by both; a shape change breaks compilation on one side immediately. |
| C8 | No object relational mapper and no client side persistence of secrets. | SQL is written directly; tokens live only in httpOnly cookies and are never readable by scripts. |
| C9 | The live room owns the entire viewport. | It is a separate top level route with no application chrome, which is also what makes the future integrity guards implementable. |

## 2.6 Assumptions and Dependencies

| # | Assumption or dependency | Effect if it fails |
| --- | --- | --- |
| A1 | A third party sandbox executes submitted code. | The editor and all other features continue to work; execution returns a clear error to the room. |
| A2 | PostgreSQL is available and migrated to the current schema. | The server cannot start; the health endpoint reports the failure. |
| A3 | Both participants can reach the WebSocket endpoints. | Live collaboration degrades to a reconnecting state; the shared document resynchronises on reconnection. |
| A4 | The host has an account and a verified email address. | The host cannot create sessions; the platform directs them to the sign up flow. |
| A5 | Clock accuracy between the server and the browser is adequate for display only. | All authoritative timing is server side; client clocks are never used for state decisions. |

## 2.7 External Interfaces

Three external interfaces exist.

**The browser interface.** A conventional single page application. The server serves a static application which then calls the API and opens the two WebSocket channels.

**The code execution interface.** An outbound HTTPS call per run, carrying the source, the language and any standard input, and returning the exit status, the streams, the compile output and the resource measurements. The mapping from provider status values to the platform's verdicts is defined in section 3.2.4.

**The database interface.** Standard SQL over a connection pool. All queries are parameterised; no query is built by string interpolation of user supplied values.
---

# 3. Specific Requirements

This section states the requirements. Requirement identifiers are stable and are referenced by the validation matrix in section 7.

Priority keywords follow RFC 2119 usage: **shall** is mandatory, **should** is a strong recommendation whose violation must be justified, **may** is optional.

## 3.1 Functional Requirements

### 3.1.1 Authentication and Accounts — FR-A

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-A.1 | The system shall allow a visitor to register with a name, an email address and a password of at least six characters. | Shall |
| FR-A.2 | The system shall reject registration when the email address is already registered, returning a conflict response that does not disclose which part of the request caused the conflict beyond the email itself. | Shall |
| FR-A.3 | The system shall store passwords only as salted hashes and shall never log, echo or return a password or its hash. | Shall |
| FR-A.4 | The system shall issue an access token and a refresh token on successful registration and on successful sign in. | Shall |
| FR-A.5 | Tokens shall be delivered only as httpOnly cookies. No token shall be placed in the response body, in local storage or in any script readable store. | Shall |
| FR-A.6 | The access token shall expire within fifteen minutes; the refresh token shall expire within seven days and shall be delivered with a path restricted to the refresh endpoint. | Shall |
| FR-A.7 | The system shall provide an endpoint that exchanges a valid refresh token for a new pair and shall rotate both tokens on every exchange. | Shall |
| FR-A.8 | The system shall support revocation: a token issued before the account's token version was incremented shall be rejected, and the version shall be incremented on sign out, on password change, on password reset and on account deletion. | Shall |
| FR-A.9 | The system shall provide an endpoint that returns the currently authenticated account without a password hash. | Shall |
| FR-A.10 | The system shall reject a protected request carrying no token or an invalid token with an unauthenticated response. | Shall |
| FR-A.11 | The client shall renew the access token transparently on receiving a single unauthenticated response and retry the original request exactly once. | Should |
| FR-A.12 | The system shall rate limit the credential and password reset endpoints to ten attempts per five minutes and three attempts per ten minutes respectively, identified by client address, and shall exempt automated test runs. | Shall |
| FR-A.13 | The system shall offer a password reset flow that sends a single use, time limited link and stores only a hash of the reset token. | Should |
| FR-A.14 | The system shall store a user's chosen theme and default preferences, and shall let the client apply the preference before first paint so no theme flash occurs. | Should |
| FR-A.15 | The system shall provide a "skip and continue" path for the marketing site that does not require an account. | May |

### 3.1.2 Question Bank — FR-Q

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-Q.1 | The system shall allow an authenticated user to create a question with a title, a description, at least one supported language and a difficulty. | Shall |
| FR-Q.2 | A question shall optionally carry starter code per language. | Shall |
| FR-Q.3 | The system shall allow the owner to read, update and delete a question, and shall refuse these operations for any other user. | Shall |
| FR-Q.4 | The system shall list the authenticated user's questions with a total count. | Shall |
| FR-Q.5 | The list shall support free text search across title and description. | Shall |
| FR-Q.6 | The list shall support filtering by difficulty and by a set of identifiers, and sorting by date, status or rating. | Shall |
| FR-Q.7 | The list shall be paginated with a page size bounded to a maximum of one hundred records. | Shall |
| FR-Q.8 | Deleting a question shall leave any session that referenced it intact, with the reference cleared. | Shall |
| FR-Q.9 | The system may support assistive generation of a question description from a title, using an external language model, with failure degrading to plain manual entry. | May |

### 3.1.3 Session Lifecycle — FR-S

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-S.1 | The system shall allow an authenticated user to create a session with a mode of interview or practice, a duration, and optionally a question, a language, a role context and a scheduled time. | Shall |
| FR-S.2 | Creating a session shall record the creator as a participant with the role host, in the same transaction as the session. | Shall |
| FR-S.3 | A session created with a scheduled time shall begin in the scheduled state; a session created without one shall begin in the live state. | Shall |
| FR-S.4 | The system shall enforce the following transitions and refuse all others with a conflict response explaining the illegal move: scheduled to live, live to completed, scheduled or live to cancelled, live to expired. | Shall |
| FR-S.5 | A session shall be editable only while it is in the scheduled state. | Shall |
| FR-S.6 | The active question may be changed only while the session is live. | Shall |
| FR-S.7 | Completing a session shall stamp its end time; cancelling shall stamp the end time as well. | Shall |
| FR-S.8 | The system shall expire a live session when its expiry time passes and a guest had joined; an unattended live session shall be expired instead. | Shall |
| FR-S.9 | Scheduled sessions shall start automatically when their scheduled time arrives. | Shall |
| FR-S.10 | A user shall not hold more than one live session at a time; creating a second shall be refused with a conflict that names the existing session. | Shall |
| FR-S.11 | The system shall broadcast status changes to the room so open clients update without a reload. | Shall |
| FR-S.12 | The system shall list the authenticated user's sessions with filtering by status and mode, free text search, sorting and pagination. | Shall |
| FR-S.13 | The system shall return a session's detail, including its assigned questions, participants and evaluation, only to its owner. | Shall |
| FR-S.14 | The system shall allow the owner to delete a session, cascading to its participants, events and evaluations. | Shall |
| FR-S.15 | The system shall expire sessions periodically in process and shall stop the job cleanly during shutdown so it cannot open a query on a closing pool. | Shall |

### 3.1.4 Invitation and Joining — FR-J

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-J.1 | Creating a session shall generate a cryptographically random access token of at least 192 bits of entropy, unique across sessions. | Shall |
| FR-J.2 | The system shall present the invite as a complete URL carrying the token, never as a bare token. | Shall |
| FR-J.3 | The system shall allow a participant to join with the access token, a display name, an optional email address and an explicit consent flag. | Shall |
| FR-J.4 | Joining shall be idempotent for the same identity: a repeated join shall return the existing participant rather than creating a duplicate. | Shall |
| FR-J.5 | The system shall link an anonymous participant to an account only when a signed in caller's email matches that participant's recorded email, and shall refuse otherwise. | Shall |
| FR-J.6 | Consent shall be recorded with a timestamp when the guest provides an email address for contact. | Shall |
| FR-J.7 | Membership verification shall require that the participant belongs to that session and, where the participant has an account, that the caller is that account. | Shall |
| FR-J.8 | The room data endpoint shall return session state, the active question and the participant roster, and shall be accessible without an account given a valid participant identifier. | Shall |
| FR-J.9 | The system shall refuse to admit a participant to a session that has already completed, been cancelled or expired. | Shall |

### 3.1.5 Live Collaboration and Editor — FR-C

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-C.1 | The live room shall be a top level route with no application chrome, occupying the full viewport. | Shall |
| FR-C.2 | Both participants shall edit the same document and shall observe each other's changes without a manual refresh. | Shall |
| FR-C.3 | The shared document shall be a conflict free replicated data type so that concurrent edits converge on every connected client without server arbitration. | Shall |
| FR-C.4 | The document shall hold a named map of files, each a shared text buffer, so that tabs are independent and adding or closing a buffer is shared. | Shall |
| FR-C.5 | The first buffer shall be seeded with the question's starter code for the session language only when the map is empty after the initial synchronisation, so that a late joiner never overwrites existing work. | Shall |
| FR-C.6 | The system shall display remote cursors and selections, each in a colour derived from the participant identifier so the same person is always the same colour. | Shall |
| FR-C.7 | The host shall wear a reserved accent colour; a guest shall never wear it. | Shall |
| FR-C.8 | The system shall show a live roster of participants with their role and presence state. | Shall |
| FR-C.9 | The system shall require that the editor's first synchronisation completes before seeding or permitting edits, and shall expose that state to the interface. | Shall |
| FR-C.10 | On connection loss the client shall attempt reconnection and resynchronise automatically, without user action and without losing unsent edits. | Shall |
| FR-C.11 | The editor shall support syntax highlighting for every language the platform can execute, plus line numbers and bracket aware indentation. | Shall |
| FR-C.12 | The editor shall offer optional vim key bindings and shall allow them to be switched off. | Should |
| FR-C.13 | The editor shall honour the user's theme preference and shall repaint on theme change without reloading the document. | Shall |
| FR-C.14 | The system shall keep the undo history per participant, so one person's undo does not remove another's work. | Shall |
| FR-C.15 | The collaboration channel shall authenticate the connection before accepting it, using the same membership rule as the events channel. | Shall |
| FR-C.16 | The server shall send a full state synchronisation to a client on join and incremental updates thereafter. | Shall |
| FR-C.17 | The client shall close and destroy the provider and document when the room unmounts, including under development double mounting. | Shall |
| FR-C.18 | The editor and its language modes shall be loaded as a separate bundle so that visitors to the marketing site do not download them. | Shall |

### 3.1.6 Code Execution and Output Feed — FR-R

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-R.1 | The system shall execute code submitted from a live session in one of JavaScript, Python, Java, C++ or Go. | Shall |
| FR-R.2 | The execution request shall carry the session identifier, the participant identifier, the source, the language and optional standard input. | Shall |
| FR-R.3 | The system shall accept code up to twenty thousand bytes and standard input up to ten thousand bytes. | Shall |
| FR-R.4 | The system shall return the verdict, the standard output, the standard error, the compile output, the exit code, the execution time in seconds and the memory in kilobytes. | Shall |
| FR-R.5 | Provider status values shall be mapped to the platform's verdicts, including timeout to a time limit verdict, and an unexplained error with a zero exit code to an internal error. | Shall |
| FR-R.6 | Only a session in the live state shall accept execution; otherwise the request shall be refused with a bad request response. | Shall |
| FR-R.7 | Only a verified participant of that session may execute; otherwise the request shall be refused. | Shall |
| FR-R.8 | Every run shall be persisted as an event, carrying the result together with the source and the standard input used. | Shall |
| FR-R.9 | Every run shall be broadcast to every connection in the room, including the participant who requested it. | Shall |
| FR-R.10 | The broadcast shall identify who ran the code so that the interface can attribute the result. | Shall |
| FR-R.11 | The broadcast shall carry an identifier generated by the requesting client so that the interface can recognise the echo of its own run. | Shall |
| FR-R.12 | The output panel shall show every run in the room in the order the runs completed, with each result attributed to its author, and shall never show one run twice. | Shall |
| FR-R.13 | The output panel shall hydrate earlier runs for a participant who joins an ongoing session, from the persisted event log. | Shall |
| FR-R.14 | A run shown from history and the same run arriving live shall be stored once. | Shall |
| FR-R.15 | The panel shall follow new output as it arrives while the reader is at the bottom, and shall not move the view when the reader has scrolled up to read earlier runs. | Should |
| FR-R.16 | A participant entering full screen, leaving full screen or switching tab shall be reported to the host as an integrity signal during an interview. | Should |
| FR-R.17 | The system shall place a persisted snapshot of the current editor contents on a trailing debounce after typing stops, so that replay can reproduce the work. | Shall |
| FR-R.18 | The system shall not persist a snapshot for a session that can no longer accept runs. | Shall |

### 3.1.7 Host Notes and Evaluation — FR-E

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-E.1 | The host shall be able to write private notes against a session and save them independently of the evaluation. | Shall |
| FR-E.2 | Notes shall be stored exactly as written, with no evaluation fields coupled to them. | Shall |
| FR-E.3 | The host shall be able to rate a guest as weak, average or strong. | Shall |
| FR-E.4 | The host shall be able to write private notes alongside the rating. | Shall |
| FR-E.5 | Evaluation shall be offered only for an interview session that has completed. | Shall |
| FR-E.6 | The server shall refuse an evaluation whose evaluator is not the session owner or whose evaluated participant is not a guest of that session. | Shall |
| FR-E.7 | The evaluation update shall modify only the fields present in the request, so a notes-only save does not clear a rating and a rating-only save does not clear notes. | Shall |
| FR-E.8 | No room or guest facing endpoint shall return the evaluation or the host's notes. | Shall |
| FR-E.9 | A session that already has an evaluation shall update it rather than create a duplicate. | Shall |
| FR-E.10 | The host shall be able to clear an evaluation. | May |

### 3.1.8 Event Log and Replay — FR-P

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P.1 | The system shall persist every event typed in section 4.3 against the session and the participant who caused it. | Shall |
| FR-P.2 | Events shall be stored in chronological order and returned in that order. | Shall |
| FR-P.3 | Each returned event shall carry the actor's identifier, display name and role. | Shall |
| FR-P.4 | The events feed shall be readable by the session owner and by a verified participant of that session, so that a late joiner can hydrate; other callers shall be refused. | Shall |
| FR-P.5 | The feed shall support filtering by event type. | Shall |
| FR-P.6 | Automatic transitions performed by the background job shall be logged with no attributed actor and a payload identifying the job as the source. | Shall |
| FR-P.7 | The system shall present the events of a completed session in sequence as a reviewable history. | Should |
| FR-P.8 | The editor contents recorded during a session shall be recoverable in order, because the in memory document is the only place the text exists while the session runs. | Shall |

### 3.1.9 Dashboard, Reports and Export — FR-D

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-D.1 | The dashboard shall show the number of sessions created in the current calendar month and the difference against the previous month. | Shall |
| FR-D.2 | The dashboard shall show the average duration of completed sessions this month with its change against last month. | Shall |
| FR-D.3 | The dashboard shall show the completion rate this month as completed over total. | Shall |
| FR-D.4 | The dashboard shall list recent sessions with candidate name, date and status. | Shall |
| FR-D.5 | The dashboard shall summarise the month's ratings by category with counts and a total. | Shall |
| FR-D.6 | Reports shall present total sessions, average duration and completion rate for a selected range. | Shall |
| FR-D.7 | Reports shall offer the ranges of seven days, thirty days, ninety days, the current month and the current year. | Shall |
| FR-D.8 | Reports shall chart sessions over time across the selected range. | Shall |
| FR-D.9 | Reports shall show the distribution of languages used and the distribution of ratings. | Shall |
| FR-D.10 | The language and rating charts shall render correctly at every viewport size. | Shall |
| FR-D.11 | The system shall export the sessions of a range as a comma separated file with a header row. | Shall |
| FR-D.12 | The export shall respect the same range semantics as the on screen report. | Shall |
| FR-D.13 | Reports shall be scoped to the authenticated account only. | Shall |

### 3.1.10 Settings and Profile — FR-SET

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-SET.1 | The system shall show the authenticated user's name, email and account creation date. | Shall |
| FR-SET.2 | The user shall be able to change their name and email address. | Shall |
| FR-SET.3 | The user shall be able to change their password after confirming the current one. | Shall |
| FR-SET.4 | The user shall be able to delete their account, which shall revoke all outstanding tokens and cascade to owned data. | Shall |
| FR-SET.5 | The user shall be able to set a default language and a default duration for new sessions. | May |

### 3.1.11 Presentation and Navigation — FR-M

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-M.1 | The system shall present a public marketing site composed of a hero, a features narrative, a how it works section, a roles comparison, a replay section, a frequently asked questions section and a closing call to action. | Shall |
| FR-M.2 | The marketing site shall be fully usable from 360 px viewport width upwards. | Shall |
| FR-M.3 | The marketing site shall present one consistent type scale and section rhythm on small screens rather than per section exceptions. | Shall |
| FR-M.4 | The dashboard shall present a sidebar navigation containing Dashboard, Sessions, Questions, Reports and Settings. | Shall |
| FR-M.5 | The sidebar's selected item and its hover state shall present the same colour, exactly as the selected item does. | Shall |
| FR-M.6 | The dashboard's controls, including its filter rows and statistic cards, shall fit a 390 px viewport without overflow, with statistic cards placed two per row. | Shall |
| FR-M.7 | Page titles and section headings shall share one type scale across every dashboard route. | Shall |
| FR-M.8 | The account control in the sidebar shall navigate to the settings page. | Shall |
| FR-M.9 | The system shall provide sign in, sign up, privacy policy, terms of service, about and contact pages. | Shall |
| FR-M.10 | The client shall apply the stored theme before first paint and shall not flash the wrong theme. | Shall |
| FR-M.11 | The interface shall respect a reduced motion preference by disabling non essential animation. | Shall |
| FR-M.12 | All interactive controls shall be reachable and operable by keyboard with a visible focus indicator. | Shall |
| FR-M.13 | The system shall present an error to the user in plain language, using the server's message for a client error and a friendly fallback otherwise. | Shall |
| FR-M.14 | The system shall keep the session status of the user's sessions reasonably fresh on dashboard pages and shall announce a status change wherever the user is. | Should |

### 3.1.12 Notifications — FR-N

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-N.1 | The system shall record a notification per recipient, optionally referencing a session, with a read state. | Shall |
| FR-N.2 | The system shall notify the host when a guest joins an invite they sent. | Should |
| FR-N.3 | The system shall remind the host shortly before a scheduled session begins. | Should |
| FR-N.4 | The system shall notify participants when a session is cancelled or completed. | Should |
| FR-N.5 | Notifications shall be delivered in application and, where configured, by email. | May |

## 3.2 External Interface Requirements

### 3.2.1 Human interface requirements

| ID | Requirement |
| --- | --- |
| FR-H.1 | Every action reachable by pointer shall be reachable by keyboard, in a logical order. |
| FR-H.2 | Text contrast shall meet the accessible contrast threshold against its background in both themes. |
| FR-H.3 | Interactive targets shall be at least 30 px on touch surfaces and at least 36 px for primary controls. |
| FR-H.4 | No information shall be conveyed by colour alone; verdicts carry a label as well as a colour. |
| FR-H.5 | Long running operations shall show progress and shall prevent duplicate submission. |
| FR-H.6 | Destructive actions shall require confirmation and shall state what will be lost. |

### 3.2.2 Software interface requirements — HTTP

All application traffic is JSON over HTTPS. Every response uses one envelope.

**Success**

```json
{ "success": true, "message": "string", "<resource>": { }, ... }
```

**Error**

```json
{
  "success": false,
  "message": "human readable summary",
  "errors": [ { "field": "email", "message": "why it failed" } ],
  "statusCode": 400
}
```

The `errors` array is present only for validation failures. In a non production environment a stack trace is appended for diagnosis.

**Status codes**

| Code | Meaning in this system |
| --- | --- |
| 200 | Operation succeeded and returned a resource. |
| 201 | Resource created. |
| 204 | Operation succeeded with no body, used for deletion. |
| 400 | Malformed input or an illegal state for the requested operation. |
| 401 | No credentials, or credentials that are absent, expired or revoked. |
| 403 | Authenticated, but not permitted for this resource. |
| 404 | No such resource, or it exists but is not the caller's. |
| 409 | A conflict with current state, such as a second live session or a duplicate email. |
| 429 | Rate limit exceeded. |
| 500 | Unexpected server fault. |

**Endpoint catalogue**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | none | Register and issue tokens. |
| POST | `/api/auth/login` | none | Authenticate and issue tokens. |
| POST | `/api/auth/refresh` | refresh cookie | Rotate the token pair. |
| POST | `/api/auth/logout` | any | Revoke the session and clear cookies. |
| GET | `/api/auth/me` | access cookie | Current account. |
| POST | `/api/auth/forgot-password` | none | Request a reset link. |
| POST | `/api/auth/reset-password` | reset token | Complete a reset and revoke tokens. |
| GET | `/api/question` | account | List the owner's questions. |
| POST | `/api/question` | account | Create a question. |
| GET | `/api/question/:id` | account | Read a question. |
| PUT | `/api/question/:id` | account | Update a question. |
| DELETE | `/api/question/:id` | account | Delete a question. |
| POST | `/api/session` | account | Create a session and its host participant. |
| GET | `/api/session` | account | List sessions with filters and pagination. |
| GET | `/api/session/:id` | owner | Session detail. |
| PATCH | `/api/session/:id` | owner | Edit while scheduled. |
| DELETE | `/api/session/:id` | owner | Delete a session and its dependents. |
| PATCH | `/api/session/:id/start` | owner | Scheduled to live. |
| PATCH | `/api/session/:id/complete` | owner | Live to completed. |
| PATCH | `/api/session/:id/cancel` | owner | Scheduled or live to cancelled. |
| PATCH | `/api/session/:id/question` | owner | Change the active question. |
| PATCH | `/api/session/:id/notes` | owner | Save private notes. |
| GET | `/api/session/:id/evaluation` | owner | Read the evaluation. |
| GET | `/api/session/:id/events` | owner or participant | Session event log. |
| GET | `/api/session/:id/room` | participant | Live room bootstrap data. |
| POST | `/api/session/join` | none | Join with an invite token. |
| POST | `/api/run` | participant | Execute code. |
| POST | `/api/evaluation` | owner | Create or update the evaluation. |
| GET | `/api/dashboard/stats` | account | Dashboard figures. |
| GET | `/api/reports` | account | Report figures for a range. |
| GET | `/api/reports/export` | account | CSV export for a range. |
| GET | `/health` | none | Liveness and deep database probe. |

Every request body and query string is validated against a schema before a controller runs. Validation failure produces 400 with a field level description of each problem.

### 3.2.3 Software interface requirements — WebSocket, channel one

**Endpoint.** `/ws?sessionId=<uuid>&participantId=<uuid>`

**Authentication.** The connection is accepted only when the participant exists for that session and, where the participant has an account, the request carries a valid access token for that account. The token is read from the request cookie, so the client sends no token in the query string.

**Envelope.** Every frame is

```json
{ "type": "<event type>", "payload": { } }
```

**Message types.** `join`, `leave`, `code_snapshot`, `run_result`, `question_change`, `session_started`, `session_completed`, `session_cancelled`, `session_expired`, `participant_joined`, `focus_event`, and an `error` frame carrying a message.

**Delivery.** A message accepted from one connection is relayed to every connection in the same session room. Presence is reported through the collaboration channel rather than as separate join and leave frames, so the roster cannot disagree with the sockets that are actually open.

### 3.2.4 Software interface requirements — WebSocket, channel two

**Endpoint.** `/collaboration/<sessionId>?participantId=<uuid>`

This channel carries binary CRDT frames produced by the Yjs protocol and awareness messages describing presence. It is deliberately not a member of the events room: a JSON text frame written into this stream would corrupt the binary protocol for every client in the room.

The relay holds one document per session identifier, answers a joining client's state request with the full document, and thereafter relays incremental updates between connections. It performs no conflict resolution, because the data type requires none.

### 3.2.5 Software interface requirements — code execution provider

**Request.** Source code, language identifier, optional standard input.

**Response.** Exit status and description, standard output, standard error, compile output, processor time and peak memory.

**Mapping to platform verdicts**

| Provider condition | Platform verdict |
| --- | --- |
| Successful termination, exit code zero | accepted |
| Non zero exit code | runtime error |
| Reported timeout | time limit exceeded |
| Compilation rejected the source | compile error |
| Provider error with exit code zero | internal error |
| Provider error with a non zero exit code | runtime error |

Interpreted languages report syntax errors as a runtime error carrying the parser message on standard error.

### 3.2.6 Software interface requirements — email

Outbound transactional mail is used for account verification, password reset and session reminders. The provider is reached over HTTPS. A failure to send shall never fail the originating request; it shall be logged and the operation shall proceed.

### 3.2.7 Software interface requirements — database

Standard SQL over a pooled connection. Every statement is parameterised. The canonical data definition is a single schema file which is applied to a fresh database and which the automated tests reapply before each run, so the schema file and the running database cannot disagree silently.

## 3.3 Performance Requirements

| ID | Requirement | Measure |
| --- | --- | --- |
| PR-1 | A read request shall complete within 300 ms at the 95th percentile under expected load. | Server timing |
| PR-2 | A write request shall complete within 800 ms at the 95th percentile. | Server timing |
| PR-3 | An edit made by one participant shall be visible to the other within 150 ms on a normal connection. | Client measurement |
| PR-4 | A code execution verdict shall be returned to the room within 3 seconds for a typical solution. | End to end timing |
| PR-5 | A live room shall render within 2 seconds of navigation on a mid range desktop. | Client measurement |
| PR-6 | The marketing site shall not download the editor bundle. | Network panel |
| PR-7 | A list endpoint shall return at most one hundred records regardless of the requested page size. | Response inspection |
| PR-8 | The server shall reclaim connections whose heartbeat is not answered, so that half open sockets cannot accumulate. | Connection metrics |

## 3.4 Security Requirements

| ID | Requirement |
| --- | --- |
| SR-1 | Passwords shall be stored with a salted adaptive hash and never in plain text. |
| SR-2 | Credentials shall be carried only in httpOnly, same site cookies, and never in script readable storage. |
| SR-3 | A session shall be revocable without waiting for token expiry, through a token version claim. |
| SR-4 | Guest access shall require an unguessable invite token and an unguessable participant identifier. |
| SR-5 | Every endpoint that exposes session data shall verify that the caller is the owner or a participant of that session. |
| SR-6 | Every execution request shall verify session membership and live status. |
| SR-7 | The host's notes and evaluation shall never be returned by a room or guest facing endpoint. |
| SR-8 | All input shall be validated against a schema before use, and no query shall interpolate user input. |
| SR-9 | Credential endpoints shall be rate limited by client address. |
| SR-10 | Submitted code shall be executed by an external sandbox; the platform shall never evaluate code in its own process. |
| SR-11 | WebSocket connections shall be authenticated during the upgrade, before the connection is accepted. |
| SR-12 | The server shall set standard hardening headers, including frame denial and content type sniffing denial. |
| SR-13 | Logs shall never contain passwords, tokens or submitted code. |
| SR-14 | Errors returned to the client shall not disclose stack traces or database detail in production. |

## 3.5 Software System Attributes

### 3.5.1 Usability

| ID | Requirement |
| --- | --- |
| UA-1 | A first time visitor shall understand the product from the marketing page without reading instructions. |
| UA-2 | A candidate shall be able to go from an invite link to a working editor in three interactions: open, enter a name, submit. |
| UA-3 | Any failure shall state what went wrong and, where the user can act, what to do next. |
| UA-4 | Destructive and irreversible actions shall be confirmed. |

### 3.5.2 Reliability

| ID | Requirement |
| --- | --- |
| RL-1 | A client that loses its connection shall recover its session and its editor state without user action. |
| RL-2 | A server restart shall not lose session state, evaluations or event history. |
| RL-3 | A failure in the code execution provider shall not degrade any other feature. |
| RL-4 | A failure in one participant's client shall not affect the other participant's ability to work. |
| RL-5 | The scheduled background job shall be idempotent, so a repeated run does not double apply a transition. |

### 3.5.3 Maintainability

| ID | Requirement |
| --- | --- |
| MT-1 | The server shall separate routing, request handling, business logic and data access so that each concern is independently testable. |
| MT-2 | A business rule shall live in one place and be callable from both the HTTP path and the real time path. |
| MT-3 | Any type shared by the client and the server shall be declared once in the shared package. |
| MT-4 | The database schema shall exist as a single canonical file rather than as an accumulating series of migrations. |
| MT-5 | Significant design decisions shall be recorded with their reasoning, including decisions later reversed. |
| MT-6 | Comments shall explain why, and shall be brief. |

### 3.5.4 Portability

| ID | Requirement |
| --- | --- |
| PT-1 | The system shall run on Linux, macOS and Windows for development. |
| PT-2 | The client shall build to static assets with no server side rendering. |
| PT-3 | The server shall run as a single process and shall not require a message broker or external cache. |

### 3.5.5 Other requirements

| ID | Requirement |
| --- | --- |
| OR-1 | The privacy policy shall state what is collected, what is retained for replay, which third parties process it, and the rights of the user. |
| OR-2 | The terms of service shall cover accounts, acceptable use, intellectual property and liability. |
| OR-3 | Consent shall be captured and timestamped when a guest supplies an email address for contact. |
| OR-4 | The system shall not display advertising or third party tracking. |

---

# 4. Data Requirements

## 4.1 General

Persistence is a single relational database with seven tables and five enumerated types. All identifiers are generated UUIDs. All timestamps are stored with a time zone. No personally identifying field is stored in plain text other than a display name, which a guest supplies deliberately.

The canonical definition lives in one schema file, which is applied to an empty database to produce the production structure and is re-applied by the test harness before each test run.

## 4.2 Entity relationships

```
users
  |
  +-- owns -------> questions
  |
  +-- creates ----> sessions <---- optionally uses one ---- questions
  |                     |
  |                     +-- has ----> session_participants
  |                     |                    |
  |                     |                    +-- triggers --> session_events
  |                     |                    |
  |                     |                    +-- evaluator / evaluated
  |                     |                                session_evaluations
  |                     |
  |                     +-- referenced by -> notifications
  |
  +-- may appear as -> session_participants
```

Reading it in words: a user owns questions and creates sessions. Each session may use one saved question and always has participants, some of whom hold accounts and some of whom are anonymous joiners identified by a display name. Every participant has a role, and the creator is automatically the host. Everything that happens inside a session is logged against the participant who caused it. When an interview completes, one evaluation records who rated whom.

## 4.3 Tables

### 4.3.1 users

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| name | text | Not null. |
| email | text | Not null, unique. Compared case insensitively on write. |
| password_hash | text | Not null. Never returned by any endpoint. |
| email_verified | boolean | Not null, default false. |
| token_version | integer | Not null, default 0. Incremented to revoke outstanding tokens. |
| created_at | timestamptz | Not null, default now. |

### 4.3.2 questions

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| owner_id | uuid | Foreign key to users, cascade delete. |
| title | text | Not null. |
| description | text | Not null. |
| languages | text array | Not null, at least one supported language. |
| difficulty | difficulty_level | Not null: easy, medium or hard. |
| starter_code | jsonb | Optional map of language to initial buffer. |
| created_at | timestamptz | Not null, default now. |

### 4.3.3 sessions

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| created_by | uuid | Foreign key to users, cascade delete. |
| question_id | uuid | Foreign key to questions, set null on delete. |
| mode | session_mode | Not null: interview or practice. |
| status | session_status | Not null, default scheduled. |
| access_token | text | Not null, unique, at least 192 bits of entropy. The invite credential. |
| role_context | text | Optional framing shown in the room. |
| scheduled_at | timestamptz | Optional. Presence selects the initial state. |
| duration_minutes | integer | Optional, bounded to a sensible range. |
| started_at | timestamptz | Optional, stamped on entering live. |
| expires_at | timestamptz | Optional, stamped on entering live. |
| created_at | timestamptz | Not null, default now. |
| ended_at | timestamptz | Optional, stamped on completing or cancelling. |
| language | text | Optional session language. |

A partial unique index on created_by where status is live enforces one live session per user at the database level, so the rule holds even under concurrent requests.

### 4.3.4 session_participants

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| session_id | uuid | Foreign key to sessions, cascade delete. |
| user_id | uuid | Foreign key to users, set null. Null for an anonymous guest. |
| email | text | Optional, supplied at join. |
| display_name | text | Not null in practice; the label shown in the room. |
| role | participant_role | Not null: host or guest. |
| consent_to_contact | boolean | Not null, default false. |
| consent_timestamp | timestamptz | Optional, set with consent. |
| joined_at | timestamptz | Not null, default now. |

A uniqueness rule on session and email for guests prevents duplicate guest rows from a repeated join or a double submission.

### 4.3.5 session_events

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| session_id | uuid | Foreign key to sessions, cascade delete. |
| actor_participant_id | uuid | Foreign key to participants, set null. Null for background transitions. |
| event_type | event_type | Not null, one of the values in 4.5. |
| payload | jsonb | Not null, default empty object. |
| created_at | timestamptz | Not null, default now. |

An index on session and creation time serves the chronological feed.

### 4.3.6 session_evaluations

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| session_id | uuid | Foreign key to sessions, cascade delete. |
| evaluator_participant_id | uuid | Foreign key to participants, cascade delete. |
| evaluated_participant_id | uuid | Foreign key to participants, cascade delete. |
| rating | evaluation_rating | Optional: weak, average or strong. |
| notes | text | Optional. |
| created_at | timestamptz | Not null, default now. |

One evaluation per session pair, so re-submitting updates rather than duplicates.

### 4.3.7 notifications

| Column | Type | Constraints and notes |
| --- | --- | --- |
| id | uuid | Primary key, generated. |
| user_id | uuid | Foreign key to users, cascade delete. |
| session_id | uuid | Foreign key to sessions, set null. |
| type | text | Not null. |
| title | text | Not null. |
| body | text | Optional. |
| read | boolean | Not null, default false. |
| created_at | timestamptz | Not null, default now. |

## 4.4 Enumerated types

| Type | Values |
| --- | --- |
| difficulty_level | easy, medium, hard |
| session_mode | interview, practice |
| session_status | scheduled, live, completed, cancelled, expired |
| participant_role | host, guest |
| evaluation_rating | weak, average, strong |
| event_type | code_snapshot, run_result, question_change, session_started, session_completed, session_cancelled, session_expired, participant_joined, focus_event |
| token_type | email_verification, password_reset |

## 4.5 Data retention

Event rows and editor snapshots are retained for the lifetime of the session and are deleted with it. Deleting an account cascades to that user's questions, sessions, participants, events, evaluations and notifications. No analytics or third party tracking data is stored.

---

# 5. Use Case Specifications

## UC-01 Register and sign in

| Field | Value |
| --- | --- |
| **Actor** | Anonymous visitor |
| **Goal** | Obtain an account and access to the dashboard |
| **Trigger** | The visitor submits the sign up or sign in form |
| **Preconditions** | None |
| **Postconditions** | An account exists and the client holds a valid access and refresh token |

**Main flow**

1. The visitor enters a name, an email address and a password of at least six characters.
2. The system validates the request against the schema and rejects a malformed email or a short password with a field level message.
3. The system checks whether the email is already registered. If it is, the request is refused with a conflict.
4. The system hashes the password and creates the account with verification pending.
5. The system issues an access token and a refresh token, sets both as httpOnly cookies, and returns the account without its password hash.
6. The client requests the current account, receives it, and routes the visitor to the dashboard.

**Exception flows**

| Condition | Response |
| --- | --- |
| Invalid input | 400 with a description per offending field |
| Email already registered | 409 |
| Too many attempts from one address | 429, and the client shows a wait message |

## UC-02 Create a live session

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Open a room and obtain an invite |
| **Trigger** | The host submits the create session form |
| **Preconditions** | The host is authenticated and holds no other live session |
| **Postconditions** | A session exists in the live state with the host recorded as a participant, and an invite token exists |

**Main flow**

1. The host chooses a mode, a duration and, optionally, a question, a language, a role context and a scheduled time.
2. The system validates the request. An unrecognised question or language is refused with 400.
3. The system refuses the request if the host already has a live session, naming the existing one.
4. The system generates a random access token and, in one transaction, creates the session and records the host as its participant.
5. Because no scheduled time was supplied, the session enters the live state with start and expiry stamps.
6. The system returns the session and the client displays the complete invite URL.

**Exception flows**

| Condition | Response |
| --- | --- |
| Host already has a live session | 409 with the conflicting session identified |
| Question or language not found | 400 or 404 |

## UC-03 Join a session as a guest

| Field | Value |
| --- | --- |
| **Actor** | Guest, with or without an account |
| **Goal** | Enter the live room from an invite |
| **Trigger** | The guest opens the invite link |
| **Preconditions** | The token is valid and the session is live |
| **Postconditions** | A participant record exists and the guest is in the room |

**Main flow**

1. The guest opens a URL carrying the access token. The client shows a short form requesting a display name, an optional email address and consent to be contacted.
2. The guest submits. The system verifies the token and confirms the session is live.
3. The system creates a guest participant, recording the display name and, where given, the email and the consent with a timestamp.
4. The system returns the participant identifier, which the client stores for this session only.
5. The client requests the room bootstrap data, which succeeds because the participant is now a member.
6. The client opens both real time channels and enters the full screen room.

**Alternate flows**

*Signed in guest.* If the caller holds an account whose email matches the participant's email, the system links the participant to that account. If the emails differ, the request is refused rather than silently claimed.

*Repeated join.* If the same identity joins twice, the existing participant is returned and no duplicate is created.

**Exception flows**

| Condition | Response |
| --- | --- |
| Token invalid | The client explains that the link is not usable and offers a path home |
| Session not live | The client shows that the session has ended |
| Signed in as a different account | 403 |

## UC-04 Code together in the live room

| Field | Value |
| --- | --- |
| **Actor** | Host or guest |
| **Goal** | Write a solution together with real time feedback |
| **Trigger** | Either participant joins the room and types |
| **Preconditions** | Both participants are members of a live session |
| **Postconditions** | Both editors hold identical content |

**Main flow**

1. The client opens the collaboration channel and the events channel.
2. On the first synchronisation, the server sends the shared document. The client waits for that to complete before permitting edits or seeding a new buffer.
3. A participant creates or types in a buffer. The change is applied to the local document and sent as an update.
4. The relay forwards the update to every other connection in the session, which apply it and repaint.
5. Because the document is a conflict free data type, concurrent edits merge without server arbitration.
6. Each client publishes its cursor position and selection as awareness, which the other renders in the author's colour.
7. Either participant may open a further file or close a file; the change is shared.

**Exception flows**

| Condition | Behaviour |
| --- | --- |
| Connection lost | The client reconnects automatically and resynchronises the full document |
| Membership not valid at upgrade time | The server refuses the upgrade with 401 |
| One client crashes | The others continue; awareness drops that participant |

## UC-05 Run code and share the verdict

| Field | Value |
| --- | --- |
| **Actor** | Host or guest |
| **Goal** | Execute the current buffer and show the result to everyone |
| **Trigger** | The participant presses Run |
| **Preconditions** | The session is live and the caller is a participant |
| **Postconditions** | A run event is persisted and the verdict is visible to every participant |

**Main flow**

1. The client generates a run identifier, so it can recognise its own result when it returns, and submits the source with the language and any standard input.
2. The server verifies membership and that the session is live, then rejects the request otherwise.
3. The server forwards the code to the sandbox and maps the provider's answer to a platform verdict with the streams, the compile output, the exit code, the time and the memory.
4. The server persists a run event carrying the result, the source and the standard input.
5. The server broadcasts a result message to the room, carrying the author and the run identifier.
6. Every client appends the result to the shared output feed, in the order the runs completed, attributed to its author.
7. The client that submitted the run sees its own result exactly once, whether it arrives over the broadcast or as its own HTTP response.

**Alternate flows**

*Joining mid session.* On entering, the client fetches the persisted run events and shows them before any live result, so the feed is continuous rather than starting empty.

**Exception flows**

| Condition | Behaviour |
| --- | --- |
| Session not live | 400 and the client explains that the session has ended |
| Not a participant | 401 |
| Sandbox unavailable | The room receives an internal error verdict and editing continues |

## UC-06 Change the question during a session

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Move the room to a different problem |
| **Trigger** | The host picks a question and confirms |
| **Preconditions** | The session is live and the host owns it |
| **Postconditions** | Every participant's room shows the new question |

**Main flow**

1. The host opens the question picker and browses their library, filtered by language where relevant.
2. The host chooses a question and a language.
3. The server refuses the change unless the session is live and the caller owns it.
4. The server updates the session and persists a question change event.
5. The server broadcasts the new question to the room.
6. Each client replaces the question header. The shared buffer is left intact, so work in progress is never destroyed by a question change.
7. A client that joins later receives the current question from the bootstrap data, so no broadcast is required for them.

## UC-07 Keep private notes

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Record observations that the guest must never see |
| **Trigger** | The host types in the notes field and saves |
| **Preconditions** | The host owns a session with at least one guest |
| **Postconditions** | The notes are stored and are unreadable by the guest |

**Main flow**

1. The host opens the notes tab. The field stays empty until the host types, so the stored value is never silently overwritten by an untouched field.
2. The host types and saves.
3. The server validates the request, refuses a caller who does not own the session, and updates only the notes column.
4. A save that changes nothing is not sent.
5. The value is stored exactly as written, with no evaluation fields coupled to it.
6. No guest facing endpoint returns these notes.

## UC-08 Evaluate the guest

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Record a private assessment of the guest |
| **Trigger** | The host submits the evaluation form after the session completes |
| **Preconditions** | The session is a completed interview with a guest participant |
| **Postconditions** | An evaluation exists, readable only by the host |

**Main flow**

1. When the host completes a session, the room prompts for a rating and notes.
2. The host selects weak, average or strong, writes optional notes and submits.
3. The server refuses the request unless the caller owns the session, the session is a completed interview, and the evaluated participant is a guest of it.
4. The server writes only the fields present in the request, so a rating only save does not clear existing notes and a notes only save does not clear the rating.
5. An existing evaluation for that pair is updated rather than duplicated.
6. The guest is never shown the assessment, and no guest facing endpoint returns it.

## UC-09 Review a completed session

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Study how the session went |
| **Trigger** | The host opens a session from the list |
| **Preconditions** | The host owns the session |
| **Postconditions** | The host sees the session's detail, events and evaluation |

**Main flow**

1. The host selects a session.
2. The client fetches the session detail, which includes its questions, participants and evaluation.
3. The client fetches the event log for that session, which returns every event in order with its actor.
4. The client presents the history so that runs, question changes and status transitions can be followed in sequence.

## UC-10 Produce reports

| Field | Value |
| --- | --- |
| **Actor** | Host |
| **Goal** | Understand patterns across sessions and export the underlying data |
| **Trigger** | The host opens reports and selects a range |
| **Preconditions** | The host is authenticated |
| **Postconditions** | The figures and, on export, a file are produced |

**Main flow**

1. The host opens reports and selects a range.
2. The client requests the figures for that range.
3. The server computes totals, average duration, completion rate, the sessions over time series, the language distribution and the rating split, scoped to the caller.
4. The client presents the figures and charts.
5. The host exports. The server streams the sessions of the same range as comma separated values with a header row.

---

# 6. System Models

## 6.1 Context diagram

```
                +-------------------+
                |  Anonymous        |
                |  visitor          |--------- registers / signs in --------+
                +-------------------+                                     |
                                                                          v
                                                          +----------------------------+
                                                          |        ALGORYM            |
                                                          |  Marketing · Dashboard    |
                                                          |  Live room · Reports      |
                                                          +----------------------------+
                                                                    |            ^
                                                       runs code    |            | live updates
                                                                    v            |
                                                        +----------------+   +------------------+
                                                        | Code execution |   |   Email          |
                                                        | sandbox        |   |   provider       |
                                                        +----------------+   +------------------+
                                                                    |
                                                                    v
                                                        +----------------+
                                                        |   PostgreSQL   |
                                                        +----------------+
```

## 6.2 Deployment

The client is built to static assets and served from a content delivery network. The server runs as a single Node process on a container platform, with a managed PostgreSQL instance and TLS termination at the platform edge. Both WebSocket channels are served by the same process and are reachable on the same origin as the API. A liveness endpoint at the root path reports process health and, on request, database reachability.

For a free tier deployment the container sleeps after inactivity, which is why the client, on a connection failure, polls a health endpoint with backoff and then replays the original request once. The poll has no side effects, so replaying a write after a wake cannot duplicate it.

## 6.3 Activity model, editor synchronisation

```
Host                Client(shared doc)          Relay              Guest
 |                        |                       |                   |
 | edit                   |                       |                   |
 |----------------------->| apply locally         |                   |
 |                        |---------------------->|                   |
 |                        |                       |------------------>|
 |                        |                       |                   | apply
 |                        |<----------------------|                   |
 |                        |                       |                   |
 | (concurrent edit)     |                       |<------------------| edit
 |                        |                       |                   |
 |                        |<----------------------|                   |
 | merge (CRDT)          |                       |                   |
 | (no server arbitration)                       |                   |
```

## 6.4 State model, session

```
                    create with scheduled_at
        (none) ----------------------------------> scheduled
           |                                        |    |
           | create without scheduled_at            |    | start (host or job)
           |                                        |    v
           +-------------------------------------> live <---------+
                                                   |  |             |
                            complete (host) --------+  |             |
                                   |                   |             |
                                   v                   v             |
                             completed            expired <------- +------+
                                   |                   |
                                   | cancel (host)     | cancel (host)
                                   +--------> cancelled <---------+
```

Rules encoded by this model:

* A session with a scheduled time becomes live when its time arrives or when the host starts it early.
* A live session with a guest present becomes completed when its expiry passes, because the interview was worked and the host must be able to evaluate it.
* A live session with no guest ever present becomes expired, because nothing happened.
* Cancellation is available from scheduled and from live, and not from a finished session.
* The host cannot manually expire a session.

## 6.5 Data flow, one code execution

```
Client        Route        Controller        Code run service     Sandbox        Broadcast
  |             |              |                  |                 |              |
  |-- POST ---->|              |                  |                 |              |
  |             |-- validate ->|                  |                 |              |
  |             |              |-- verify member -->                  |              |
  |             |              |-- verify live --->|                 |              |
  |             |              |----------------->|--- execute ----->|              |
  |             |              |                  |<-- result -------|              |
  |             |              |-- map verdict --->                  |              |
  |             |              |-- persist event ->                  |              |
  |             |              |------------------------------------------> run_result |
  |<-- 200 -----|              |                  |                 |              |
  |  (client de-duplicates its own run by run id)                  |              |
```

# 7. Validation Criteria

## 7.1 Verification approach

| Level | Method |
| --- | --- |
| Unit and integration | An automated suite runs against a real database rebuilt from the canonical schema before each run. It covers authentication and revocation, question ownership, session lifecycle and guards, joining including repeat and cross session cases, code execution contract, evaluation ownership, and the event feed. |
| Type verification | Both applications compile under strict type checking, and the shared package means a contract change fails compilation on both sides at once. |
| Static analysis | The client is linted; the known baseline is unchanged by new work. |
| Build verification | The client produces a production bundle; the server compiles. |
| Manual | Scenario walkthrough of the primary use cases in section 5 on desktop and at a 390 px viewport. |

## 7.2 Acceptance criteria by requirement group

| Group | The system is accepted when |
| --- | --- |
| FR-A | Registration, sign in, silent renewal and revocation are demonstrated, and a token issued before a revocation is demonstrably rejected. |
| FR-Q | Questions are created, filtered, paginated and deleted; a non owner is refused. |
| FR-S | Each legal transition succeeds and each illegal transition is refused with a conflict. |
| FR-J | A guest joins from a link with no account, a repeat join returns the same participant, and a participant from another session is refused. |
| FR-C | Two browsers edit one buffer with both cursors visible, and a late joiner sees the existing content rather than overwriting it. |
| FR-R | A run's verdict appears on both screens, the feed shows each run once in completion order, and a late joiner sees earlier runs. |
| FR-E | A rating saves without clearing notes and vice versa, and a guest cannot obtain either by any route. |
| FR-P | Events are returned in order with their actors, and a background transition is logged. |
| FR-D | Figures agree with the underlying data, charts render at every viewport, and the export matches the range on screen. |
| FR-M | Every dashboard route fits a 390 px viewport with no overflow and one consistent type scale. |
| SR-1 to SR-14 | Each is verified by inspection of the corresponding mechanism, and the suite covers the negative cases. |

## 7.3 Traceability

| Requirement group | Primary test area | Manual scenario |
| --- | --- | --- |
| FR-A | Authentication suite | Sign in, sign out, sign in again |
| FR-Q | Question suite | Create, filter, edit, delete |
| FR-S | Session suite | Full lifecycle including illegal transitions |
| FR-J | Join suite | Guest join, repeat join, foreign participant |
| FR-C | Not automated; verified manually | Two browsers editing concurrently |
| FR-R | Execution suite | Run, verify persistence and broadcast |
| FR-E | Evaluation suite | Rating, notes, ownership refusal |
| FR-P | Event feed suite | Ordering, filtering, actor attribution |
| FR-D | Verified against seeded data | Dashboard and reports walkthrough |
| FR-M | Not automated; verified manually | Responsive walkthrough at 360 and 390 px |

## 7.4 Risks to verification

Collaboration correctness cannot be fully proven by an automated suite without a deterministic multi client harness; it is therefore verified manually with two browsers and, for merging, by direct manipulation of the document. Chart rendering across viewport sizes is verified by measurement rather than by assertion. Both limitations are stated rather than hidden.

---

# 8. Appendices

## Appendix A: Glossary

**Access token** — short lived credential proving an authenticated identity, delivered as an httpOnly cookie.
**Anonymous participant** — a participant with no linked account, identified only by a display name and an unguessable participant identifier.
**Attempted session** — a session that was created but never reached a live state.
**Capability** — a credential that is sufficient on its own without an identity, such as an invite token plus a participant identifier.
**CRDT** — a data structure whose concurrent edits can be merged on any replica in any order with the same result.
**Document** — the shared Yjs structure holding the session's file buffers.
**Room** — the set of event channel connections for one session.
**Run identifier** — a value generated by the requesting client and echoed on the broadcast so the client can recognise its own result.
**Token version** — an integer claim that invalidates every outstanding token for an account when incremented.
**Verdict** — the classification of an execution outcome, always accompanied by a text label as well as a colour.

## Appendix B: Requirement index

| Prefix | Meaning | Section |
| --- | --- | --- |
| FR-A | Authentication and accounts | 3.1.1 |
| FR-Q | Question bank | 3.1.2 |
| FR-S | Session lifecycle | 3.1.3 |
| FR-J | Invitation and joining | 3.1.4 |
| FR-C | Live collaboration and editor | 3.1.5 |
| FR-R | Code execution and output feed | 3.1.6 |
| FR-E | Host notes and evaluation | 3.1.7 |
| FR-P | Event log and replay | 3.1.8 |
| FR-D | Dashboard, reports and export | 3.1.9 |
| FR-SET | Settings and profile | 3.1.10 |
| FR-M | Presentation and navigation | 3.1.11 |
| FR-N | Notifications | 3.1.12 |
| FR-H | Human interface | 3.2.1 |
| PR | Performance | 3.3 |
| SR | Security | 3.4 |
| UA, RL, MT, PT, OR | System attributes | 3.5 |
| UC | Use cases | 5 |

## Appendix C: Change history

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026 | Initial specification issued for the final year project. |
