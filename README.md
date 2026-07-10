# Creation Semiotics — public site (Phase 1)

Shared brand shell for the free front door and the Library map.

**Live:** https://remnantbelieverx.github.io/creation-semiotics-site/  
**Public source (HTML only):** https://github.com/remnantbelieverx/creation-semiotics-site  
**Redeploy after local edits:** `bash Hermes/scripts/deploy_public_site.sh`

**Vault documentation (constitution, publish boundary, status):**  
`Hermes/Memory/Public-Site.md` — agents and owners should update that file when
architecture or phase gates change; this README stays run/routes-focused.

## Pages

| URL | File | Register | Role |
|-----|------|----------|------|
| `/` | `index.html` | **court** → **grace** | The Verdict — forensic examination |
| `/#/sign` | `index.html` | court | Gallery of free exhibits |
| `/menorah.html` | `menorah.html` | **library** | Interactive Menorah index |
| `/branch.html#/N` | `branch.html` | **library** | Branch view (positions 1–7) |

## Design system

```
site/css/tokens.css   — shared void, type, gold, register accents
site/css/chrome.css   — top bar, buttons, footer
```

**One brand, three registers:**

- `data-register="court"` — ice accent (examination)
- `data-register="grace"` — brand gold (after Robe Exchange; also `body.graced`)
- `data-register="library"` — brand gold + warm lamp stage (Menorah)

Shared: cool-neutral void (`#0B0D12`), single gold alloy (`#D4A84A`),
Cormorant Garamond + Spectral, mono for forensic UI.

Cross-links: Verdict ↔ Lamp ↔ Branches (and free Signs).

### Branch view

- Hash routes: `branch.html#/1` … `branch.html#/7` (default `#/3` Wisdom).
- Mini-menorah: touch any flame to switch branch.
- From Menorah panel: **Enter this branch →**.
- Position 3 ships with full triad copy, sample public entry cards, and dropped candidates; other positions have full triads/disciplines with entry cards pending allowlist.

## Run it

```bash
python3 -m http.server 8000 -d site
# http://127.0.0.1:8000/              The Verdict
# http://127.0.0.1:8000/menorah.html
# http://127.0.0.1:8000/branch.html#/3
```

No build step. CSS must be served over HTTP (not always reliable via `file://`).

## Care (Phase 1b)

| Piece | Location |
|-------|----------|
| Sequence copy (want / questions / Signature) | `Hermes/Drafts/Verdict-Care-Sequences.md` |
| Next-steps landing | `care/welcome.html` |
| Door forms + ESP hooks | `index.html` → `CONFIG.esp` |

When ESP is live, paste form action URLs into `CONFIG.esp` and load the seven
emails as an automation on tag `verdict-want`.

## Theological spine

- **Verdict** — Entry 1.1 (Conscience), CDP-XIII Robe Exchange; general-revelation altitude.
- **Menorah** — Menorah Disciplines Map + Entry 3.2 triads; Library coordinate system.
  Public copy stays plain; sod-level material stays off the public path.

## Deliberately deferred

- Live ESP *account* (copy ready; owner creates Buttondown/Kit and fills `CONFIG.esp`).
- Church-finder, deploy/domain, Plausible production.
- Corpus-driven entry chips on Menorah positions (next Library slice).
- Membership / paywall.
