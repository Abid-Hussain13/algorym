# Project Proposal / Synopsis

**Project title:** Algorym — A Live Collaborative Coding Interview Platform

**Document type:** Project Proposal and Synopsis

**Version:** 1.0

**Status:** Submitted for approval

---

## 1. Introduction

Technical interviews have drifted away from the work they are meant to assess. Candidates solve problems in front of a whiteboard while an interviewer takes notes, and neither party can execute a single line of what is written down. The feedback that follows is about confidence and communication rather than about the solution itself, and the candidate never gets to practise the part of the job that actually happens: writing code that runs, breaking it, reading an error, and fixing it while someone watches.

Algorym addresses that gap. It is a web platform on which an interviewer creates a live coding session, shares an invite link, and is joined by a candidate who works in the same editor at the same moment. Both screens stay in lockstep. When either person presses Run, both see the same verdict, the same standard output, the same wall clock time and the same memory figure. When the session ends, the host leaves a private assessment that the candidate never sees, and every keystroke, run and question change is kept so the interview can be replayed afterwards.

The project is named after the combining forms *algorithm* and *rhythm*: algorithms applied at interview pace, by two people, in real time.

## 2. Problem Statement

Existing preparation tools fall into two categories, and each one leaves a gap.

| Approach | What it offers | What is missing |
| --- | --- | --- |
| Practice platforms (LeetCode, HackerRank, CodeSignal) | Many problems, instant verdicts, solo | Nobody is present. No interview pressure, no conversation, no read of another person. |
| Pair programming tools (LiveShare, CoderPad) | Shared editor, real code execution | No interview structure. No question bank, no timing, no assessment, no record afterwards. |

Interviewers face the mirror problem. There is no lightweight tool that lets one person control a session, watch a candidate's work unfold, run the code themselves, and keep a private record of how it went, without scheduling time on a video call with a screen share and a second tool open beside it.

Algorym sits between the two categories. It provides the structure of an interview and the fidelity of a real editor, in a browser tab, with no installation for the candidate.

## 3. Objectives

The system shall be developed to the following objectives.

1. Deliver a shared code editor in which edits from either participant appear on the other screen with no perceptible delay, including remote cursors and presence.
2. Execute submitted code in five languages and return a complete verdict, with the result delivered to every participant in the room.
3. Enforce the structure of an interview through a server-controlled session lifecycle, so that invalid transitions are impossible rather than merely discouraged.
4. Allow a candidate to join from an invite link with no account, no installation and no sign up.
5. Keep the host's assessment private and the record of the session complete.
6. Give the host usable history: sessions, questions, ratings and reports that survive the end of the session.

## 4. Proposed Solution

Algorym is a full stack web application with three deliverables.

**A React single page application** that renders the marketing site, the interviewer dashboard and the live room. The live room is deliberately a separate top level route with no application chrome, so the editor owns the entire viewport.

**An Express and PostgreSQL backend** that owns authentication, the session lifecycle, the question bank, the event log and two WebSocket channels served from a single HTTP server.

**A shared type package** imported by both sides, so that no response shape can drift between them without a compile error.

The live room is the technical centre of the system and is built on three ideas.

*Conflict free collaboration.* The shared document is a Yjs CRDT. Because merges are commutative and idempotent, no server side conflict resolution is required and concurrent edits converge on every client. Awareness messages ride the same socket and carry cursor position and presence.

*Two channels, one server.* Application events travel as JSON text on one path and CRDT updates travel as binary on another. Both are served by one WebSocket server from one process, dispatched by path, because mixing text frames into a binary stream would corrupt the protocol.

*Capability based guest access.* A session carries a random access token. The guest's credential is that token plus the participant identifier issued at join time. The host, meanwhile, is an authenticated account. This lets the same session serve a signed in interviewer and an anonymous candidate without weakening the host's authority.

## 5. Proposed System Architecture

The system is a three tier web application deployed as static assets plus an API server.

```
Browser (React 19, Vite, CodeMirror 6, Yjs client)
   |  HTTPS / JSON-REST          WSS / JSON events (/ws)
   |                             WSS / binary CRDT (/collaboration/<sessionId>)
   v                             v
Express 5 API  ── routes ── controllers ── services ── pg ── PostgreSQL
        └────────────── single WebSocketServer, one upgrade listener ──────────────┘
                                 |
                     code execution sandbox (5 languages)
```

Requests follow a strict layering. Routes map URLs to controllers and hold no logic. Controllers read the request, call a service and send a response. Services own the database queries and never see the request or response objects, which lets the same service serve both the HTTP path and the WebSocket path. Middleware performs authentication, validation and error handling.

## 6. Key Features

