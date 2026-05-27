import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';

interface TocItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ManualSubpageLayoutProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  color: string;
  sections?: TocItem[];
  children: React.ReactNode;
}

export function ManualSubpageLayout({
  icon: Icon,
  title,
  subtitle,
  color,
  sections = [],
  children,
}: ManualSubpageLayoutProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll to top on mount — the scroll container is the layout's <main> element, not window
  useEffect(() => {
    const mainEl = document.querySelector('main.main-content-with-tabs');
    if (mainEl) {
      mainEl.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Intersection observer to highlight active TOC item
  useEffect(() => {
    if (!sections.length) return;
    const callback = (entries: IntersectionObserverEntry[]) => {
      // Find the topmost visible section
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        // Pick the one closest to top
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveId(visible[0]!.target.id);
      }
    };
    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0.1,
    });
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#eae7e2', fontFamily: 'var(--theme-font-body)' }}>
      <div className="max-w-7xl mx-auto flex">

        {/* ── Sidebar TOC (desktop) ── */}
        {sections.length > 0 && (
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-0 h-screen overflow-y-auto py-8 pl-6 pr-4">
            <Link
              to="/UserManual"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium mb-6 hover:underline"
              style={{ color: '#a8a29e' }}
            >
              <ArrowLeft className="w-3 h-3" />
              User Manual
            </Link>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-sm font-bold" style={{ color: '#1c1917' }}>{title}</span>
            </div>

            <nav className="space-y-0.5">
              {sections.map(s => {
                const isActive = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2"
                    style={{
                      background: isActive ? color + '10' : 'transparent',
                      color: isActive ? color : '#78716c',
                      fontWeight: isActive ? 600 : 400,
                      borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                    }}
                  >
                    {s.title}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-4 md:px-8 lg:px-12 py-6 lg:py-10">
          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <Link
              to="/UserManual"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium mb-4 hover:underline"
              style={{ color: '#a8a29e' }}
            >
              <ArrowLeft className="w-3 h-3" />
              User Manual
            </Link>
          </div>

          {/* Page header */}
          <header className="mb-10 pb-6 px-6 pt-6 rounded-xl" style={{ background: 'white', border: '1px solid #d6d3d1' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1c1917', fontFamily: 'var(--theme-font-brand-title)' }}>{title}</h1>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>{subtitle}</p>}
              </div>
            </div>
          </header>

          {/* Mobile TOC */}
          {sections.length > 0 && (
            <div className="lg:hidden mb-8">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg w-full"
                style={{ background: 'white', border: '1px solid #e7e5e4', color: '#57534e' }}
              >
                {tocOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                On this page
              </button>
              {tocOpen && (
                <div className="mt-2 rounded-lg p-3 space-y-1" style={{ background: 'white', border: '1px solid #e7e5e4' }}>
                  {sections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className="block w-full text-left px-3 py-1.5 rounded text-xs"
                      style={{ color: activeId === s.id ? color : '#78716c', fontWeight: activeId === s.id ? 600 : 400 }}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-16">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 text-center" style={{ borderTop: '1px solid #e7e5e4' }}>
            <Link
              to="/UserManual"
              className="text-xs font-medium hover:underline"
              style={{ color: '#a8a29e' }}
            >
              ← Back to User Manual
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
