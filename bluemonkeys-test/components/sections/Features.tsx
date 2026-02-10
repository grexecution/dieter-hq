export function Features() {
  return (
    <section className="py-16 md:py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple helps your teams work more
            <br />
            efficiently together
          </h2>
        </div>

        {/* Globe Visualization Placeholder */}
        <div className="relative max-w-3xl mx-auto">
          {/* Globe */}
          <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-b from-slate-700 to-slate-800 opacity-50" />

          {/* Floating Cards */}
          <div className="absolute top-8 left-0 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500" />
              <div>
                <p className="text-white text-sm font-medium">mark-s/website-tweaks</p>
                <p className="text-slate-400 text-xs">Amsterdam, Netherlands</p>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-0 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500" />
              <div>
                <p className="text-white text-sm font-medium">mary-w/saas-website</p>
                <p className="text-slate-400 text-xs">Milan, Italy</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500" />
              <div>
                <p className="text-white text-sm font-medium">mary-w/new-redesign</p>
                <p className="text-slate-400 text-xs">New York, NYC</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-16 right-4 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500" />
              <div>
                <p className="text-white text-sm font-medium">eric-w/freeform-canvas</p>
                <p className="text-slate-400 text-xs">London, UK</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
