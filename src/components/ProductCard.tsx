import { Product } from "../types";
import { Star, ArrowRight, Eye, ShieldCheck } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onDirectPurchase: (product: Product, event: React.MouseEvent) => void;
}

export default function ProductCard({ product, onClick, onDirectPurchase }: ProductCardProps) {
  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer group overflow-hidden"
    >
      {/* Product Image and badges */}
      <div className="relative pt-[100%] overflow-hidden bg-slate-50">
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Promo Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm tracking-wide transform -rotate-1">
            -{discountPercentage}% OFF
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-750 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-white/50">
          {product.category}
        </div>

        {/* Floating details hover button */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-white/95 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0">
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            Ver Oferta Completa
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-extrabold text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400">({product.reviewsCount} avaliações)</span>
          </div>

          {/* Title */}
          <h3 className="font-sans font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors duration-200">
            {product.title}
          </h3>
        </div>

        <div className="mt-4">
          {/* Slashed pre-discount price */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="line-through">De: R$ {product.originalPrice.toFixed(2)}</span>
            <div className="flex items-center gap-0.5 text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              <span>Verificado</span>
            </div>
          </div>

          {/* Current pricing */}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xs text-orange-500 font-black">Por apenas</span>
            <span className="text-xl font-extrabold text-orange-500 tracking-tight font-mono">
              R$ {product.price.toFixed(2)}
            </span>
          </div>

          {/* Discount code banner (if available) */}
          {product.discountCode && (
            <div className="mt-2.5 bg-orange-50 border border-dashed border-orange-200 text-orange-700 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center justify-between">
              <span>CUPOM: {product.discountCode}</span>
              <span className="text-[9px] uppercase tracking-wider text-orange-500">Copiar</span>
            </div>
          )}

          {/* Bottom Call to Action */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <button
              id={`btn-view-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 px-1 rounded-xl transition-colors text-center border border-slate-200"
            >
              Ficha Técnica
            </button>
            <button
              id={`btn-buy-${product.id}`}
              onClick={(e) => onDirectPurchase(product, e)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-2 px-1 rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1 group-hover:scale-[1.02]"
            >
              Ir p/ Shopee
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
