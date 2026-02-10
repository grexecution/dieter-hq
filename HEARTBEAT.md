# HEARTBEAT.md — Active Checks

## Memory System: openclaw-mem 🧠

Einfaches, natives Memory System:

### Drei Layer
1. **Session (RAM)** — Kurzzeit, wird komprimiert
2. **Daily Logs** — `memory/YYYY-MM-DD.md`
3. **Long-Term** — `MEMORY.md` (curated)

### Regeln
- Disk ist Wahrheit, RAM ist Convenience
- `memory_search` → `memory_get` für Retrieval
- Durable Knowledge VOR Compaction speichern

### Bei Heartbeats
- Nichts Besonderes — System ist native
- Bei Bedarf: Daily Log updaten

## Tracking
```json
{
  "memorySystem": "openclaw-mem",
  "version": "2.1.0"
}
```
