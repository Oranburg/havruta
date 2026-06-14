import ScrollProgress from '../components/ScrollProgress.jsx';
import Mermaid from '../components/Mermaid.jsx';
import TermsContent from './terms-content.mdx';

// Glossary of Hebrew and Aramaic terms a newcomer meets on the daf. The
// reader-facing prose lives in terms-content.mdx; this wrapper supplies the
// components the MDX calls and frames the page like the others, with the scroll
// progress bar at the very top.
//
// The MDX is compiled with the React automatic runtime, so passing the custom
// components as props is enough; no MDXProvider is needed.
const mdxComponents = { Mermaid };

export default function Terms() {
  return (
    <section>
      <ScrollProgress />
      <div className="learn-prose">
        <TermsContent components={mdxComponents} />
      </div>
    </section>
  );
}
