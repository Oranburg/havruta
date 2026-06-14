import ScrollProgress from '../components/ScrollProgress.jsx';
import Mermaid from '../components/Mermaid.jsx';
import LearnImage from '../components/LearnImage.jsx';
import StartContent from './start-content.mdx';

// On-ramp for a first-time user. The reader-facing prose lives in
// start-content.mdx; this wrapper supplies the components the MDX calls
// (the Mermaid flowchart and the artwork slots) and frames the page like the
// others, with the scroll progress bar at the very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { Mermaid, LearnImage };

export default function Start() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <StartContent components={mdxComponents} />
      </div>
    </section>
  );
}
