# HEARTBEAT.md — Active Checks

## Memory System: Elite Longterm Memory 🧠

Memory wird jetzt über das Elite Longterm Memory System gehandhabt:
- **SESSION-STATE.md** — Hot RAM (aktiver Kontext)
- **MEMORY.md** — Curated long-term memory
- **memory/*.md** — Daily logs

### WAL Protocol
Bei wichtigen User-Inputs: ERST in SESSION-STATE.md schreiben, DANN antworten.

### Bei Heartbeats
- Nichts Besonderes zu tun — Memory System läuft automatisch
- Bei Bedarf: SESSION-STATE.md aufräumen

## Tracking
```json
{
  "memorySystem": "elite-longterm-memory",
  "version": "1.2.2"
}
```
