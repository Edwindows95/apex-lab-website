# Anonymized dashboard screenshots

Drop 7 PNG files into this folder. The site auto-uses them once named correctly. Missing files fall back to a striped placeholder — no broken images.

## Anonymization checklist (every screenshot)

- [ ] Participant name removed or replaced with "Participant A/B/C"
- [ ] Email / initials hidden in header
- [ ] Company/team names removed from calendar event titles (generic: "Partner sync", "1:1", "Client review")
- [ ] Date labels stay (they give credibility — "Week of April 14" is fine)
- [ ] Screenshot at 2x (retina) for crispness
- [ ] Export as PNG
- [ ] Crop to the aspect ratio below — no browser chrome, no nav bar

## The 7 files

### Scenarios (aspect ratio 4:3 — e.g. 1600×1200)

| Filename | What to capture |
|---|---|
| `scenario-meeting-day.png` | Day view. 6+ meetings. Stress overlay visible. Ideally a Tuesday or Wednesday showing the pile-up. |
| `scenario-travel-week.png` | Week view (or HRV trend view). HRV declining across the week. Sleep efficiency chart helpful too. |
| `scenario-recovery-week.png` | Week view. Clean deep-work blocks visible. Body Battery trending up. A "good" week in green. |
| `scenario-sleep-decline.png` | Sleep section, 6-week trend. Deep sleep bars shrinking over time. Any view that shows the silent decline. |

### Participant cards (aspect ratio 16:11 — e.g. 1600×1100)

| Filename | What to capture |
|---|---|
| `participant-a.png` | Stress-heavy week overview — KPIs + stress chart. Can overlap with `scenario-meeting-day` if useful. |
| `participant-b.png` | Recovery-heavy week overview — high Body Battery, clean calendar. |
| `participant-c.png` | Sleep trend alert view — 6-week rolling deep-sleep chart. |

## After drop-in

1. Reload http://localhost:8090/index.html
2. The placeholders disappear, real screenshots render
3. If an image is too dark/light, nothing to do on the HTML side — re-export at correct exposure

## If you want to reshoot later

Overwrite the file with the same name. Hard refresh the browser (Cmd+Shift+R) to bust the cache.
