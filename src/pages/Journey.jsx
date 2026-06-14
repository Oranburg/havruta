import ScrollProgress from '../components/ScrollProgress.jsx';
import Mermaid from '../components/Mermaid.jsx';
import LearnImage from '../components/LearnImage.jsx';
import JourneyContent from './journey-content.mdx';

// What the daf yomi journey is: one page a day, seven and a half years, six
// orders, a Siyum HaShas, and then again. The reader-facing prose lives in
// journey-content.mdx; this wrapper supplies the components the MDX calls
// and frames the page like the others, with the scroll progress bar at the
// very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { Mermaid, LearnImage };

export default function Journey() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <JourneyContent components={mdxComponents} />
      </div>
    </section>
  );
}
