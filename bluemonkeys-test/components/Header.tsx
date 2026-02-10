export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Customers
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </a>
            <a href="#" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
              Register
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
