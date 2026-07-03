// Minimal stand-in for react-router-dom's <Link>.
//
// Havruta used to be a single-page app mounted under HashRouter, so every
// internal link went through react-router's client-side router. The Astro
// conversion makes each route a real, separately built page, so ordinary
// browser navigation, a plain <a href>, is exactly right: it is what lets the
// browser, the service worker, and the Cloudflare/GitHub Pages host resolve a
// fresh page per route. This component exists only so call sites written as
// `import { Link } from 'react-router-dom'` keep the same `<Link to="...">`
// call shape while the underlying element becomes a normal anchor.
//
// `to` is a root-relative path such as `/settings`, exactly as it was written
// for react-router. The browser resolves it against the current page, which
// already lives under the site's base path, so no base-prefixing happens here.
export default function Link({ to, children, ...rest }) {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
