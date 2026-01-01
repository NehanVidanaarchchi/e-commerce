import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { db, auth } from "./firebase";

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

const SESSION_KEY = "sh_session_expires_at"; // must match Signin.jsx
const SESSION_MINUTES = 30;

/* ✅ Protected Route */
function ProtectedRoute({ authReady, isAuthed, children }) {
  const location = useLocation();
  if (!authReady) return null;

  if (!isAuthed) {
    return <Navigate to="/signin" replace state={{ redirectTo: location.pathname }} />;
  }

  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Auth state
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // ✅ Products state
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Cart state
  const [cartItems, setCartItems] = useState([]);

  // ✅ Network / error state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [netError, setNetError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // ✅ session timer ref
  const sessionTimerRef = useRef(null);

  // ---------------------------
  // ✅ Session helpers (memoized)
  // ---------------------------
  const getExpiresAt = useCallback(
    () => Number(localStorage.getItem(SESSION_KEY) || 0),
    []
  );

  const isSessionValid = useCallback(() => {
    const expiresAt = getExpiresAt();
    return !!expiresAt && Date.now() < expiresAt;
  }, [getExpiresAt]);

  const set30MinSessionIfMissing = useCallback(() => {
    const expiresAt = getExpiresAt();
    if (!expiresAt) {
      localStorage.setItem(
        SESSION_KEY,
        String(Date.now() + SESSION_MINUTES * 60 * 1000)
      );
    }
  }, [getExpiresAt]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const forceLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {}
    clearSession();
  }, [clearSession]);

  // ✅ GLOBAL: Listen Firebase Auth + enforce 30-min expiry
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // clear previous timer
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }

      if (!u) {
        setIsAuthed(false);
        setAuthReady(true);
        return;
      }

      // if user exists but session expired -> log out
      if (!isSessionValid()) {
        await forceLogout();
        setIsAuthed(false);
        setAuthReady(true);
        return;
      }

      // session exists/valid -> keep login
      set30MinSessionIfMissing();
      setIsAuthed(true);
      setAuthReady(true);

      // ✅ auto logout exactly at expiry time
      const expiresAt = getExpiresAt();
      const msLeft = Math.max(0, expiresAt - Date.now());

      sessionTimerRef.current = setTimeout(async () => {
        await forceLogout();
        setIsAuthed(false);
      }, msLeft);
    });

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      unsub();
    };
  }, [forceLogout, getExpiresAt, isSessionValid, set30MinSessionIfMissing]);

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
        setNetError("Cannot load products. Please check your connection and try again.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isOnline, retryKey]);

  // ✅ Filter products
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((p) => {
      const catOk =
        activeCategory === "All Products" ? true : p.category === activeCategory;

      const text = `${p.name || ""} ${p.description || ""} ${p.desc || ""}`.toLowerCase();
      const qOk = q ? text.includes(q) : true;

      return catOk && qOk;
    });
  }, [items, activeCategory, search]);

  // ✅ Cart count
  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + Number(i.qty || 0), 0),
    [cartItems]
  );

  // ✅ Cart actions
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
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x));
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
      prev.map((x) => (x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
    );

  const removeItem = (item) =>
    setCartItems((prev) => prev.filter((x) => x.id !== item.id));

  // ✅ If offline OR firestore error → show Network screen (after splash)
  const showNetwork = !showSplash && (!isOnline || !!netError);

  return (
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

              {/* PRODUCT DETAILS */}
              <Route
                path="/product/:id"
                element={<ProductDetails onAddToCart={addToCart} />}
              />

              {/* ✅ CART is PUBLIC (login check happens inside Cart on checkout button) */}
              <Route
                path="/cart"
                element={
                  <Cart
                    cartItems={cartItems}
                    onInc={incQty}
                    onDec={decQty}
                    onRemove={removeItem}
                    onCheckoutDone={() => setCartItems([])}
                  />
                }
              />

              {/* ✅ PROFILE is PROTECTED */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute authReady={authReady} isAuthed={isAuthed}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* SIGNIN */}
              <Route path="/signin" element={<Signin />} />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
          </>
        )}
      </div>
    </MemoryRouter>
  );
}
