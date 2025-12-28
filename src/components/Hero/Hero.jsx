import React from "react";
import "./Hero.css";

export default function Hero({ search, setSearch }) {
  return (
    <section className="shHero">
      <div className="shHeroInner">
        <div className="shHeroPill">
          ✨ Welcome to Your Premium Marketplace
        </div>

        <h1 className="shHeroH1">Discover Amazing Products for Every Need</h1>
        <p className="shHeroP">
          From cutting-edge tech accessories to stylish fashion and quality cookware
        </p>

        <div className="shHeroSearchWrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products..."
          />
        </div>
      </div>
    </section>
  );
}
