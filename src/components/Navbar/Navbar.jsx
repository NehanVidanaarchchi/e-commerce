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

  // ✅ Logged-in user (from localStorage)
  const [user, setUser] = useState(null);

  // 🔹 Read login state
  useEffect(() => {
    const raw = localStorage.getItem("sh_user");
    setUser(raw ? JSON.parse(raw) : null);

    // listen when login/logout happens in other tabs
    const onStorage = () => {
      const r = localStorage.getItem("sh_user");
      setUser(r ? JSON.parse(r) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 🔹 Load products to extract categories
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

  // 🔹 Categories
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All Products", ...Array.from(set)];
  }, [items]);

  const pick = (cat) => {
    setActiveCategory(cat);
    setMenuOpen(false);
    if (location.pathname !== "/") nav("/");
  };

  // close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="shNav">
      <div className="shNavInner">
        {/* BRAND */}
        <div
          className="shBrand"
          onClick={() => nav("/")}
          role="button"
          tabIndex={0}
        >
          <div className="shBrandText">
            <div className="shBrandTitle">ShopHub</div>
            <div className="shBrandSub">Premium Shopping</div>
          </div>
        </div>

        {/* DESKTOP CATEGORIES */}
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

        {/* ACTIONS */}
        <div className="shActions">
          {/* CART */}
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

          {/* USER (LOGIN / PROFILE) */}
          <button
            className="shLoginBtn"
            type="button"
            title={user ? "Profile" : "Login"}
            onClick={() => nav(user ? "/profile" : "/signin")}
          >
            <FiUser />
          </button>

          {/* BURGER */}
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

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="shMobileMenu">
          {categories.map((c) => (
            <button
              key={c}
              className={`shMobileItem ${
                activeCategory === c ? "active" : ""
              }`}
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