| # | Feature | Summary |
| --- | --- | --- |
| F1 | Account and authentication | Email and password with bcrypt hashing, access and refresh tokens in httpOnly cookies, silent renewal, and server side revocation through a token version column. |
| F2 | Question bank | Owner scoped questions with difficulty, supported languages and per language starter code, with search, filtering and pagination. |
| F3 | Session lifecycle | Scheduled, live, completed, cancelled and expired states with server enforced transitions and a background job that starts and expires sessions on time. |
| F4 | Invite and join | A tokenised invite URL, a consent based join form, and instant entry to the room with no account required. |
| F5 | Live collaborative editor | Multi file shared editing with live cursors, per participant presence colours and a keyboard driven editor with vim bindings. |
| F6 | Code execution | JavaScript, Python, Java, C++ and Go, with standard input, compile output, standard error, verdict, execution time and memory, streamed to the whole room. |
| F7 | Host controls | Start, complete, cancel, change the active question mid session, and keep private notes. |
| F8 | Evaluation | A private rating of weak, average or strong with written notes, visible only to the host. |
| F9 | Replay and event log | Every meaningful action is persisted as an event, so a finished session can be reviewed in sequence. |
| F10 | Dashboard and reports | Session statistics, completion rate, rating distribution, a language mix breakdown, a sessions over time chart and CSV export. |
| F11 | Marketing and legal pages | A public product site, sign in and sign up, and the privacy policy and terms of service. |

## 7. Non Functional Targets

| Attribute | Target |
| --- | --- |
| Editor sync latency | Under 150 ms between a keystroke on one client and its appearance on the other |
| API response | Under 300 ms at the 95th percentile for reads, under 800 ms for writes |
| Code execution | Verdict returned and broadcast within 3 seconds for typical solutions |
| Availability | Session state recoverable from the database, with reconnect and resynchronisation of the editor on network loss |
| Security | Passwords hashed, tokens in httpOnly cookies only, all input validated against a schema, no unauthorised access to another user's sessions or evaluations |
| Accessibility | Keyboard operable editor and dialogs, visible focus, respects reduced motion preferences |
| Responsive behaviour | Marketing, dashboard, reports and replay fully usable from 360 px upwards |

## 8. Scope

**In scope for the final year project**

Account management, the question bank, the complete session lifecycle, the invite and join flow, the collaborative live room, code execution and the shared output feed, host notes and evaluation, the event log and replay, dashboard and reports with export, the public marketing site, and the privacy policy and terms of service.

**Explicitly out of scope**

Video and voice calling, which the platform positions as complementary to existing tools rather than a replacement. Automated scoring or plagiarism detection of candidate code. Payment and subscription handling. Native mobile applications; the live room is a desktop experience with a clear notice on smaller screens. Multi organisation tenancy, teams and recruiter workflows.

## 9. Risks and Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Concurrent editing causes divergence or data loss | High | Use an established CRDT library rather than bespoke synchronisation; the merge algorithm is proven and the relay stays stateless. |
| Anonymous guests could reach another candidate's session | High | Session tokens are 24 random bytes; participant identifiers are unguessable; every room endpoint re-verifies membership. |
| A code execution provider is unavailable or slow | Medium | The provider is isolated behind one service module with a clear error mapping; the room remains usable for editing when execution fails. |
| Host leaves mid session and the candidate is stranded | Medium | A background job expires unattended live sessions, and the distinction between an attended and unattended expiry is preserved so the host can still evaluate it. |
| Scope growth in reports and replay | Low | Both are built on the same persisted event log, so replay needs no new capture path. |

## 10. Deliverables and Timeline

| Phase | Weeks | Deliverable |
| --- | --- | --- |
| 1. Requirements and design | 1 to 2 | This proposal, the software requirements specification, the data model and the interface contract |
| 2. Backend foundation | 3 to 5 | Schema, authentication, question bank, session lifecycle, validation and error handling |
| 3. Realtime layer | 6 to 8 | Event channel, collaboration relay, code execution and the shared output feed |
| 4. Frontend foundation | 9 to 11 | Design system, marketing site, authentication screens and the dashboard shell |
| 5. Live room | 12 to 15 | Collaborative editor, presence, run and output panels, host controls, full screen guards |
| 6. Review and reporting | 16 to 17 | Evaluation, replay, dashboard, reports and export |
| 7. Hardening and release | 18 to 20 | Testing, accessibility, performance, deployment and documentation |

## 11. Evaluation Criteria

The project is considered complete when the following are demonstrable.

1. A host creates a session and a candidate joins from the invite link in a second browser with no account.
2. Edits made by either party appear on the other screen in real time, with the remote cursor visible.
3. Pressing Run on either screen produces a verdict visible on both screens within the latency target.
4. The session state machine refuses an invalid transition with a clear error.
5. The host can rate the guest, and the guest can never read that rating.
6. A completed session can be reviewed afterwards and its run history reproduced.
7. The system passes the automated test suite, the type checker and the production build with no errors.

## 12. Conclusion

Algorym is a focused answer to a specific gap: the practice platforms are solitary and the pair programming tools are unstructured. By combining an enforced interview structure with a genuinely shared code editor and a complete record of what happened, it gives both sides what the other kind of tool is missing. The architecture supports the real time core without a bespoke synchronisation protocol, and the requirement set is sized for a final year project while remaining a complete, deployable product.