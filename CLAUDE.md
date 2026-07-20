# CLAUDE.md — Ancré dans la peau

Instructions de développement pour Claude. Lire avant de modifier quoi que ce soit.

---

## Stack technique

- **HTML/CSS/JS Vanilla** — zéro framework, zéro bundler
- **Fichier unique** : `index.html` (tout-en-un : HTML + CSS + JS)
- **Page artiste** : `artiste.html` (formulaire d'inscription multi-étapes)
- **Hébergement** : Netlify (branche `main` = production)
- **Repo GitHub** : `mathieudufour06-svg/ancre-site` (branche `v2` → merge sur `main`)
- **Domaine** : ancredanslapeau.ca
- **Formulaires** : Netlify Forms (`data-netlify="true"`, name `inscription-artiste`)
- **Carte** : Leaflet.js + tuiles CartoDB Dark (`dark_all`)
- **Analytics** : GA4 `G-14D6EFLX0H`

---

## Design system — CSS variables

```css
--ink:       #0A0A0A   /* fond principal */
--ink-2:     #111111
--ink-3:     #181614
--ink-4:     #201D1A
--gold:      #C8A96E   /* accent principal */
--gold-hi:   #E2C07A
--gold-dim:  #9A7F52
--gold-glow: rgba(200,169,110,.18)
--ivory:     #F5F0E8   /* texte principal */
--ash:       #8A847A   /* texte secondaire */
--ash-2:     #5A554F
--border:    #272320
--border-2:  #353028
```

**Typographie :**
- Titres : `Playfair Display` (serif, élégant)
- Corps : `DM Sans` (lisible, moderne)
- Labels/mono : `Space Mono` (technique, petite taille, letter-spacing élevé)

---

## Règles UI absolues

1. **Jamais de blanc pur** (`#fff`) ni de noir pur (`#000`) — utiliser les variables
2. **Jamais de design plat** — toujours `box-shadow`, `backdrop-filter: blur()`, gradients radiaux
3. **Grain de texture** obligatoire sur `body::before` (SVG fractalNoise, opacity .025)
4. **Logo** : filigrane en hero (opacity 3–6%), jamais opaque en fond
5. **Boutons primaires** : fond `--gold`, texte `--ink`, font `Space Mono`, `letter-spacing: .18em`, `text-transform: uppercase`
6. **Boutons secondaires** : transparent, border `--border-2`, hover → `--ash`
7. **Inputs** : fond `--ink-3`, border `--border-2`, focus → border `--gold-dim` + `box-shadow 0 0 0 3px var(--gold-glow)`
8. **Radius** : 0 partout (style carré/luxe), sauf cercles (pilules nav, dots)
9. **Animations** : toujours `cubic-bezier(.2,.8,.2,1)`, jamais `ease` générique

---

## Règles carte Leaflet

- Tiles : CartoDB Dark (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- Toujours appeler `lfMap.invalidateSize()` après 80ms quand le panel devient visible
- `fitBounds` uniquement à l'ouverture initiale (`resetView = true`), jamais sur les filtres
- Pins : `L.divIcon` avec classe `.lf-pin` + `.lf-pin-inner` (gold glow)

---

## Conventions de code

- Variables globales : `ARTISTS`, `lfMap`, `lfMarkers`, `filtered`, `curView`, `activeId`
- Fonctions clés : `applyFilters()`, `setView(v)`, `initMap()`, `updateMap(resetView)`, `selectArtist(id)`
- Bilingue FR/EN : IDs avec suffixe `-fr` / `-en`, toggles via `setLang('fr'|'en')`
- `data-netlify` : toujours inclure le form caché + `form-name` hidden input

---

## À ne JAMAIS faire

- Ajouter jQuery, Bootstrap, ou tout autre framework CSS/JS
- Utiliser `#000` ou `#fff` directement
- Appeler `fitBounds()` sur chaque filtre (lag UX)
- Oublier `invalidateSize()` sur la carte
- Mettre des images Unsplash dark (tatouages sur peau sombre = zone noire) — utiliser Picsum ou images vérifiées
- Push sur `main` sans tester sur `v2` d'abord (sauf urgence)
- Supprimer la texture grain `body::before`

---

## Données artistes (ARTISTS array)

Chaque artiste doit avoir :
```js
{ id, name, region, rKey, style, sKey, price, pKey, rating, verified,
  img, lat, lng, styles[], years, tattoos, instagram, bio, portfolio[] }
```

`pKey` : 1=`$`, 2=`$$`, 3=`$$$`  
`rKey` : slug minuscule de la région (ex: `montreal`, `laurentides`)  
`sKey` : slug minuscule du style principal

---

## Déploiement

```bash
# Depuis /tmp/ancre-push (clone du repo)
git add .
git commit -m "feat/fix: description"
git push origin v2        # branche de dev
git push origin v2:main   # → Netlify redéploie automatiquement
```

Token GitHub (scope repo) : disponible dans les notes de session si nécessaire.
