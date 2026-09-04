
import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { ProductSkeleton } from './Skeleton';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product, size?: string, colorVariant?: { main: string; secondary: string }) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  loading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  onProductClick, 
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-8 gap-y-8 sm:gap-y-16">
        {[...Array(6)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-8 gap-y-8 sm:gap-y-16">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isWishlisted={wishlistIds.includes(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
