import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Check, Flame } from 'lucide-react';
import { getTodaysDaf } from '../lib/sefaria.js';
import { listSessions } from '../lib/sessions.js';
import {
  getShasStructure,
  readCachedStructure,
  totalDapim,
  studiedDafSet,
  currentStreak,
} from '../lib/shas.js';

// The whole-Shas progress map. The structure of the Talmud comes from Sefaria,
// never invented; see src/lib/shas.js. The map starts collapsed to the six
// orders so the whole of Shas is not a wall at once, expands into a tractate,
// and then into the dapim of that tractate. Studied dapim and today's daf are
// marked, with a count and a streak.
export default function Shas() {
  const navigate = useNavigate();

  const [structure, setStructure] = useState(() => readCachedStructure());
  const [loading, setLoading] = useState(() => !readCachedStructure());
  const [error, setError] = useState(null);
  const [today, setToday] = useState(null);

  // The reader's saved sessions, snapshot on mount.
  const sessions = useMemo(() => listSessions(), []);
  const studied = useMemo(() => studiedDafSet(sessions), [sessions]);
  const streak = useMemo(() => currentStreak(sessions), [sessions]);

  // Build the structure from Sefaria if it is not already cached, and ask
  // Sefaria for today's daf so the map can mark it.
  useEffect(() => {
    let alive = true;
    getShasStructure()
      .then((s) => {
        if (alive) setStructure(s);
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    getTodaysDaf()
      .then((d) => {
        if (alive) setToday(d);
      })
      .catch(() => {
        // The map still works without today's marker.
      });
    return () => {
      alive = false;
    };
  }, []);

  const studiedCount = studied.size;
  const total = structure ? totalDapim(structure) : 0;

  // The ref of today's daf, like "Chullin 44", and the tractate it sits in, so
  // that tractate's order opens by default.
  const todayRef = today ? today.ref : '';
  const todayTractate = todayRef ? todayRef.replace(/\s+\d+$/, '') : '';

  // No structure at all and still loading: a calm waiting message.
  if (!structure && loading) {
    return (
      <section>
        <h1>Shas</h1>
        <p style={{ color: 'var(--muted)' }}>
          Building the map of the Talmud from Sefaria. One moment.
        </p>
      </section>
    );
  }

  // No structure and a failed fetch with nothing cached: say so plainly. The map
  // shows only what Sefaria supplies, so there are no counts to invent.
  if (!structure) {
    return (
      <section>
        <h1>Shas</h1>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            The map of the Talmud could not be loaded right now. It is built from
            Sefaria, so there is nothing to show until the connection returns.
            Once it loads once, it is kept on this device and works offline.
          </p>
          {error && (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
          )}
          <button
            type="button"
            className="pill-button"
            onClick={() => {
              setLoading(true);
              setError(null);
              getShasStructure({ force: true })
                .then(setStructure)
                .catch((err) =>
                  setError(
                    err instanceof Error ? err.message : 'Something went wrong.'
                  )
                )
                .finally(() => setLoading(false));
            }}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Shas</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        The whole Babylonian Talmud, the six orders and their tractates. Tap an
        order to open it, then a tractate to see its dapim. Pages you have
        studied are marked, and today&rsquo;s daf is highlighted.
      </p>

      <Summary studiedCount={studiedCount} total={total} streak={streak} />

      <div style={{ marginTop: 'var(--space-lg)' }}>
        {structure.orders.map((order) => (
          <Order
            key={order.section}
            order={order}
            studied={studied}
            todayRef={todayRef}
            todayTractate={todayTractate}
            navigate={navigate}
            sessions={sessions}
            defaultOpen={order.tractates.some((t) => t.title === todayTractate)}
          />
        ))}
      </div>
    </section>
  );
}

// The count of studied dapim out of the whole Shas, and the current streak.
function Summary({ studiedCount, total, streak }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-lg)',
        alignItems: 'baseline',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            fontSize: '1.8rem',
            color: 'var(--accent)',
            lineHeight: 1.1,
          }}
        >
          {studiedCount}
          {total > 0 && (
            <span style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
              {' '}
              / {total}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          dapim studied
        </div>
      </div>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            fontSize: '1.8rem',
            color: streak > 0 ? 'var(--accent)' : 'var(--muted)',
            lineHeight: 1.1,
          }}
        >
          <Flame size={24} aria-hidden="true" />
          {streak}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {streak === 1 ? 'day in a row' : 'days in a row'}
        </div>
      </div>
    </div>
  );
}

