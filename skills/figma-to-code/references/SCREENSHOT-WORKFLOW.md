# Screenshot-Abgleich Workflow

## Ziel: Pixel-Perfect Desktop Match

Der Screenshot ist die **Ground Truth**. MCP liefert Daten, aber der Screenshot entscheidet ob es stimmt.

## Workflow pro Section

### Schritt 1: Screenshot aus Figma

1. Figma öffnen
2. Section Frame auswählen
3. Export: PNG, 1x, Desktop Viewport (1440px oder 1920px)
4. Speichern: `screenshots/section-name.png`

**Tipp:** Frame isoliert exportieren, nicht die ganze Page.

### Schritt 2: Browser Setup

```bash
# Dev Server starten
npm run dev

# Browser öffnen
# Chrome DevTools → Toggle Device Toolbar → Responsive
# Viewport auf exakt 1440px (oder was Figma zeigt)
```

### Schritt 3: Overlay-Vergleich

**Option A: PerfectPixel Extension**
1. Chrome Extension "PerfectPixel" installieren
2. Screenshot hochladen
3. Opacity auf 50%
4. Position anpassen
5. Differenzen werden sichtbar

**Option B: DevTools Overlay**
1. Screenshot als `<img>` temporär einbauen
2. Position: absolute, z-index: 9999
3. Opacity: 0.5
4. Vergleichen und adjustieren

**Option C: Figma Plugin "Overlay"**
1. Browser Screenshot machen
2. In Figma als Overlay drüberlegen
3. Vergleichen

### Schritt 4: Differenzen fixen

Typische Probleme:

| Problem | Lösung |
|---------|--------|
| Spacing zu groß/klein | Tailwind padding/margin anpassen |
| Font-Size off | fontSize in Tailwind Config |
| Line-Height off | leading-* classes |
| Farbe leicht anders | Hex-Wert aus Figma prüfen |
| Border-Radius anders | rounded-* anpassen |
| Shadow anders | Custom shadow in config |

### Schritt 5: Verifizieren

1. Overlay nochmal prüfen
2. Opacity auf 100% → kein Shift sichtbar?
3. Opacity auf 0% → sieht identisch aus?
4. ✅ Fertig!

---

## Acceptable Differences

Diese Unterschiede sind OK:

- **Fonts:** Minimal unterschiedliches Rendering (Browser vs Figma)
- **Antialiasing:** Leichte Unterschiede an Kanten
- **Bilder:** Placeholder vs echte Bilder

Diese müssen gefixt werden:

- **Spacing:** Muss exakt sein
- **Größen:** Buttons, Cards, Container
- **Layout:** Alignment, Reihenfolge
- **Farben:** Muss matchen

---

## Tipps

### Figma Export Settings
```
Format: PNG
Scale: 1x (nicht 2x!)
Viewport: Wie im Design (z.B. 1440px)
Background: Wie im Design
```

### Browser Viewport exakt setzen
```javascript
// In DevTools Console:
window.resizeTo(1440, 900)

// Oder: Responsive Mode → 1440 x 900 eingeben
```

### Screenshot-Ordner Struktur
```
screenshots/
├── home/
│   ├── hero.png
│   ├── features.png
│   └── testimonials.png
├── about/
│   ├── hero.png
│   └── team.png
└── contact/
    └── form.png
```

---

## Checkliste pro Section

```markdown
- [ ] Figma Screenshot exportiert (1x, PNG)
- [ ] Browser Viewport korrekt (1440px)
- [ ] Overlay-Vergleich gemacht
- [ ] Spacing korrigiert
- [ ] Typography korrigiert
- [ ] Farben korrigiert
- [ ] Final Check: Overlay 50% zeigt Match
```
