import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import "./App.css";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "Items"), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((p) => {
      const catOk =
        activeCategory === "All Products"
          ? true
          : p.category === activeCategory;

      const text = `${p.name || ""} ${p.description || ""} ${
        p.desc || ""
      }`.toLowerCase();

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
      prev
        .map((x) =>
          x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x
        )
        .filter(Boolean)
    );

  const removeItem = (item) =>
    setCartItems((prev) => prev.filter((x) => x.id !== item.id));

  const checkout = () => {
    alert("Checkout page coming soon!");
  };

  return (
    <BrowserRouter>
      <div className="appShell">
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <>
            <Navbar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              cartCount={cartCount}
            />

            <Routes>
              {/* 🏠 HOME */}
              <Route
                path="/"
                element={
                  <>
                    <Hero search={search} setSearch={setSearch} />
                    <Products
                      loading={loading}
                      products={filtered}        // (or items)
                      activeCategory={activeCategory}
                      onAddToCart={addToCart}   
                    />
                  </>
                }
              />

              {/* 📦 PRODUCT DETAILS */}
              <Route
                path="/product/:id"
                element={<ProductDetails onAddToCart={addToCart} />}
              />

              {/* 🛒 CART */}
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
              <Route path="/profile" element={<Profile />} />
              <Route path="/signin" element={<Signin />} />
            </Routes>
            

            <Footer />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
