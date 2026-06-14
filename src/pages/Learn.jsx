import ScrollProgress from '../components/ScrollProgress.jsx';
import Mermaid from '../components/Mermaid.jsx';
import LearnImage from '../components/LearnImage.jsx';
import LearnContent from './learn-content.mdx';

// How the daf is learned. The reader-facing prose lives in learn-content.mdx;
// this wrapper supplies the components that the MDX calls (the Mermaid diagrams
// and the artwork slots) and frames the page like the others, with the scroll
// progress bar at the very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { Mermaid, LearnImage };

export default function Learn() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <LearnContent components={mdxComponents} />
      </div>
    </section>
  );
}
