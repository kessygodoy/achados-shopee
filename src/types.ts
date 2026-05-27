export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  originalPrice: number;
  link: string;
  category: string;
  clicks: number;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isAvailable: boolean;
  discountCode?: string;
  dateAdded: string;
}

export interface AppSettings {
  blogName: string;
  blogSubtitle: string;
  promotionBanner: string;
  adminPasswordHash: string; // Saved as text/simple pin for local auth
}

export type Category = string;
