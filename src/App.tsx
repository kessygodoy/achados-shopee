import React, { useState, useEffect } from "react";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "./data";
import { Product, AppSettings } from "./types";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import ProductDetailView from "./components/ProductDetailView";
import AdminPanel from "./components/AdminPanel";
import { 
  ShoppingBag, ShieldCheck, HelpCircle, Flame, Star, 
  ArrowRight, Sparkles, MessageCircle, Info 
} from "lucide-react";

export default function App() {
  // ROUTING STATE: "home", "product", "admin"
  const [view, setView] = useState<string>("");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // APP DATA STATE
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    blogName: "Achados da Shopee",
    blogSubtitle: "🔥 Os melhores produtos e cupons garimpados diretamente para economizar!",
    promotionBanner: "🚚 GANHE FRETE GRÁTIS NA SHOPEE HOJE! • Ative seus cupons exclusivos abaixo",
    adminPasswordHash: "doisseis97"
  });

  // FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Load state on startup
  useEffect(() => {
    // 1. Load settings
    const storedSettings = localStorage.getItem("shopee_affiliate_settings");
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Error loading settings", e);
      }
    }

    // 2. Load products
    const storedProducts = localStorage.getItem("shopee_affiliate_products");
    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        } else {
          setProducts(INITIAL_PRODUCTS);
          localStorage.setItem("shopee_affiliate_products", JSON.stringify(INITIAL_PRODUCTS));
        }
      } catch (e) {
        setProducts(INITIAL_PRODUCTS);
      }
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem("shopee_affiliate_products", JSON.stringify(INITIAL_PRODUCTS));
    }

    // 3. Simple Hash router listener
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/product/")) {
        const id = hash.substring(10);
        setActiveProductId(id);
        setView("product");
      } else if (hash === "#/admin") {
        setView("admin");
        setActiveProductId(null);
      } else {
        setView("");
        setActiveProductId(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run once initially on load

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync products back to localStorage
  const saveProductsToStorage = (updatedList: Product[]) => {
    setProducts(updatedList);
    localStorage.setItem("shopee_affiliate_products", JSON.stringify(updatedList));
  };

  // Sync settings back to localStorage
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("shopee_affiliate_settings", JSON.stringify(newSettings));
  };

  // Nav helper
  const navigateTo = (destination: string) => {
    if (destination === "") {
      window.location.hash = "/";
    } else if (destination === "admin") {
      window.location.hash = "/admin";
    } else if (destination.startsWith("product-")) {
      const id = destination.substring(8);
      window.location.hash = `#/product/${id}`;
    }
  };

  // Admin event: Save edit or click count addition
  const handleSaveProduct = (updatedProd: Product) => {
    let list = [...products];
    const index = list.findIndex(p => p.id === updatedProd.id);
    if (index >= 0) {
      list[index] = updatedProd;
    } else {
      list.unshift(updatedProd); // push to starts
    }
    saveProductsToStorage(list);
  };

  // Admin event: Delete product
  const handleDeleteProduct = (id: string) => {
    if (confirm("Deseja realmente remover este produto da vitrine definitivamente?")) {
      const list = products.filter(p => p.id !== id);
      saveProductsToStorage(list);
    }
  };

  // Admin event: Restore backup
  const handleImportProducts = (imported: Product[]) => {
    saveProductsToStorage(imported);
  };

  // Track & Increment clicks
  const handleTrackClick = (product: Product) => {
    const list = [...products];
    const index = list.findIndex(p => p.id === product.id);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        clicks: (list[index].clicks || 0) + 1
      };
      saveProductsToStorage(list);
    }
  };

  // Perform direct purchase redirect (euthanize/track clicks seamlessly)
  const handleDirectPurchase = (product: Product, event: any) => {
    event.stopPropagation();
    handleTrackClick(product);
    window.open(product.link, "_blank", "noopener,noreferrer");
  };

  // Compute Categories from products dynamically to support new categories
  const categoriesList: string[] = [
    "Todos",
    ...Array.from(new Set(products.map((p) => p.category))).filter((c): c is string => !!c),
  ];

  // Filtering products for UI
  const filteredProducts = products.filter((prod) => {
    if (!prod.isAvailable) return false;
    
    const matchesCategory = selectedCategory === "Todos" || prod.category === selectedCategory;
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Featured header slider products list
  const featuredProducts = products.filter(p => p.isFeatured && p.isAvailable);

  return (
    <div className="min-h-screen bg-[#FFF5F2] text-slate-800 flex flex-col font-sans transition-all selection:bg-orange-200">
      {/* Top Banner Navigation */}
      <Header
        blogName={settings.blogName}
        blogSubtitle={settings.blogSubtitle}
        promotionBanner={settings.promotionBanner}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categoriesList}
        currentView={view}
        navigateTo={navigateTo}
      />

      {/* Main Container Views */}
      <main className="flex-grow">
        {view === "product" && activeProductId ? (
          /* PRODUCT INDIVIDUAL DETAIL PAGE */
          (() => {
            const product = products.find(p => p.id === activeProductId);
            if (!product) {
              return (
                <div className="max-w-md mx-auto text-center py-20 p-4">
                  <p className="text-sm font-semibold text-slate-500 mb-4">Ups! Esse produto não foi localizado ou já encerrou a oferta.</p>
                  <button onClick={() => navigateTo("")} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs">
                    Voltar aos achados
                  </button>
                </div>
              );
            }
            return (
              <ProductDetailView
                product={product}
                allProducts={products}
                onBack={() => navigateTo("")}
                onNavigateToProduct={(id) => navigateTo(`product-${id}`)}
                onLinkOpened={handleTrackClick}
              />
            );
          })()
        ) : view === "admin" ? (
          /* ADMIN LINK BOARD */
          <AdminPanel
            products={products}
            categories={categoriesList}
            settings={settings}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateSettings={handleUpdateSettings}
            onImportProducts={handleImportProducts}
          />
        ) : (
          /* GALLERY FEED HOMEPAGE */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Show Featured Hero Banner section ONLY when no search constraint filters are active */}
            {searchQuery === "" && selectedCategory === "Todos" && featuredProducts.length > 0 && (
              <div id="featured-hero-display" className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500 fill-current" />
                  <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-1">
                    Super Destaques Shopee <span className="text-xs text-orange-600 bg-orange-50 font-bold px-2 py-0.5 rounded">Mais Clicados</span>
                  </h2>
                </div>

                {/* Grid layout for featured content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredProducts.slice(0, 2).map((feat) => {
                    const discount = Math.round(((feat.originalPrice - feat.price) / feat.originalPrice) * 100);
                    return (
                      <div
                        key={feat.id}
                        id={`hero-${feat.id}`}
                        onClick={() => navigateTo(`product-${feat.id}`)}
                        className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-5 sm:p-7 text-white flex flex-col sm:flex-row gap-5 items-stretch cursor-pointer hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden group shadow-lg shadow-orange-500/10"
                      >
                        {/* Abstract glow circle in bg */}
                        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-110 transition-transform"></div>
                        
                        {/* Img */}
                        <div className="w-full sm:w-2/5 aspect-square rounded-2xl overflow-hidden shrink-0 bg-white border border-white/20 relative shadow-sm">
                          <img
                            src={feat.image}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] py-1 px-1.5 rounded-lg uppercase tracking-wide shadow-sm">
                              -{discount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Title and Pricing info */}
                        <div className="flex flex-col justify-between flex-grow">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md self-start">
                              {feat.category}
                            </span>
                            <h3 className="text-base font-extrabold font-sans mt-2.5 line-clamp-2 leading-snug">
                              {feat.title}
                            </h3>
                            <p className="text-white/80 text-[11px] line-clamp-2 mt-1 font-medium">
                              {feat.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-white/70 line-through">De R$ {feat.originalPrice.toFixed(2)}</span>
                              <div className="text-xl font-black font-mono">R$ {feat.price.toFixed(2)}</div>
                            </div>
                            <span className="bg-white text-orange-600 font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm shrink-0">
                              Ver Detalhes
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vitrine Results Grid */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 fill-current" />
                  <span>Todos os Cupons & Achados</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Resultados filtrados ({filteredProducts.length} achados hoje)
                </p>
              </div>

              {selectedCategory !== "Todos" && (
                <button
                  onClick={() => setSelectedCategory("Todos")}
                  className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 py-1 px-2.5 rounded-lg transition-all"
                >
                  Limpar Filtro x
                </button>
              )}
            </div>

            {/* Grid of Cards */}
            {filteredProducts.length > 0 ? (
              <div id="products-catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onClick={() => navigateTo(`product-${prod.id}`)}
                    onDirectPurchase={handleDirectPurchase}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-800 font-bold mb-1.5">Nenhum achado localizado</h3>
                <p className="text-slate-450 text-xs font-medium max-w-sm mx-auto">
                  Tente alterar sua palavra-chave na busca ou defina outra categoria de produtos!
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* COMPLIANCE & AUTHORIZED SHOPEE DISCLOSURE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 mt-20 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-white font-black text-base tracking-tight mb-3 flex items-center gap-1">
              🛍️ {settings.blogName}
            </h4>
            <p className="text-xs leading-relaxed max-w-sm mb-4">
              {settings.blogSubtitle}
            </p>
            <div className="flex items-center gap-1 text-[11px] bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 max-w-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Participante Oficial do Programa de Afiliados Shopee</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">🏷️ Categorias Populares</h4>
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.filter(c => c !== "Todos").slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    navigateTo("");
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2.5 rounded-md transition-all cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">ℹ️ Transparência de Afiliado</h4>
            <p className="text-[11px] leading-relaxed mb-4">
              Ao clicar nos links mostrados nesta página, você é redirecionado com segurança para a loja oficial do anunciante. Nós recebemos uma comissão da Shopee sobre cada venda realizada através de nossa vitrine. Isso não altera o preço dos produtos para você, mas ajuda a manter nossa curadoria de cupons ativa!
            </p>
            <div className="flex gap-2">
              <span className="text-[10px] bg-slate-800 text-slate-300 font-extrabold px-2 py-0.5 rounded">Garantia Shopee</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-extrabold px-2 py-0.5 rounded">Links Seguros</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} {settings.blogName}. Curadoria especializada de promoções Shopee.</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigateTo("admin")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Acesso Restrito
            </button>
            <span>•</span>
            <span className="text-slate-600">Vitrine 100% Responsiva (Mobile e Desktop)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
