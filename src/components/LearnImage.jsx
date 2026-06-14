import { useState } from 'react';

// An artwork slot for the How the daf is learned page. The images are generated
// separately and may not exist yet, so a missing file hides the whole figure
// rather than showing a broken-image icon. Pass `hideOnError={false}` to keep a
// quiet captioned placeholder instead.
export default function LearnImage({
  src,
  alt,
  caption,
  hideOnError = true,
}) {
  const [errored, setErrored] = useState(false);

  if (errored && hideOnError) return null;

  // The page is served under the /havruta/ base, so build the URL from
  // import.meta.env.BASE_URL rather than a leading slash, which would resolve to
  // the site root on GitHub Pages.
  const base = import.meta.env.BASE_URL || '/';
  const url = `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;

  if (errored) {
    return (
      <figure className="learn-image learn-image--placeholder">
        <div className="learn-image__placeholder" aria-hidden="true" />
        <figcaption className="learn-image__caption">{alt}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="learn-image">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="learn-image__img"
        onError={() => setErrored(true)}
      />
      {caption && (
        <figcaption className="learn-image__caption">{caption}</figcaption>
      )}
    </figure>
  );
}
