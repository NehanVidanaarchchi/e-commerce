import React, { useMemo, useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import "./Products.css";

export default function Products({
  loading = false,
  products = [],
  activeCategory = "All Products",
  onAddToCart = () => {},
}) {
  const [visibleCount, setVisibleCount] = useState(10);

  // reset visibleCount when category/products change
  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory, products]);

  const list = useMemo(() => {
    return products.filter((p) =>
      activeCategory === "All Products" ? true : p.category === activeCategory
    );
  }, [products, activeCategory]);

  const visibleList = useMemo(() => {
    return list.slice(0, visibleCount);
  }, [list, visibleCount]);

  const canViewMore = visibleCount < list.length;

  return (
    <section className="shSection">
      <div className="shContainer">
        <div className="shSectionHead">
          <div>
            <h2>{activeCategory}</h2>
            <p>
              Showing {Math.min(visibleCount, list.length)} / {list.length} products
            </p>
          </div>
        </div>

        {loading ? (
          <div className="shLoadingWrap">
            <div className="shSpinner" />
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className="shGrid">
              {visibleList.map((p) => (
                <ProductCard
                  key={p.id}
                  p={{ ...p, image: p.imageUrl, desc: p.description }}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>

            {/* ✅ View More */}
            {list.length > 0 && (
              <div className="shMoreWrap">
                {canViewMore ? (
                  <button
                    className="shMoreBtn"
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 10)}
                  >
                    View More
                  </button>
                ) : (
                  <button
                    className="shMoreBtn ghost"
                    type="button"
                    onClick={() => setVisibleCount(10)}
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
