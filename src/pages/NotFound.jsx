import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>That page does not exist in this app.</p>
      <p>
        <Link to="/">Go to today&rsquo;s daf</Link>
      </p>
    </section>
  );
}
