'use client';

export function MeSidebarSkeleton() {
  return (
    <aside className="sticky top-[96px] self-start animate-pulse">
      <div className="pb-6 border-b border-rule mb-6">
        <div className="w-16 h-16 rounded-full bg-tile mb-[14px]" />
        <div className="h-4 w-12 bg-tile mb-[10px]" />
        <div className="h-5 w-36 bg-tile mb-2" />
        <div className="h-3 w-24 bg-tile" />
      </div>
      <nav className="flex flex-col">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="py-3 px-4 -mx-4">
            <div className="h-3 bg-tile w-3/4" />
          </div>
        ))}
      </nav>
      <div className="mt-6 pt-6 border-t border-rule">
        <div className="h-9 bg-tile w-full" />
      </div>
    </aside>
  );
}

export function MeContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-32 bg-tile mb-4" />
      <div className="h-14 w-1/2 bg-tile mb-12" />

      <div className="grid grid-cols-4 gap-0 border border-rule">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={i > 0 ? 'p-6 border-l border-rule' : 'p-6'}
          >
            <div className="h-8 bg-tile mb-3 w-20" />
            <div className="h-3 bg-tile w-16" />
          </div>
        ))}
      </div>

      <div className="mt-14">
        <div className="h-3 bg-tile w-32 mb-5" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 border border-rule" />
          ))}
        </div>
      </div>

      <div className="mt-14">
        <div className="h-3 bg-tile w-40 mb-5" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-tile" />
          ))}
        </div>
      </div>
    </div>
  );
}
