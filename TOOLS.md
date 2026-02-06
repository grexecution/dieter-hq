# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Kalender-Regeln 📅

### Bei privaten Events während Arbeitszeit:
1. Event in Shared Apple Calendar (Mimi & Greg, Familie, etc.)
2. **IMMER** simultanen "Out of Office" Eintrag in **Bluemonkeys Google Calendar** machen
3. **NIE "Dieter" erwähnen** im Bluemonkeys Kalender — ist ein Arbeits-Kalender!

### Bei allen Kalender/Reminder-Einträgen:
- In Notizen immer schreiben: `🐕 Erstellt von Dieter`
- **Ausnahme:** Bluemonkeys Kalender (kein Dieter!)

## iCloud CalDAV

- **Apple ID:** greg.wallner@gmail.com
- **Kalender:**
  - Mimi & Greg (Freundin)
  - The Wallner Awesomeness (Familie)
  - Erinnerungen

## Google Kalender (gog CLI)

- **Bluemonkeys:** g.wallner@bluemonkeys.com — Arbeitskalender, Out of Office hier
- **Privat:** greg.wallner@gmail.com

## Apple Reminders (remindctl)

- **Listen:** Erinnerungen, Familie, Life, Shopping List
- Bimmelt auf iPhone wenn due time erreicht
- **Status:** Full access granted ✓

### Correct Commands
```bash
# List all lists
remindctl list

# Show reminders in a specific list
remindctl list "Erinnerungen"

# Time-based views (NOT list names!)
remindctl today
remindctl overdue
remindctl show --list "Erinnerungen"  # Filter by list

# Add reminder
remindctl add "Title" --list "Erinnerungen" --due tomorrow

# JSON output for scripting
remindctl list "Erinnerungen" --json
```

### ⚠️ Common Mistakes
- `remindctl show "Erinnerungen"` ❌ — "Erinnerungen" is not a filter
- `remindctl list "Erinnerungen"` ✓ — correct way to view a list

---

Add whatever helps you do your job. This is your cheat sheet.
