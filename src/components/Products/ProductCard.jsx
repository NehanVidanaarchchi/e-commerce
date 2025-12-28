import React from "react";
import { useNavigate } from "react-router-dom";
import { FiShoppingCart } from "react-icons/fi";
import "./ProductCard.css";

const FALLBACK_IMG =
  "https://dummyimage.com/600x400/eef2ff/4f46e5.png&text=Product";

export default function ProductCard({ p, onAddToCart = () => {} }) {
  const nav = useNavigate();

  return (
    <div
      className="shCard"
      onClick={() => nav(`/product/${p.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="shImgWrap">
        {p.featured && <span className="shBadge">Featured</span>}
        <img
          src={p.image || FALLBACK_IMG}
          alt={p.name || "product"}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
        />
      </div>

      <div className="shCardBody">
        <div className="shName">{p.name}</div>
        <div className="shBottomRow">
          <div>
            <div className="shPrice">
              Rs : {Number(p.price || 0).toFixed(2)}
            </div>
          </div>

          <button
            className="shCartMini"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(p, 1);
            }}
            title="Add to cart"
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
}