// One order (seder): a tappable header that expands to its tractates.
function Order({
  order,
  studied,
  todayRef,
  todayTractate,
  navigate,
  sessions,
  defaultOpen,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  // Open the order that holds today's daf once it is known.
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  // How many of this order's dapim the reader has studied.
  const studiedInOrder = useMemo(() => {
    let count = 0;
    for (const t of order.tractates) {
      for (let d = 2; d <= t.lastDaf; d += 1) {
        if (studied.has(`${t.title} ${d}`)) count += 1;
      }
    }
    return count;
  }, [order, studied]);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-md)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-md)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open ? (
          <ChevronDown size={20} aria-hidden="true" />
        ) : (
          <ChevronRight size={20} aria-hidden="true" />
        )}
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            fontSize: '1.15rem',
          }}
        >
          {order.en}
        </span>
        <span className="hebrew" style={{ color: 'var(--accent-2)', fontSize: '1.2rem' }}>
          {order.he}
        </span>
        {studiedInOrder > 0 && (
          <span
            style={{
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {studiedInOrder}
          </span>
        )}
      </button>

      {open && (
        <div style={{ padding: '0 var(--space-md) var(--space-md)' }}>
          {order.tractates.map((tractate) => (
            <Tractate
              key={tractate.title}
              tractate={tractate}
              studied={studied}
              todayRef={todayRef}
              navigate={navigate}
              sessions={sessions}
              defaultOpen={tractate.title === todayTractate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// One tractate: a tappable row that expands to a grid of its dapim.
function Tractate({
  tractate,
  studied,
  todayRef,
  navigate,
  sessions,
  defaultOpen,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  // Dapim run from 2 through the last daf. Count the studied ones for the row.
  const dapim = useMemo(() => {
    const out = [];
    for (let d = 2; d <= tractate.lastDaf; d += 1) out.push(d);
    return out;
  }, [tractate.lastDaf]);

  const studiedHere = useMemo(
    () => dapim.filter((d) => studied.has(`${tractate.title} ${d}`)).length,
    [dapim, studied, tractate.title]
  );

  const holdsToday = todayRef && todayRef.replace(/\s+\d+$/, '') === tractate.title;

  return (
    <div style={{ marginTop: 'var(--space-sm)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--bg-soft)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open ? (
          <ChevronDown size={16} aria-hidden="true" />
        ) : (
          <ChevronRight size={16} aria-hidden="true" />
        )}
        <span style={{ flex: 1, fontWeight: 500 }}>{tractate.title}</span>
        {tractate.heTitle && (
          <span className="hebrew" style={{ color: 'var(--accent-2)' }}>
            {tractate.heTitle}
          </span>
        )}
        {holdsToday && (
          <span
            style={{
              color: 'var(--yellow)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-body)',
            }}
          >
            today
          </span>
        )}
        <span
          style={{
            color: 'var(--muted)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {studiedHere}/{dapim.length}
        </span>
      </button>

      {open && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm) 0 var(--space-md)',
          }}
        >
          {dapim.map((d) => {
            const ref = `${tractate.title} ${d}`;
            const isStudied = studied.has(ref);
            const isToday = todayRef === ref;
            return (
              <DafCell
                key={d}
                daf={d}
                ref_={ref}
                isStudied={isStudied}
                isToday={isToday}
                navigate={navigate}
                sessions={sessions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// One daf in the grid. Tapping today's daf opens Today. Tapping a studied daf
// reopens its saved session in the Archive. Tapping any other daf opens Today
// loaded at that daf for reading.
function DafCell({ daf, ref_, isStudied, isToday, navigate, sessions }) {
  function go() {
    if (isToday) {
      navigate('/');
      return;
    }
    if (isStudied) {
      // Reopen the most recent saved session for this daf.
      const match = sessions.find((s) => (s.dafRef || '').trim() === ref_);
      if (match) {
        navigate(`/archive?session=${encodeURIComponent(match.id)}`);
        return;
      }
    }
    navigate(`/?daf=${encodeURIComponent(ref_)}`);
  }

  let background = 'var(--bg-soft)';
  let borderColor = 'var(--border)';
  let color = 'var(--text)';
  if (isStudied) {
    background = 'var(--accent)';
    borderColor = 'var(--accent)';
    color = '#000000';
  }
  if (isToday) {
    background = 'transparent';
    borderColor = 'var(--yellow)';
    color = 'var(--yellow)';
  }

  let label = `Daf ${daf} of this tractate, ${ref_}`;
  if (isToday) label = `Today's daf, ${ref_}`;
  else if (isStudied) label = `Studied daf, ${ref_}, open the saved session`;

  return (
    <button
      type="button"
      onClick={go}
      aria-label={label}
      title={ref_}
      style={{
        position: 'relative',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-xs)',
        background,
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        color,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.95rem',
        cursor: 'pointer',
      }}
    >
      {daf}
      {isStudied && !isToday && (
        <Check
          size={12}
          aria-hidden="true"
          style={{ position: 'absolute', top: 2, right: 2 }}
        />
      )}
    </button>
  );
}
