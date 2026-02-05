# CODING_RULES.md — Bluemonkeys Entwicklungsstandards

> Dieses File wird von allen AI-Agents gelesen bevor sie Code schreiben.
> Kopiere es in jedes Kundenprojekt-Root als `AGENTS.md` oder `CODING_RULES.md`.

---

## 🎯 Oberste Regel

**Qualität vor Geschwindigkeit.** Lieber 1 Feature das funktioniert als 5 die halb fertig sind.

---

## 📝 Commit Standards

### Message Format
```
<type>: <kurze beschreibung>

[optionaler body mit details]
```

### Types
- `feat:` Neues Feature
- `fix:` Bugfix
- `refactor:` Code-Umbau ohne Funktionsänderung
- `docs:` Dokumentation
- `chore:` Maintenance (deps, config)
- `test:` Tests

### ❌ VERBOTEN
- `fixed` ohne Kontext
- `wip` commits auf main
- Mehrere unrelated Changes in einem Commit

---

## 🔒 Security

### NIEMALS committen:
- `.env` Files (nur `.env.example` mit Dummy-Werten)
- API Keys, Tokens, Passwords
- Datenbank-URLs mit Credentials
- Private Keys

### Vor jedem Push prüfen:
```bash
git diff --cached | grep -i "password\|secret\|token\|api_key"
```

---

## 🗂️ Repo Hygiene

### In .gitignore (IMMER):
```
*.log
*.backup*
node_modules/
.next/
dist/
.env*
!.env.example
```

### NIEMALS im Repo:
- Log files
- Backup files (`.backup`, `.bak`, `.old`)
- Build artifacts
- AI-generierte Dokumentation die niemand liest

---

## 🏗️ Code Qualität

### Bevor du ein Feature "fertig" nennst:
1. ✅ Funktioniert der Happy Path?
2. ✅ Edge Cases behandelt?
3. ✅ Error Handling vorhanden?
4. ✅ TypeScript Errors = 0?
5. ✅ Keine `any` Types (außer wirklich nötig)?
6. ✅ Console.logs entfernt?

### TODOs
- Jedes TODO braucht einen Kontext: `// TODO(greg): Implement rate limiting after MVP`
- Keine TODOs für kritische Features — entweder implementieren oder Issue erstellen

### Hardcoded Values
```typescript
// ❌ FALSCH
const apiUrl = 'https://api.example.com';

// ✅ RICHTIG
const apiUrl = process.env.API_URL;
```

---

## 🧪 Testing

### Minimum Requirements:
- API Endpoints: Mindestens Happy Path Test
- Kritische Business Logic: Unit Tests
- Integrations: Smoke Tests

### Wenn kein Test:
Dokumentiere WARUM nicht und wie man manuell testet.

---

## 📖 Dokumentation

### Was dokumentieren:
- README.md: Setup, Environment, wichtige Commands
- API Endpoints: Request/Response Format
- Komplexe Business Logic: Inline Kommentare

### Was NICHT dokumentieren:
- Offensichtliches (`// increment counter` vor `counter++`)
- AI-generierte Walls of Text die niemand liest

---

## 🔄 Workflow

### Vor dem Coding:
1. Verstehe das Problem (frag nach wenn unklar)
2. Plan den Approach (kurz, nicht 10 Seiten)
3. Identifiziere Risiken

### Während dem Coding:
1. Kleine, fokussierte Commits
2. Teste nach jedem signifikanten Change
3. Bei Problemen: erst debuggen, dann fragen

### Nach dem Coding:
1. Self-Review: Würde ich diesen Code in 3 Monaten verstehen?
2. Cleanup: Console.logs, commented code, unused imports
3. Commit mit sinnvoller Message

---

## 🤖 AI-Spezifisch

### Wenn du AI-generierten Code bekommst:
1. **LESEN** bevor committen
2. Verstehst du was es tut? Wenn nein → nicht committen
3. Macht es Sinn für dieses Projekt? 
4. Keine Copy-Paste Walls of Code

### Subagents:
- Klare, spezifische Tasks
- Definiertes Scope
- Review das Ergebnis bevor merge

---

## 🚨 Red Flags — Sofort stoppen und fragen:

- Mehr als 500 Zeilen in einem Commit
- Änderungen an Auth/Payment/Security ohne expliziten Auftrag
- "Ich versteh nicht warum aber es funktioniert jetzt"
- Dependency Updates die Breaking Changes haben könnten

---

## 📞 Kommunikation

- **Stuck > 15 min?** → Frag nach
- **Unsicher ob Approach richtig?** → Frag nach
- **Breaking Change nötig?** → Frag nach
- **Fertig?** → Kurzes Summary was gemacht wurde

---

*Letzte Aktualisierung: 2026-02-05*
*Maintainer: Greg / Dieter*
