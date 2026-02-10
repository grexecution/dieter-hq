export function Hero() {
  return (
    <section className="pt-16 pb-12 md:pt-24 md:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          {/* Avatar Group */}
          <div className="flex justify-center -space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white"
              />
            ))}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            The website builder you're
            <br />
            looking for
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Simple is a modern website builder powered by AI that changes how
            companies create user interfaces together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <a
              href="#"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-full hover:bg-indigo-600 transition-colors"
            >
              Start Free Trial →
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:border-gray-400 transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Terminal Mockup */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-auto text-xs text-gray-400">cruip.com</span>
              </div>
              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm">
                <p className="text-gray-400">
                  <span className="text-green-400">npm</span>{" "}
                  <span className="text-white">login</span>{" "}
                  <span className="text-gray-500">
                    --registry=https://npm.pkg.github.com
                  </span>
                </p>
                <p className="text-gray-500 mt-1">--scope=@phanatic</p>
                <div className="mt-4 h-32" />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {["Startups", "Web Apps", "eCommerce", "Enterprise"].map(
              (tab, i) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    i === 0
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
