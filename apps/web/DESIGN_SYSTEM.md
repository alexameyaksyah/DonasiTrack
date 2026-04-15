# DonasiTrack Web Design System (Lavender Moon Console)

## Core Palette
- Lavender: `#9985f3`
- Orchid: `#c7b7fc`
- Thistle: `#e2d3ef`
- Pearl: `#f4ecfe`
- Console background: dark gradient (`#0f0f13` -> `#1b1b27`)

## Layout Pattern
- `admin-shell`: 2-column console layout (sidebar + main content).
- `console-sidebar`: navigation rail with grouped sections.
- `console-main`: content region with `console-topbar` + functional panels.
- Mobile behavior: single-column stack with sidebar on top.

## Sidebar Menu Icon Tokens
Use `console-link-icon` with short tokens:
- `DB`: Dashboard
- `CP`: Campaign
- `VD`: Verifikasi Donatur
- `LG`: Logistik
- `OP`: Operasional
- `TR`: Tracking
- `RW`: Relawan
- `AU`: Auth
- `RP`: Laporan
- `ST`: Pengaturan

## Button Semantics
Use semantic classes consistently by action purpose.

### Regular buttons (`.btn`)
- `btn info`: lookup/load/navigation helper action.
- `btn success`: submit/create/verify/send action.
- `btn danger`: reject/delete/logout destructive action.
- `btn neutral`: secondary/non-destructive helper action.
- `btn warning`: caution action where data is not destroyed.

### Console buttons (`.console-btn`)
- `console-btn info`: access/login CTA.
- `console-btn success`: execute important positive action.
- `console-btn danger`: destructive/exit action.
- `console-btn neutral`: secondary action (for example, "Lihat Semua").

## Interaction Rules
- Any async action button must:
  - show loading text (`Memproses...`, `Mengirim...`, `Memuat...`)
  - use `disabled={true}` while pending
  - reset loading state in `finally`
- Disabled state is globally styled via:
  - `.btn:disabled`
  - `.console-btn:disabled`

## Status Components
- `console-tag`: compact semantic status in KPI cards.
- `console-status ok|pending`: table badge statuses.
- `console-progress-bar`: metric progress representation.

## Implementation Notes
- Keep data logic unchanged; only style and interaction feedback are enhanced.
- For new pages, prefer composing from existing console classes before creating new primitives.
