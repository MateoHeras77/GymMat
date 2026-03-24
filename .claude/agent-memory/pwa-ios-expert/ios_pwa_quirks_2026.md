---
name: iOS PWA quirks discovered during 2026 audit
description: iOS Safari PWA behavior notes from auditing GymMat - Wake Lock, timers, audio, CSP, viewport
type: reference
---

## Wake Lock API
- Broken in iOS standalone PWAs until iOS 18.4. Now works on iOS 18.4+.
- Safari 18.4 added Declarative Web Push and Screen Wake Lock.

## setInterval throttling
- iOS Safari throttles setInterval to ~60s+ when tab is backgrounded or screen locked.
- Fix: use wall-clock `Date.now()` comparison instead of decrementing counters.

## Audio on iOS
- AudioContext must be created/resumed from user gesture.
- iOS mute switch silences Web Audio (ringer channel).
- data: URIs in HTML5 <audio> elements are unreliable on iOS Safari historically.
- CSP needs explicit `media-src 'self' data: blob:` or audio elements are blocked by default-src fallback.

## Viewport
- `user-scalable=no` ignored since iOS 10 (2016). Use `touch-action: manipulation` instead.
- `viewport-fit=cover` required for `env(safe-area-inset-*)` to work with black-translucent status bar.

## apple-touch-icon
- iOS requires 180x180 PNG. Must have opaque background (no transparency). Apple adds rounded corners automatically.

## iOS 26+
- Every site added to Home Screen defaults to opening as a web app.

## Storage
- Safari 17+ increased storage quotas to up to 60% of disk per origin.
- 50 MB cache limit enforced by Safari on iOS.
- No background sync support on iOS Safari.

## Vercel PWA deployment
- Must add vercel.json with: SPA rewrites, sw.js Cache-Control: max-age=0 must-revalidate, manifest Content-Type header.
- Without vercel.json, deep links 404 on refresh and service worker caching breaks.
