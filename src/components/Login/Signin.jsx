import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "./Signin.css";

const SESSION_KEY = "sh_session_expires_at";
const SESSION_MINUTES = 30;

export default function Signin() {
  const nav = useNavigate();
  const location = useLocation();

  // if redirected from cart checkout
  const redirectTo = location.state?.redirectTo || "/profile";

  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanError = (msg) =>
    String(msg || "")
      .replace("Firebase:", "")
      .replace("auth/", "")
      .replace(/-/g, " ")
      .trim();

  const set30MinSession = () => {
    const expiresAt = Date.now() + SESSION_MINUTES * 60 * 1000;
    localStorage.setItem(SESSION_KEY, String(expiresAt));
  };

  const isSessionValid = () => {
    const raw = localStorage.getItem(SESSION_KEY);
    const expiresAt = Number(raw || 0);
    return expiresAt && Date.now() < expiresAt;
  };

  // ✅ On page load: if user is already logged in, keep them (until 30 min)
  useEffect(() => {
    // Ensure persistence is local (survives refresh)
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return;

      // If session expired -> sign out
      if (!isSessionValid()) {
        try {
          await signOut(auth);
        } catch {}
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      // Session still valid -> go to redirect
      nav(redirectTo, { replace: true });
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Ensure persistence is local (keeps login after refresh)
      await setPersistence(auth, browserLocalPersistence);

      if (mode === "register") {
        // ✅ validations
        if (!name.trim()) throw new Error("Name required");
        if (!phone.trim()) throw new Error("Phone number required");
        if (password.length < 6)
          throw new Error("Password must be at least 6 characters");

        // ✅ create auth account
        const res = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ set auth displayName
        await updateProfile(res.user, { displayName: name.trim() });

        // ✅ save user in firestore users collection
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: name.trim(),
          phone: phone.trim(),
          email: res.user.email || email,
          createdAt: serverTimestamp(),
        });

        // ✅ start 30 min session
        set30MinSession();

        nav(redirectTo, { replace: true });
      } else {
        // ✅ LOGIN
        const res = await signInWithEmailAndPassword(auth, email, password);

        // ✅ ensure user doc exists
        const uref = doc(db, "users", res.user.uid);
        const snap = await getDoc(uref);

        if (!snap.exists()) {
          await setDoc(
            uref,
            {
              uid: res.user.uid,
              name: res.user.displayName || "",
              phone: "",
              email: res.user.email || email,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // ✅ start 30 min session
        set30MinSession();

        nav(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(cleanError(err?.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <form className="authCard" onSubmit={submit}>
        <h2>{mode === "login" ? "Sign In" : "Create Account"}</h2>

        {error && <div className="authError">{error}</div>}

        {mode === "register" && (
          <>
            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />

            <input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Sign In"
            : "Register"}
        </button>

        <p className="authSwitch">
          {mode === "login" ? "No account?" : "Already have an account?"}
          <span
            role="button"
            tabIndex={0}
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }
            }}
          >
            {mode === "login" ? " Create one" : " Sign in"}
          </span>
        </p>
      </form>
    </div>
  );
}
