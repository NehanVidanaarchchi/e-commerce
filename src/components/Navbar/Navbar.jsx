import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiShoppingCart, FiMenu, FiX, FiUser } from "react-icons/fi";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import "./Navbar.css";

const COLLECTION_NAME = "Items";

export default function Navbar({
  activeCategory = "All Products",
  setActiveCategory = () => {},
  cartCount = 0,
}) {
  const nav = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

 
  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTION_NAME), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All Products", ...Array.from(set)];
  }, [items]);

  const pick = (cat) => {
    setActiveCategory(cat);
    setMenuOpen(false);
    if (location.pathname !== "/") nav("/");
  };


  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="shNav">
      <div className="shNavInner">
        
        <div className="shBrand" onClick={() => nav("/")} role="button" tabIndex={0}>
          <div className="shBrandText">
            <div className="shBrandTitle">ShopHub</div>
            <div className="shBrandSub">Premium Shopping</div>
          </div>
        </div>

        
        <nav className="shTabs" aria-label="Categories">
          {categories.map((c) => (
            <button
              key={c}
              className={`shTab ${activeCategory === c ? "active" : ""}`}
              onClick={() => pick(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </nav>

        
        <div className="shActions">
          {/* Cart */}
          <button
            className="shCartBtn"
            type="button"
            title="Cart"
            onClick={() => nav("/cart")}
          >
            <FiShoppingCart />
            {cartCount > 0 && (
              <span className="shCartBadge">{cartCount}</span>
            )}
          </button>

          <button
            className="shLoginBtn"
            type="button"
            onClick={() => nav("/login")}
          >
            <FiUser />
          </button>

          {/* Burger (Mobile) */}
          <button
            className="shBurger"
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      
      {menuOpen && (
        <div className="shMobileMenu">
          {categories.map((c) => (
            <button
              key={c}
              className={`shMobileItem ${activeCategory === c ? "active" : ""}`}
              onClick={() => pick(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
