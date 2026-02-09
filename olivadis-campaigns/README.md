# Olivadis Retargeting Kampagnen Setup

## Ziel: 5x ROAS (aktuell 2.6x)

Retargeting liefert typischerweise 50% höhere Conversion Rates und bis zu 6.7x ROAS.

---

## SCHRITT 1: Custom Audiences erstellen (im Ads Manager)

### 1.1 Cart Abandoners (7 Tage) — HÖCHSTE PRIORITÄT
1. Geh zu: Audiences → Create Audience → Custom Audience
2. Wähle: Website
3. Events: 
   - Include: `AddToCart` in den letzten **7 Tagen**
   - Exclude: `Purchase` in den letzten **7 Tagen**
4. Name: `Olivadis - Cart Abandoners 7d`

### 1.2 Website Visitors (30 Tage)
1. Create Audience → Custom Audience → Website
2. Events: All website visitors, letzten **30 Tage**
3. Exclude: Purchase in letzten 30 Tagen
4. Name: `Olivadis - Website Visitors 30d`

### 1.3 Past Purchasers (180 Tage)
1. Create Audience → Custom Audience → Website
2. Events: `Purchase` in letzten **180 Tagen**
3. Name: `Olivadis - Purchasers 180d`

### 1.4 Lookalike aus Purchasers
1. Create Audience → Lookalike Audience
2. Source: `Olivadis - Purchasers 180d`
3. Location: Austria (oder DACH)
4. Size: 1% (höchste Qualität)
5. Name: `Olivadis - LAL Purchasers 1%`

---

## SCHRITT 2: Kampagnen importieren

Die Datei `campaigns-import.csv` kannst du im Ads Manager importieren:
1. Geh zu Ads Manager → Campaigns
2. Klick auf "Import" (oder erstelle manuell nach der Struktur)

**HINWEIS:** Meta's Bulk Import ist manchmal buggy. Falls es nicht klappt, 
erstell die Kampagnen manuell nach der Struktur in der CSV.

---

## SCHRITT 3: Creatives

Nutze eure Top-Performer ("Tradition" Creative mit 2.60x ROAS) als Basis.

Variationen testen:
- Urgency: "Nur noch X Flaschen" / "Letzte Chance"
- Social Proof: Bewertungen, Testimonials
- Benefit-fokussiert: Gesundheit, Geschmack, Qualität

---

## Budget-Empfehlung

| Kampagne | Tagesbudget | Erwarteter ROAS |
|----------|-------------|-----------------|
| Cart Abandoners | €20-30 | 4-6x |
| Website Visitors | €15-25 | 3-5x |
| Re-Engagement (Purchasers) | €10-15 | 3-4x |
| LAL Purchasers | €20-30 | 2-3x |

**Gesamt:** €65-100/Tag für Retargeting

---

## Bidding Strategie

Starte mit: **Lowest Cost** (automatisch)

Nach 50+ Conversions: Teste **Minimum ROAS 3.0** Bidding

---

## Wichtige Regeln

1. **Nie mehr als 20% Budget-Erhöhung** auf einmal
2. **3-4 Tage warten** zwischen Änderungen
3. **Mindestens 50 Optimization Events** bevor du skalierst
4. **Beste Creatives** aus Prospecting in Retargeting übernehmen
