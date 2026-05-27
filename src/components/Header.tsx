import { useState } from "react";
import { Search, SlidersHorizontal, Settings, ShoppingBag, Grid, BookOpen } from "lucide-react";

interface HeaderProps {
  blogName: string;
  blogSubtitle: string;
  promotionBanner: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  currentView: string;
  navigateTo: (view: string) => void;
}

export default function Header({
  blogName,
  blogSubtitle,
  promotionBanner,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  currentView,
  navigateTo,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm transition-all duration-300">
      {/* Promotion bar */}
      {promotionBanner && (
        <div id="promotional-banner" className="bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 text-white text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 animate-pulse">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{promotionBanner}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <div 
            id="brand-logo" 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigateTo("")}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1 font-sans">
                {blogName} <span className="text-orange-500 text-lg">🛍️</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {blogSubtitle}
              </p>
            </div>
          </div>

          {/* Search bar - only shown in gallery list view */}
          {(currentView === "" || currentView === "home") && (
            <div id="search-input-container" className="hidden md:flex items-center flex-1 max-w-md mx-6 relative shadow-sm rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar achados fáceis..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-400 focus:bg-white focus:outline-none rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-700 transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-xs text-rose-500 hover:text-rose-700 font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              id="nav-catalogo"
              onClick={() => navigateTo("")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentView === "" || currentView === "home"
                  ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Vitrine</span>
            </button>

            <button
              id="nav-admin"
              onClick={() => navigateTo("admin")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentView === "admin"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>
          </div>
        </div>

        {/* Mobile Search - Visible under Header on mobile devices */}
        {(currentView === "" || currentView === "home") && (
          <div id="mobile-search-bar" className="md:hidden pb-3.5 pt-0.5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 pb-3">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar achados..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-400 focus:bg-white focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-slate-700 transition-all font-medium"
            />
          </div>
        )}

        {/* Categories Bar - Sub-header */}
        {(currentView === "" || currentView === "home") && (
          <div id="categories-scroller" className="border-t border-slate-100 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1.5 text-slate-400 mr-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Filtro:</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`btn-category-${cat.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    (cat === "Todos" && selectedCategory === "Todos") || selectedCategory === cat
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/15 scale-105"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
