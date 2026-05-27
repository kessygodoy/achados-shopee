import { useState, useEffect } from "react";
import { Product } from "../types";
import { 
  ArrowLeft, ShoppingBag, Copy, Check, MessageCircle, Send, 
  Clock, Heart, Star, Share2, ShieldAlert, BadgePercent, ArrowRight
} from "lucide-react";

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onNavigateToProduct: (id: string) => void;
  onLinkOpened: (product: Product) => void;
}

export default function ProductDetailView({
  product,
  allProducts,
  onBack,
  onNavigateToProduct,
  onLinkOpened,
}: ProductDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 });
  const [favorite, setFavorite] = useState(false);

  // Set up an active countdown timer for conversion psychological trigger
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown
  const formatTime = (num: number) => num.toString().padStart(2, "0");

  // Track affiliate click and redirect
  const handlePurchase = () => {
    onLinkOpened(product);
    window.open(product.link, "_blank", "noopener,noreferrer");
  };

  // Copy product coupon code
  const handleCopyCoupon = () => {
    if (product.discountCode) {
      navigator.clipboard.writeText(product.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build the recommendations list: other products in same category (or random ones if not enough)
  const recommendations = allProducts
    .filter((p) => p.id !== product.id && p.isAvailable)
    .sort((a, b) => (a.category === product.category ? -1 : 1)) // Prioritize same category
    .slice(0, 4);

  // Sharing utils
  const getShareText = () => {
    return encodeURIComponent(
      `🔥 OLHA ESSE ACHADO DA SHOPEE! \n\n*${product.title}*\n\nDe R$ ${product.originalPrice.toFixed(2)} por apenas *R$ ${product.price.toFixed(2)}!*\n\n👉 Veja detalhes e garanta o cupom: ${window.location.href}`
    );
  };

  const shareToWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${getShareText()}`, "_blank");
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.title)}`, "_blank");
  };

  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        id="btn-back-to-home"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 py-2.5 px-4 rounded-xl shadow-xs cursor-pointer mb-8 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a Vitrine Principal
      </button>

      {/* Main product box */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-4 sm:p-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Image Area */}
          <div className="lg:col-span-5">
            {/* Main Image Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs group aspect-square">
              <img
                src={product.image}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />

              {/* Badges on Image */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider select-none pointer-events-none">
                  -{discountPercentage}% Economia
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  id="btn-favorite"
                  onClick={() => setFavorite(!favorite)}
                  className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 hover:text-rose-500 p-2.5 rounded-full shadow-md transition-colors cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${favorite ? "fill-current text-rose-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* Shopee Security Guarantee */}
            <div className="mt-5 p-4 rounded-xl bg-orange-50/50 border border-orange-100 flex gap-3 text-xs text-orange-850">
              <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-extrabold text-orange-900 mb-0.5">Link de Afiliado Oficial</p>
                <p className="text-slate-600 leading-relaxed">
                  Este link direciona você com segurança para o app/site oficial da Shopee Brasil. O pagamento e suporte são feitos inteiramente pela Shopee com garantia segura!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Information Area */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Category and ratings */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="bg-slate-100 text-slate-700 text-xs font-black py-1 px-3 rounded-lg uppercase tracking-wider">
                  {product.category}
                </span>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <span className="text-xs font-extrabold text-slate-800">{product.rating.toFixed(1)} de 5</span>
                  <span className="text-[11px] text-slate-400">({product.reviewsCount} opiniões)</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug tracking-tight mb-4">
                {product.title}
              </h1>

              {/* Urgency alert */}
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500 animate-spin" />
                  <span>Oferta relâmpago! Preço promocional expira em:</span>
                </div>
                <div className="font-mono text-sm font-extrabold bg-red-500 text-white px-2.5 py-0.5 rounded-lg">
                  {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                </div>
              </div>

              {/* Pricing section */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                <div className="text-slate-400 text-xs line-through font-medium mb-1">
                  Preço Original: R$ {product.originalPrice.toFixed(2)}
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-slate-600 text-sm font-bold">Preço de Afiliado:</span>
                  <span className="text-3xl font-black text-orange-500 tracking-tight font-mono">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-100">
                    Menor Preço Garantido
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  *Comprando por este link você apoia nosso canal e garante o menor preço com desconto Shopee!
                </p>
              </div>

              {/* Main Actions */}
              <div className="space-y-4">
                {/* BIG PROMOTION CALL TO ACTION */}
                <button
                  id="btn-buy-now-detail"
                  onClick={handlePurchase}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 active:translate-y-0.5 flex items-center justify-center gap-3 transition-all cursor-pointer ring-4 ring-orange-100 group"
                >
                  <ShoppingBag className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" />
                  Ir para a Shopee do Brasil e Ativar Desconto
                  <ArrowRight className="w-5 h-5 animate-bounce-horizontal" />
                </button>

                {/* Voucher Code Block */}
                {product.discountCode && (
                  <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                        <BadgePercent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cupom de Desconto</p>
                        <p className="text-base font-black text-slate-800 font-mono tracking-wide">{product.discountCode}</p>
                      </div>
                    </div>
                    <button
                      id="btn-copy-coupon-detail"
                      onClick={handleCopyCoupon}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sharing Social actions */}
            <div className="border-t border-slate-100 pt-6 mt-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Divulgar nas Redes Sociais
              </p>
              <div className="flex gap-2.5">
                <button
                  id="btn-share-whatsapp"
                  onClick={shareToWhatsApp}
                  className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current text-white" />
                  WhatsApp
                </button>
                <button
                  id="btn-share-telegram"
                  onClick={shareToTelegram}
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4 fill-current text-white" />
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Long Description */}
        <div id="product-long-description" className="border-t border-slate-100 pt-8 mt-10">
          <h2 className="text-lg font-black text-slate-800 mb-4 font-sans tracking-tight">Ficha de Apresentação & Detalhes</h2>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {product.description}
          </p>
        </div>
      </div>

      {/* Suggested Products Section - "Quem viu viu isso também..." */}
      <div id="recommendations-container" className="border-t border-slate-100 pt-10">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-6 flex items-center gap-2">
          <span>Quem viu se interessou também por...</span>
          <span className="text-xs font-bold uppercase tracking-widest bg-orange-100 px-2 py-0.5 rounded-md text-orange-700">Sugestões de Cupons</span>
        </h2>
        
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((recProduct) => {
              const recDiscount = Math.round(
                ((recProduct.originalPrice - recProduct.price) / recProduct.originalPrice) * 100
              );
              return (
                <div
                  key={recProduct.id}
                  id={`rec-item-${recProduct.id}`}
                  onClick={() => onNavigateToProduct(recProduct.id)}
                  className="bg-white rounded-2xl border border-slate-100 hover:border-orange-200 p-3 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                >
                  <div className="relative pt-[100%] rounded-xl overflow-hidden mb-3 bg-slate-50">
                    <img
                      src={recProduct.image}
                      alt={recProduct.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                    />
                    {recDiscount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                        -{recDiscount}%
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-xs line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                      {recProduct.title}
                    </h3>
                  </div>
                  <div className="mt-3.5 pt-2 border-t border-slate-50">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400 line-through">R$ {recProduct.originalPrice.toFixed(2)}</span>
                      <span className="text-sm font-extrabold text-orange-500 font-mono">
                        R$ {recProduct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-405 text-sm text-center py-6">Mais achados cadastrados aparecerão aqui em breve!</p>
        )}
      </div>
    </div>
  );
}
