export function Testimonial() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Avatar */}
        <div className="mb-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
        </div>

        {/* Quote */}
        <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-6">
          "Simple has simplified my life in more ways than one. From managing my
          sites to{" "}
          <span className="text-indigo-500 italic">keeping track of tasks</span>
          , it's become my go-to tool for everything."
        </blockquote>

        {/* Attribution */}
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">Mary Sullivan</span>
          <span className="mx-2">/</span>
          <span className="text-indigo-500">CTO at Microsoft</span>
        </div>
      </div>
    </section>
  );
}
