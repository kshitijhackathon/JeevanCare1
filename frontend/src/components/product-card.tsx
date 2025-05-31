import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showSaleBadge?: boolean;
}

export default function ProductCard({ product, compact = false, showSaleBadge = false }: ProductCardProps) {
  const rating = parseFloat(product.rating || "0");
  
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="card-hover text-center cursor-pointer relative">
        {showSaleBadge && product.isOnSale && (
          <Badge className="absolute top-1 right-1 bg-red-500 text-white text-xs z-10">
            Sale
          </Badge>
        )}
        <CardContent className={compact ? "p-3" : "p-4"}>
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
            alt={product.name}
            className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-2 object-cover rounded-lg`}
          />
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-800 mb-1`}>
            {product.name}
          </p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mb-2`}>
            ${product.price}
          </p>
          <div className="flex items-center justify-center">
            <div className="flex text-yellow-400 text-xs mr-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
