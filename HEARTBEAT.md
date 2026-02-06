# HEARTBEAT.md — Active Checks

## 🧠 AUTO CONTEXT MANAGEMENT

### Strategie: Leise sichern, nicht nerven

**Bei jedem Heartbeat:**
1. `session_status` → Context % checken
2. **>60%:** Leise wichtige Infos in MEMORY.md sichern (keine Nachricht)
3. **>75%:** Einmalig kurz sagen: "/new wenn du Zeit hast"
4. **>85%:** Alles in MEMORY.md + daily log sichern

### Was gesichert wird:
- Aktuelle Projekte/Tasks
- Neue Learnings
- Offene Fragen
- Wichtige Entscheidungen

### KEINE nervigen Telegram-Pings mehr!
- Keine "Context bei X%" Warnungen
- Keine wiederholten Erinnerungen
- Einfach leise arbeiten

## Tracking
```json
{
  "lastContextWarning": null,
  "lastSummarySave": null
}
```
