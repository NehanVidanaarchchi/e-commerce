import { useEffect, useMemo, useState, useCallback } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "./firebase";

import Signin from "./components/Login/Signin";
import SplashScreen from "./components/SplashScreens/SplashScreens";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Products from "./components/Products/Products";
import ProductDetails from "./components/ProductDetails/ProductDetails";
import Cart from "./components/Cart/Cart";
import Footer from "./components/Footer/Footer";
import Profile from "./components/Profile/Profile";
import Network from "./components/Network/Network";

import "./App.css";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cartItems, setCartItems] = useState([]);

  // ✅ Network / error state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [netError, setNetError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // ✅ Listen to browser online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ✅ Retry action
  const retry = useCallback(() => {
    setNetError("");
    setLoading(true);
    setRetryKey((k) => k + 1);
  }, []);

  // ✅ Firestore Items (with error handling)
  useEffect(() => {
    if (!isOnline) return;

    setLoading(true);
    setNetError("");

    const unsub = onSnapshot(
      collection(db, "Items"),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setNetError(
          "Cannot load products. Please check your connection and try again."
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isOnline, retryKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((p) => {
      const catOk =
        activeCategory === "All Products"
          ? true
          : p.category === activeCategory;

      const text = `${p.name || ""} ${p.description || ""} ${p.desc || ""}`.toLowerCase();
      const qOk = q ? text.includes(q) : true;

      return catOk && qOk;
    });
  }, [items, activeCategory, search]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + Number(i.qty || 0), 0),
    [cartItems]
  );

  const addToCart = (product, qty = 1) => {
    const p = {
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image: product.imageUrl || product.image,
      stock: Number(product.stock || 0),
      category: product.category,
      desc: product.description || product.desc || "",
    };

    setCartItems((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        return prev.map((x) =>
          x.id === p.id ? { ...x, qty: x.qty + qty } : x
        );
      }
      return [...prev, { ...p, qty }];
    });
  };

  const incQty = (item) =>
    setCartItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x))
    );

  const decQty = (item) =>
    setCartItems((prev) =>
      prev.map((x) =>
        x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x
      )
    );

  const removeItem = (item) =>
    setCartItems((prev) => prev.filter((x) => x.id !== item.id));

  const checkout = () => {
    alert("Checkout page coming soon!");
  };

  // ✅ If offline OR firestore error → show Network screen (after splash)
  const showNetwork = !showSplash && (!isOnline || !!netError);

  return (
    // ✅ MemoryRouter keeps URL ALWAYS the same (only one path shown)
    <MemoryRouter initialEntries={["/"]}>
      <div className="appShell">
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : showNetwork ? (
          <Network
            title={!isOnline ? "You're Offline" : "Network Error"}
            message={
              !isOnline
                ? "No internet connection. Please reconnect and try again."
                : netError
            }
            onRetry={retry}
          />
        ) : (
          <>
            <Navbar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              cartCount={cartCount}
            />

            <Routes>
              {/* HOME */}
              <Route
                path="/"
                element={
                  <>
                    <Hero search={search} setSearch={setSearch} />
                    <Products
                      loading={loading}
                      products={filtered}
                      activeCategory={activeCategory}
                      onAddToCart={addToCart}
                    />
                  </>
                }
              />

              {/* PRODUCT DETAILS (won’t show in URL) */}
              <Route
                path="/product/:id"
                element={<ProductDetails onAddToCart={addToCart} />}
              />

              {/* CART (won’t show in URL) */}
              <Route
                path="/cart"
                element={
                  <Cart
                    cartItems={cartItems}
                    onInc={incQty}
                    onDec={decQty}
                    onRemove={removeItem}
                    onCheckout={checkout}
                  />
                }
              />

              {/* PROFILE (won’t show in URL) */}
              <Route path="/profile" element={<Profile />} />

              {/* SIGNIN (won’t show in URL) */}
              <Route path="/signin" element={<Signin />} />
            </Routes>

            <Footer />
          </>
        )}
      </div>
    </MemoryRouter>
  );
}
