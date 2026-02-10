export function LogoCloud() {
  const logos = [
    { name: "Vercel", icon: "▲" },
    { name: "GitHub", icon: "⬡" },
    { name: "Dropbox", icon: "📦" },
    { name: "Google", icon: "G" },
    { name: "Notion", icon: "N" },
    { name: "Slack", icon: "#" },
  ];

  return (
    <section className="py-12 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 text-lg font-bold"
              title={logo.name}
            >
              {logo.icon}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
