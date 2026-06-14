import ScrollProgress from '../components/ScrollProgress.jsx';
import LearnImage from '../components/LearnImage.jsx';
import FindContent from './find-content.mdx';

// Where to take the next step off the page: study partners, shiurim, minyanim,
// and the daily daf elsewhere. This is the bridge made concrete. The
// reader-facing prose lives in find-content.mdx; this wrapper supplies the
// artwork slot the MDX calls and frames the page like the others, with the
// scroll progress bar at the very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { LearnImage };

export default function Find() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <FindContent components={mdxComponents} />
      </div>
    </section>
  );
}
