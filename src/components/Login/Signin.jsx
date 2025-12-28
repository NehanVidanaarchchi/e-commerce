import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "./Signin.css";

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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        // ✅ validations
        if (!name.trim()) throw new Error("Name required");
        if (!phone.trim()) throw new Error("Phone number required");
        if (password.length < 6)
          throw new Error("Password must be at least 6 characters");

        // ✅ create auth account
        const res = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ optional: set auth displayName
        await updateProfile(res.user, { displayName: name.trim() });

        // ✅ save in firestore users collection
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: name.trim(),
          phone: phone.trim(),
          email: res.user.email || email,
          createdAt: serverTimestamp(),
        });

        nav(redirectTo, { replace: true });
      } else {
        // ✅ LOGIN
        const res = await signInWithEmailAndPassword(auth, email, password);

        // ✅ ensure user doc exists (optional safety)
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

        {/* ✅ NAME + PHONE ONLY FOR REGISTER */}
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
