# SYSTEM_CHANGES.md — Änderungen am OpenClaw System

Dokumentation aller Änderungen die ich am System mache, für Reflexion und Debugging.

---

## 2026-02-06

### OpenAI ChatCompletions Endpoint deaktiviert
- **Zeit:** 11:45
- **Was:** `gateway.http.endpoints.chatCompletions.enabled` von `true` auf `false`
- **Warum:** 
  - 49 Zombie-Sessions entstanden durch `/status` Requests über diesen Endpoint
  - Requests kamen von WebKit.Networking (Safari/Webchat Tabs oder DieterHQ)
  - Greg hat keine OpenAI API Keys, braucht den Endpoint nicht
  - Session-Spam könnte Telegram-Delays verursacht haben
- **Ursprung gefunden:**
  - PID 874 = `com.apple.WebKit.Networking`
  - Burst von Requests um 10:02-10:03 Uhr
  - Alle Sessions enthielten nur `/status` als Message
- **Erwartetes Ergebnis:** Keine neuen OpenAI-Sessions, weniger Last auf Gateway
- **Rollback:** `gateway.http.endpoints.chatCompletions.enabled: true`

---

## Template für neue Änderungen

### [Änderung Name]
- **Zeit:** 
- **Was:** 
- **Warum:** 
- **Ursprung gefunden:** 
- **Erwartetes Ergebnis:** 
- **Rollback:** 
