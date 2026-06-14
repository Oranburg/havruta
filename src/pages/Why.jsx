import ScrollProgress from '../components/ScrollProgress.jsx';
import Mermaid from '../components/Mermaid.jsx';
import LearnImage from '../components/LearnImage.jsx';
import WhyContent from './why-content.mdx';

// Why this app exists. The reader-facing prose lives in why-content.mdx; this
// wrapper supplies the components that the MDX calls (the Mermaid diagram and
// the artwork slots) and frames the page like the others, with the scroll
// progress bar at the very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { Mermaid, LearnImage };

export default function Why() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <WhyContent components={mdxComponents} />
      </div>
    </section>
  );
}
