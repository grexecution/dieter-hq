# Olivadis Kampagnen-Struktur — Step-by-Step

## ZUERST: Custom Audiences erstellen

### Audience 1: Cart Abandoners 7d
1. Ads Manager → ☰ Menü → **Audiences**
2. **Create Audience** → **Custom Audience**
3. **Website** auswählen
4. Bei "Include people who":
   - Event: **AddToCart**
   - In the past: **7** days
5. **Exclude people who**:
   - Event: **Purchase**
   - In the past: **7** days
6. Audience name: `Cart Abandoners 7d`
7. **Create Audience**

### Audience 2: Website Visitors 30d
1. **Create Audience** → **Custom Audience** → **Website**
2. Bei "Include people who":
   - **All website visitors**
   - In the past: **30** days
3. **Exclude people who**:
   - Event: **Purchase**
   - In the past: **30** days
4. Audience name: `Website Visitors 30d`
5. **Create Audience**

### Audience 3: Purchasers 180d
1. **Create Audience** → **Custom Audience** → **Website**
2. Bei "Include people who":
   - Event: **Purchase**
   - In the past: **180** days
3. Audience name: `Purchasers 180d`
4. **Create Audience**

---

## KAMPAGNE 1: ASC Prospecting

### Campaign erstellen
1. Ads Manager → **+ Create**
2. Campaign objective: **Sales**
3. ⚠️ **Advantage+ Shopping Campaign** aktivieren (Toggle oben!)
4. Campaign name: `Olivadis - ASC Prospecting`
5. **Next**

### Campaign Settings
| Feld | Einstellen |
|------|------------|
| Conversion location | Website |
| Pixel | Euer Olivadis Pixel |
| Conversion event | Purchase |
| Budget | €50 per day |
| Countries | Austria |

### Existing Customer Settings
1. Bei "Existing customers" → **Define**
2. Audience auswählen: `Purchasers 180d`
3. Budget cap for existing customers: **20%**

### Ads
1. **Add creatives** → Eure 4-6 besten Bilder/Videos hochladen
2. Primary text, Headline, etc. aus euren bestehenden Ads
3. Website URL: Eure Shop URL
4. **Publish**

---

## KAMPAGNE 2: Interest Targeting

### Campaign erstellen
1. **+ Create** → **Sales** → ⚠️ **NICHT** Advantage+ (normaler Modus)
2. Campaign name: `Olivadis - Interest Targeting`
3. Campaign budget: **Advantage Campaign Budget AN**
4. Budget: €40 per day
5. **Next**

### Ad Set 1: Foodies
| Feld | Einstellen |
|------|------------|
| Ad set name | Foodies |
| Conversion event | Purchase |
| Budget | (wird automatisch verteilt) |
| **Locations** | Austria |
| **Age** | 28 - 65 |
| **Detailed Targeting** | Siehe unten |

**Detailed Targeting → Browse → Interests:**
- Food and drink → Cooking
- Food and drink → Food & Wine  
- Food and drink → Italian cuisine
- Food and drink → Gourmet food

**Exclude (Custom Audiences):**
- `Website Visitors 30d`
- `Purchasers 180d`

**Placements:** Advantage+ Placements (automatisch)

### Ads für Ad Set 1
1. **Create ad**
2. Ad name: `Foodies - Creative 1`
3. **Use existing post** oder neue Creative hochladen
4. Eure beste Creative auswählen
5. Primary text + Headline von euren bestehenden Ads
6. Website URL
7. Call to action: **Shop now**

Wiederholen für 1-2 weitere Creatives.

### Ad Set 2: Health (Duplicate & Edit)
1. Ad Set "Foodies" → **Duplicate**
2. Ad set name ändern: `Health`
3. **Detailed Targeting ändern** → alte löschen, neue:
   - Organic food
   - Health and wellness → Health & Wellness
   - Fitness and wellness → Nutrition
   - Mediterranean diet

4. **Save**
5. Ads prüfen/anpassen

**Publish** wenn beide Ad Sets fertig.

---

## KAMPAGNE 3: Cart Abandoners

### Campaign erstellen
1. **+ Create** → **Sales** → Normaler Modus
2. Campaign name: `Olivadis - Cart Abandoners`
3. Advantage Campaign Budget: AN
4. Budget: €30 per day
5. **Next**

### Ad Set
| Feld | Einstellen |
|------|------------|
| Ad set name | Cart 7d |
| Conversion event | Purchase |
| **Custom Audiences** | `Cart Abandoners 7d` |
| Placements | Advantage+ Placements |

⚠️ **Keine** Locations/Age/Interests — nur die Custom Audience!

### Ads
1. 2 Creatives hinzufügen
2. Primary text/Headline von bestehenden Ads
3. **Publish**

---

## KAMPAGNE 4: Website Visitors

### Campaign erstellen
1. **+ Create** → **Sales** → Normaler Modus
2. Campaign name: `Olivadis - Website Visitors`
3. Budget: €25 per day
4. **Next**

### Ad Set
| Feld | Einstellen |
|------|------------|
| Ad set name | Visitors 30d |
| Conversion event | Purchase |
| **Custom Audiences** | `Website Visitors 30d` |
| Placements | Advantage+ Placements |

### Ads
1. 2 Creatives hinzufügen
2. **Publish**

---

## KAMPAGNE 5: Re-Engagement

### Campaign erstellen
1. **+ Create** → **Sales** → Normaler Modus
2. Campaign name: `Olivadis - Re-Engagement`
3. Budget: €15 per day
4. **Next**

### Ad Set
| Feld | Einstellen |
|------|------------|
| Ad set name | Purchasers 180d |
| Conversion event | Purchase |
| **Custom Audiences** | `Purchasers 180d` |
| Placements | Advantage+ Placements |

### Ads
1. 2 Creatives hinzufügen
2. **Publish**

---

## CHECKLISTE

- [ ] 3 Custom Audiences erstellt
- [ ] Kampagne 1: ASC Prospecting (€50)
- [ ] Kampagne 2: Interest Targeting (€40) mit 2 Ad Sets
- [ ] Kampagne 3: Cart Abandoners (€30)
- [ ] Kampagne 4: Website Visitors (€25)
- [ ] Kampagne 5: Re-Engagement (€15)

**Total: €160/Tag**
