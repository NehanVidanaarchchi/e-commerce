import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="shFooter">
      <div className="shFooterInner">
        <div className="shFooterBrand">
          <div className="shFooterLogo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M3 10l2-6h14l2 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="shFooterTitle">ShopHub</div>
            <div className="shFooterSub">Your trusted marketplace for quality products</div>
          </div>
        </div>

        <div className="shFooterCols">
          <div className="shFooterCol">
            <div className="shFooterH">Company</div>
            <a href="/">About Us</a>
            <a href="/">Contact</a>
          </div>
        </div>
      </div>

      <div className="shFooterBottom">
        © 2025 ShopHub. All rights reserved.
      </div>
    </footer>
  );
}
