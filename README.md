# Blood Bowl Card Creator

A client-side web app for creating custom, print-ready Blood Bowl tabletop game cards. No backend required — everything runs in the browser using HTML5 Canvas.

## Card Types

- **Player Cards** (`index.html`) — Player cards with stats (MA, ST, AG, PA, AV), skill categories, custom images, and team logos
- **Star Players Cards** (`star.html`) — Star Players cards with stats, skills, plays for, special rules, custom images
- **Special Cards** (`special.html`) — Custom rules and ability cards
- **Cards Back** (`cardBack.html`) — Custom cards back
- **Playbook Cards** (`playbook.html`) — Team strategy and play diagrams with searchable pre-loaded plays
- **Print Sheets** (`print.html`) — Select Star Players and arrange them on A4 sheets, nine cards per page

## Running Locally

The project uses [Jekyll](https://jekyllrb.com/) for template includes. To run with full functionality:

```bash
jekyll serve
```

Then open http://localhost:4000.

## Features

- Upload custom player images with positioning/scaling controls
- 570+ team logos included
- 66 ready presets for all official Season 3 Star Players(included Mega-Stars)
- Different backgrounds
- Icons for Special Cards 
- Cards designed closely to Season 3
- PNG export for printing (822×1122px cards)
- Save/load card designs as JSON
- A4 print sheets with optional bleed, cut lines, quantities, and duplex card backs
- Auto-save to browser localStorage
- Localization on English, German, France, Spanish
- Dark and Light themes 

## Tech Stack

Vanilla JavaScript, jQuery, Bootstrap 5, HTML5 Canvas, Jekyll
