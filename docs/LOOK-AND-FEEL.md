# Look and feel

% voice-check: skip

The app uses Seth Oranburg's existing visual system, the same one his other sites and apps use (his personal site oranburg.law and his React learning companions). Match it. Do not invent a new palette, new fonts, or a new theme mechanism. The tokens, fonts, and dark-mode toggle below are copied from his shipping code (`assets/oranburg-theme.css` and the PTS learning companion). Treat this file as the source of truth for visual style.

## The theme mechanism

Dark mode is the default. The theme is held in a `data-theme` attribute on the `<html>` element, with values `dark` and `light`. CSS custom properties switch on that attribute. The user's choice is saved in local storage and applied before first paint so there is no flash.

Put this script in the document head, before the stylesheet, so the saved theme is set before anything renders:

```html
<script>(function(){var t=localStorage.getItem('havruta-theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()</script>
```

The toggle flips the attribute and saves it:

```js
function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('havruta-theme', next);
}
```

The toggle lives in the header as an icon button with `aria-label="Toggle dark/light mode"`. Seth uses a sun or moon line icon for it; lucide-react is already his icon library, so use its `Sun` and `Moon` icons.

## The color tokens

These are the exact values from his shipping theme. Define them as CSS custom properties.

Brand palette, constant across both modes:

```
--blue-deep:    #0A3255;
--blue-bright:  #2459A9;
--blue-light:   #6DACDE;
--red-deep:     #B21F2C;
--red-bright:   #E82F35;
--red-light:    #E96955;
--yellow:       #FFD65C;
--teal:         #B5E1E1;
```

Dark mode (the default), set on `:root, [data-theme="dark"]`:

```
--bg:           #000000;
--bg-secondary: #0A3255;
--bg-soft:      #0D3D68;
--text:         #FFFFFF;
--muted:        #9CA3AF;
--border:       #1E5080;
--accent:       #6DACDE;
--accent-2:     #B5E1E1;
--accent-red:   #B21F2C;
```

Light mode, set on `[data-theme="light"]`:

```
--bg:           #FFFFFF;
--bg-secondary: #F8F9FA;
--bg-soft:      #E9ECEF;
--text:         #000000;
--muted:        #555555;
--border:       #D0D8E4;
--accent:       #2459A9;
--accent-2:     #B5E1E1;
--accent-red:   #B21F2C;
```

The Jewish-studies accent in his book palette is the deep navy (#0A3255 and #1E3A5F). That navy is the natural primary for this app. Use the red (#B21F2C) sparingly for emphasis, the way his headings use a red underline rule.

## Typography

His fonts, loaded from Google Fonts:

```
--font-headline: 'Oswald', sans-serif;       /* weight 700, for h1 and h2 */
--font-body:     'Roboto', sans-serif;        /* body text and interface */
--font-accent:   'Crimson Text', serif;       /* the scholarly serif, for reading prose */
--font-mono:     'Roboto Mono', monospace;
```

Headings follow his pattern: h1 large in the accent color; h2 with a red underline rule (`border-bottom: 3px solid var(--accent-red)`); h3 in blue-light. Body line-height is generous, around 1.7.

For Hebrew and Aramaic, add Frank Ruhl Libre from Google Fonts (a clear Hebrew serif that reads well large), with Noto Serif Hebrew as a fallback. Define a Hebrew font variable:

```
--font-hebrew: 'Frank Ruhl Libre', 'Noto Serif Hebrew', serif;
```

Set type large. Seth reads on a phone and prefers large text. Default the body around 17px to 18px, the Hebrew larger still, and give the reader controls to grow both, with the Hebrew size adjustable on its own.

## Layout and components

His layout tokens:

```
--max-width:   1100px;
--radius-sm:   4px;
--radius-md:   8px;
--radius-pill: 999px;
--space-xs: 0.25rem; --space-sm: 0.5rem; --space-md: 1rem;
--space-lg: 1.5rem; --space-xl: 2rem; --space-2xl: 3rem; --space-3xl: 4rem;
```

The shell is a flex column: a header with the brand on the left and the theme toggle on the right, a main content area, and a footer. On a phone, primary navigation sits in a bottom tab bar reachable by thumb, because this is used one-handed.

Cards use `--bg-secondary` or `--bg-soft` for their fill, `--border` for a thin border, and `--radius-md`. Links use the accent color. Use lucide-react for icons. Keep the surface calm and text-first; this is a study tool with a beit-midrash feeling, not a busy dashboard.

## Stack to match his other apps

React 18, Vite, Tailwind CSS, react-router-dom with HashRouter, lucide-react for icons. This is the exact stack of his PTS learning companion. Build the design tokens as CSS custom properties in a global stylesheet and let Tailwind use them, so the look is centralized and easy to keep consistent.

## Footer and credit

Footer style follows his other apps: a small line with his name and the app, and quiet links to oranburg.law. Do not put any build-tool or AI fingerprint anywhere the reader can see.
