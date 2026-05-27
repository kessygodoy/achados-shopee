import React, { useState } from "react";
import { Product, AppSettings } from "../types";
import { 
  Key, Shield, Settings, TrendingUp, BarChart3, Plus, 
  Trash2, Edit, Save, LogOut, ChevronRight, CheckCircle2, 
  HelpCircle, Download, Upload, Copy, ShoppingBag, Eye 
} from "lucide-react";

interface AdminPanelProps {
  products: Product[];
  categories: string[];
  settings: AppSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onImportProducts: (imported: Product[]) => void;
}

export default function AdminPanel({
  products,
  categories,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onUpdateSettings,
  onImportProducts,
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      // Check localStorage first
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("shopee_admin_auth");
        if (stored === "true") return true;
        
        // Check cookie as requested in prompt
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const parts = cookies[i].split("=");
          const name = parts[0].trim();
          const value = parts[1] ? parts[1].trim() : "";
          if (name === "shopee_admin_auth" && value === "true") {
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("Storage or cookie check failed", e);
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // AI Auto-Generator States
  const [aiUrl, setAiUrl] = useState("");
  const [aiRawText, setAiRawText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState("");

  const handleGenerateWithAI = async () => {
    if (!aiUrl.trim() && !aiRawText.trim()) {
      setGenerateError("Por favor, forneça o link do produto ou cole os detalhes de texto.");
      return;
    }
    setIsGenerating(true);
    setGenerateError("");
    setGenerateSuccess("");
    try {
      const res = await fetch("/api/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: aiUrl.trim(),
          rawText: aiRawText.trim(),
          categories: categories.filter(c => c !== "Todos")
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Houve um erro de comunicação com o servidor.");
      }
      const data = await res.json();
      setTitle(data.title || "");
      setDescription(data.description || "");
      setPrice(data.price ? data.price.toString() : "");
      setOriginalPrice(data.originalPrice ? data.originalPrice.toString() : "");
      if (data.link) setLink(data.link);
      if (data.image) setImage(data.image);
      if (data.category) setCategory(data.category);
      if (data.discountCode) setDiscountCode(data.discountCode);
      setGenerateSuccess("Anúncio gerado com sucesso por IA usando o Gemini! Revise os detalhes preenchidos abaixo.");
      // Auto preencha o link original nas inputs correspondentes se estivesse em branco
      if (!link) {
        setLink(aiUrl.trim());
      }
    } catch (err: any) {
      setGenerateError(err.message || "Falha ao gerar anúncio automático.");
    } finally {
      setIsGenerating(false);
    }
  };

  // App Settings Inputs
  const [blogName, setBlogName] = useState(settings.blogName);
  const [blogSubtitle, setBlogSubtitle] = useState(settings.blogSubtitle);
  const [promotionBanner, setPromotionBanner] = useState(settings.promotionBanner);
  const [newPassword, setNewPassword] = useState("");
  const [settingsSavedMsg, setSettingsSavedMsg] = useState("");

  // Handling simple authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "doisseis97" || passwordInput === settings.adminPasswordHash) {
      setIsAuthenticated(true);
      setAuthError("");
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("shopee_admin_auth", "true");
          // Calculate expiration date (e.g., 365 days)
          const date = new Date();
          date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
          document.cookie = `shopee_admin_auth=true; expires=${date.toUTCString()}; path=/; SameSite=Lax;`;
        }
      } catch (err) {
        console.warn("Could not write session storage or cookies", err);
      }
    } else {
      setAuthError("Código de acesso incorreto!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput("");
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("shopee_admin_auth");
        document.cookie = "shopee_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
      }
    } catch (err) {
      console.warn("Could not clear session storage or cookies", err);
    }
  };

  // Open Form to ADD new
  const handleAddNew = () => {
    setCurrentId(null);
    setTitle("");
    setDescription("");
    setImage("");
    setPrice("");
    setOriginalPrice("");
    setLink("");
    setCategory(categories[1] || "Tecnologia");
    setNewCategory("");
    setDiscountCode("");
    setIsFeatured(false);
    setIsAvailable(true);
    setIsEditing(true);
  };

  // Open Form to EDIT existing
  const handleEdit = (prod: Product) => {
    setCurrentId(prod.id);
    setTitle(prod.title);
    setDescription(prod.description);
    setImage(prod.image);
    setPrice(prod.price.toString());
    setOriginalPrice(prod.originalPrice.toString());
    setLink(prod.link);
    setCategory(prod.category);
    setNewCategory("");
    setDiscountCode(prod.discountCode || "");
    setIsFeatured(prod.isFeatured);
    setIsAvailable(prod.isAvailable);
    setIsEditing(true);
  };

  // Save changes
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = newCategory.trim() ? newCategory.trim() : category;

    const parsedPrice = parseFloat(price) || 0;
    const parsedOriginalPrice = parseFloat(originalPrice) || parsedPrice;

    const updatedProduct: Product = {
      id: currentId || `prod-${Date.now()}`,
      title,
      description,
      image: image.trim() || "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop",
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      link: link.trim() || "https://shopee.com.br",
      category: finalCategory,
      clicks: currentId ? (products.find(p => p.id === currentId)?.clicks || 0) : 0,
      rating: currentId ? (products.find(p => p.id === currentId)?.rating || 4.8) : 4.8,
      reviewsCount: currentId ? (products.find(p => p.id === currentId)?.reviewsCount || 10) : 10,
      isFeatured,
      isAvailable,
      discountCode: discountCode.trim() || undefined,
      dateAdded: currentId ? (products.find(p => p.id === currentId)?.dateAdded || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };

    onSaveProduct(updatedProduct);
    setIsEditing(false);
  };

  // Submit App Settings Changes
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      blogName,
      blogSubtitle,
      promotionBanner,
      adminPasswordHash: newPassword.trim() ? newPassword.trim() : settings.adminPasswordHash
    };
    onUpdateSettings(updated);
    setSettingsSavedMsg("Configurações salvas com sucesso!");
    setNewPassword("");
    setTimeout(() => setSettingsSavedMsg(""), 3000);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `achados-shopee-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportProducts(json);
          alert(`Backup importado com sucesso! ${json.length} produtos adicionados/substituídos.`);
        } else {
          alert("Estrutura de arquivo inválida. O backup precisa ser uma lista de produtos.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON. Certifique-se de que é um formato válido.");
      }
    };
    reader.readAsText(file);
  };

  // STAT CALCS
  const totalProducts = products.length;
  const totalClicks = products.reduce((acc, p) => acc + (p.clicks || 0), 0);
  const sortedByClicks = [...products].sort((a, b) => b.clicks - a.clicks);
  const topProduct = sortedByClicks[0];

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-5 shadow-inner">
          <Key className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 font-sans tracking-tight">Painel de Administração</h2>
        <p className="text-xs text-slate-400 font-semibold mb-6">
          Acesse para gerenciar links de afiliado e configurações da vitrine.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Código de Acesso</label>
            <input
              type="password"
              placeholder="Digite seu código de acesso"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-3 px-4 text-sm text-slate-800 font-semibold transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {authError && (
            <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 py-2 px-3 rounded-xl">
              {authError}
            </p>
          )}

          <button
            type="submit"
            id="btn-login-submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl shadow-md transition-all text-sm tracking-wide cursor-pointer"
          >
            Entrar no Painel
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400 leading-relaxed font-medium">
          🔒 Todos os seus dados ficam salvos em segurança no seu navegador de forma local (LocalStorage) e sem custos extras.
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header bar within panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 font-sans tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-orange-500" />
            Central de Controle
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Painel do Afiliador Shopee • Gerenciamento Local Autônomo
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            id="btn-add-product"
            onClick={handleAddNew}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Achado
          </button>

          <button
            id="btn-admin-logout"
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </button>
        </div>
      </div>

      {/* STATS STRIP CONTAINER */}
      <div id="dashboard-statistics" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos Cadastrados</p>
            <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalProducts}</p>
          </div>
        </div>

        {/* Total Click Counts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliques em Links</p>
            <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalClicks}</p>
          </div>
        </div>

        {/* Highlight item */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner col">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto Mais Popular</p>
            <p className="text-xs font-extrabold text-slate-800 truncate mt-1">
              {topProduct ? topProduct.title : "Nenhum ainda"}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {topProduct ? `${topProduct.clicks} cliques` : "Crie produtos primeiro!"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Manage List of Products OR Form edit */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            /* PRODUCT CREATION/EDITION FORM */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-1.5">
                <Edit className="w-5 h-5 text-orange-500" />
                {currentId ? "Editar Produto Cadastrado" : "Cadastrar Novo Achado"}
              </h3>

              {/* Gerador Automático IA */}
              <div className="mb-6 pb-6 border-b border-dashed border-slate-200">
                <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🪄</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Gerador Automático de Anúncios (Gemini AI)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-semibold">
                    Cole o link original do produto ou cole um texto do produto (especificações técnicas, reviews, título confuso) e o Gemini fará a mágica! Ele completará todo o formulário com preços, título ideal sob medida, categoria correta, foto premium e descrição vendedora.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Link do Produto Shopee (URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://shopee.com.br/produto-exemplo-link..."
                        value={aiUrl}
                        onChange={(e) => setAiUrl(e.target.value)}
                        className="w-full bg-white border border-slate-250 focus:border-orange-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Copiar & Colar Texto do Produto (Opcional - Altamente Recomendado)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Título técnico longo com frete de atacado da shopee, ou especificações técnicas..."
                        value={aiRawText}
                        onChange={(e) => setAiRawText(e.target.value)}
                        className="w-full bg-white border border-slate-250 focus:border-orange-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-medium"
                      />
                    </div>

                    {generateError && (
                      <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 py-2 px-3 rounded-xl">
                        ⚠️ Erro: {generateError}
                      </p>
                    )}

                    {generateSuccess && (
                      <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 py-2 px-3 rounded-xl">
                        ✨ {generateSuccess}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating}
                      className={`w-full font-black text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isGenerating 
                          ? "bg-orange-300 text-white cursor-not-allowed" 
                          : "bg-orange-600 hover:bg-orange-700 text-white hover:scale-[1.01]"
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>O Gemini AI está escrevendo o anúncio irresistível...</span>
                        </>
                      ) : (
                        <>
                          <span>🪄 Gerar Dados do Anúncio com IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Product Title */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Título Completo</label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Luminária Projetor Astronauta Estrelas de Galáxia USB"
                    className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-800 font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descrição Tecnica / Apresentação</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Forneça especificações e dicas de uso detalhadas para convencer os visitantes. Pode copiar das reviews ou anúncio original."
                    className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preço Promocional (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ex: 59.90"
                      className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-800 font-mono font-bold"
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preço Cheio Tradicional (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="Ex: 119.90"
                      className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Affiliate Link */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Link de Afiliado da Shopee (URL Oficial)</label>
                  <input
                    type="url"
                    required
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://shope.ee/sua-url-afiliado"
                    className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-orange-700 font-mono font-bold"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Endereço da Imagem (URL)</label>
                    <button
                      type="button"
                      onClick={() => setImage("https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop")}
                      className="text-[10px] text-orange-600 font-bold hover:underline"
                    >
                      Inserir Imagem Padrão
                    </button>
                  </div>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://endereçodaimagem.com/foto.jpg"
                    className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    🔍 Dica: Você pode copiar o endereço das imagens dos produtos no próprio site da Shopee ou do Google Imagens e colar aqui!
                  </p>
                </div>

                {/* Category selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Escolher Categoria Existente</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-700 font-bold"
                    >
                      {categories.filter(c => c !== "Todos").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">OU Criar Nova Categoria</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Livros"
                      className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Coupon */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Código Cupom Disponível (Opcional)</label>
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Ex: OFERTA50"
                      className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold font-mono tracking-wider"
                    />
                  </div>

                  {/* Switches */}
                  <div className="flex flex-col justify-end gap-3 pb-1 text-xs">
                    <label className="flex items-center gap-2 font-bold text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 w-4.5 h-4.5 cursor-pointer accent-orange-500"
                      />
                      <span>Destacar Produto na Home</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 w-4.5 h-4.5 cursor-pointer accent-orange-500"
                      />
                      <span>Link Ativo & Disponível</span>
                    </label>
                  </div>
                </div>

                {/* Form buttons */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-50">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer text-center"
                  >
                    Salvar Oferta
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* TABULAR LIST OF PRODUCT MANAGE */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
              <h3 className="text-lg font-black text-slate-800 mb-6">Lista Completa de Achados</h3>
              
              {products.length === 0 ? (
                <div className="text-center py-10">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-550 text-sm font-semibold mb-2">Sua vitrine está vazia!</p>
                  <button
                    onClick={handleAddNew}
                    className="text-xs text-orange-600 font-bold hover:underline"
                  >
                    Criar meu primeiro produto de afiliado
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="pb-3 pt-1">Produto</th>
                        <th className="pb-3 pt-1">Categoria</th>
                        <th className="pb-3 pt-1 text-right">Preço (R$)</th>
                        <th className="pb-3 pt-1 text-center">Cliques</th>
                        <th className="pb-3 pt-1 text-center">Opções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pr-4 block sm:table-cell">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                              />
                              <div className="max-w-[200px] sm:max-w-[150px] md:max-w-[240px]">
                                <p className="text-xs font-bold text-slate-800 truncate leading-snug">{p.title}</p>
                                <span className={`text-[9px] font-bold py-0.5 px-1.5 rounded-md ${
                                  p.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                }`}>
                                  {p.isAvailable ? "Ativo" : "Pausado"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 text-xs font-semibold">{p.category}</td>
                          <td className="py-3 text-right text-xs font-extrabold text-slate-805 font-mono">
                            {p.price.toFixed(2)}
                          </td>
                          <td className="py-3 text-center text-xs font-black text-emerald-600 font-mono bg-emerald-50/30 rounded-lg">
                            {p.clicks}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(p.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                                title="Deletar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Site Settings & Backup Tools */}
        <div className="space-y-6">
          
          {/* Site identity preferences */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
            <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5" /> Cores & Textos Vitrine
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Título da Vitrine</label>
                <input
                  type="text"
                  required
                  value={blogName}
                  onChange={(e) => setBlogName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slogan ou Legenda</label>
                <input
                  type="text"
                  required
                  value={blogSubtitle}
                  onChange={(e) => setBlogSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Texto do Banner Superior</label>
                <input
                  type="text"
                  value={promotionBanner}
                  onChange={(e) => setPromotionBanner(e.target.value)}
                  placeholder="Deixe em branco para ocultar"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div className="pt-2 border-t border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mudar Código de Acesso do Painel (PIN)</label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter atual"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold"
                />
              </div>

              {settingsSavedMsg && (
                <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 py-1.5 px-3 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {settingsSavedMsg}
                </p>
              )}

              <button
                type="submit"
                id="btn-save-settings"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black text-xs py-2.5 rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Salvar Definições
              </button>
            </form>
          </div>

          {/* Backup / Export / Import */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
            <h3 className="text-base font-black text-slate-800 mb-2 flex items-center gap-1.5">
              💾 Preservação de Dados
            </h3>
            <p className="text-[10px] text-slate-450 mb-4 font-medium leading-relaxed">
              Como seu site salva tudo no navegador (gratuito), se você limpar os caches do PC pode perder seus produtos cadastrados. **Sempre salve backups!**
            </p>

            <div className="space-y-3">
              {/* Export Button */}
              <button
                id="btn-export-backup"
                onClick={handleExportJSON}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black py-2.5 px-4 rounded-xl border border-slate-250 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Baixar Backup (JSON)
              </button>

              {/* Import Area */}
              <div>
                <label className="relative w-full bg-slate-50 hover:bg-slate-100 text-slate-750 text-xs font-black py-2.5 px-4 rounded-xl border border-slate-250 flex items-center justify-center gap-2 cursor-pointer transition-all border-dashed">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Restaurar Backup (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
