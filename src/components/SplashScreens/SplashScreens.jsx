// src/components/SplashScreen/SplashScreen.jsx
import React, { useEffect } from "react";
import "./SplashScreens.css";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onFinish && onFinish();
    }, 2000); // 2s splash

    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="splashInner">
        <div className="splashLogo">ShopHub</div>
        <div className="splashText">Premium Shopping</div>
      </div>
    </div>
  );
}
