import React, { useMemo } from "react";
import ProductCard from "./ProductCard";
import "./Products.css";

export default function Products({
  loading = false,
  products = [],
  activeCategory = "All Products",
  onAddToCart = () => {},
}) {
  const list = useMemo(() => {
    return products.filter((p) =>
      activeCategory === "All Products" ? true : p.category === activeCategory
    );
  }, [products, activeCategory]);

  return (
    <section className="shSection">
      <div className="shContainer">
        <div className="shSectionHead">
          <div>
            <h2>{activeCategory}</h2>
            <p>{list.length} products available</p>
          </div>
        </div>

        
        {loading ? (
          <div className="shLoadingWrap">
            <div className="shSpinner" />
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="shGrid">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                p={{ ...p, image: p.imageUrl, desc: p.description }}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
