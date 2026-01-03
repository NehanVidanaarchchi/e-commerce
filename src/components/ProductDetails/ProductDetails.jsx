import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart } from "react-icons/fi";
import { db } from "../../firebase";
import "./ProductDetails.css";

const COLLECTION_NAME = "Items";
const FALLBACK_IMG =
  "https://dummyimage.com/1000x800/eef2ff/4f46e5.png&text=Product";

export default function ProductDetails({ onAddToCart = () => {} }) {
  const { id } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  // ✅ active image for gallery
  const [activeImg, setActiveImg] = useState(FALLBACK_IMG);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setItem(data);

          // 🔎 helpful debug (check console)
          console.log("PRODUCT DATA:", data);
        } else {
          setItem(null);
        }
      } catch (e) {
        console.log(e);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ✅ collect images from multiple possible field names
  const images = useMemo(() => {
    if (!item) return [];

    const fromArray = Array.isArray(item.images) ? item.images : [];

    const arr = [
      item.imageUrl,
      item.imageUrl2,
      item.image2,
      item.secondImage,
      ...fromArray,
    ]
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);

    // remove duplicates
    return Array.from(new Set(arr));
  }, [item]);

  // ✅ set default active image
  useEffect(() => {
    if (!item) return;
    setActiveImg(images[0] || item.imageUrl || FALLBACK_IMG);
  }, [item, images]);

  // ✅ loading UI
  if (loading) {
    return (
      <div className="pdWrap">
        <div className="pdInner">
          <button className="pdBack" onClick={() => nav(-1)} type="button">
            <FiArrowLeft /> Back to Shop
          </button>

          <div className="pdCard">
            <div className="pdLeft">
              <div className="sk skImg" />
            </div>

            <div className="pdRight">
              <div className="sk skPill" />
              <div className="sk skTitle" />
              <div className="sk skLine" />
              <div className="sk skLine sm" />
              <div className="sk skPrice" />
              <div className="sk skQty" />
              <div className="sk skBtn" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ not found
  if (!item) {
    return (
      <div className="pdWrap">
        <div className="pdInner">
          <button className="pdBack" onClick={() => nav(-1)} type="button">
            <FiArrowLeft /> Back to Shop
          </button>
          <div className="pdNotFound">Product not found.</div>
        </div>
      </div>
    );
  }

  const stock = Number(item.stock || 0);

  // ✅ always show 2 thumbnails even if only 1 image exists
  const thumb1 = images[0] || item.imageUrl || FALLBACK_IMG;
  const thumb2 = images[1] || item.imageUrl2 || FALLBACK_IMG;

  return (
    <div className="pdWrap">
      <div className="pdInner">
        <button className="pdBack" onClick={() => nav(-1)} type="button">
          <FiArrowLeft /> Back to Shop
        </button>

        <div className="pdCard">
          {/* LEFT: images */}
          <div className="pdLeft">
            <img
              src={activeImg || FALLBACK_IMG}
              alt={item.name || "product"}
              className="pdImg"
              onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
            />

            <div className="pdThumbs">
              {[thumb1, thumb2].map((src, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`pdThumbBtn ${src === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(src)}
                >
                  <img
                    src={src}
                    alt={`thumb-${idx + 1}`}
                    className="pdThumb"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: content */}
          <div className="pdRight">
            <span className="pdCat">{item.category || "Category"}</span>

            <h1 className="pdName">{item.name}</h1>

            <p className="pdDesc">{item.description}</p>

            <div className="pdPrice">Rs : {Number(item.price || 0).toFixed(2)}</div>

            <div className="pdQty">
              <div className="pdQtyLabel">Quantity</div>

              <div className="pdQtyBox">
                <button
                  className="pdQtyBtn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  type="button"
                >
                  <FiMinus />
                </button>

                <div className="pdQtyVal">{qty}</div>

                <button
                  className="pdQtyBtn"
                  onClick={() => setQty((q) => Math.min(stock || 999, q + 1))}
                  type="button"
                >
                  <FiPlus />
                </button>
              </div>

              {stock > 0 ? (
                <div className="pdStockOk">In stock: {stock}</div>
              ) : (
                <div className="pdStockNo">Out of stock</div>
              )}
            </div>

            <button
              className="pdAdd"
              type="button"
              disabled={stock === 0}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item, qty);
              }}
            >
              <FiShoppingCart /> Add to Cart
            </button>

            <div className="pdDivider" />

            <div className="pdFeatures">
              <div className="pdFeature">
                <div className="pdIconCircle">📦</div>
                <div className="pdFTitle">Quality Guaranteed</div>
                <div className="pdFSub">Premium products</div>
              </div>

              <div className="pdFeature">
                <div className="pdIconCircle">🛡️</div>
                <div className="pdFTitle">Secure Payment</div>
                <div className="pdFSub">100% protected</div>
              </div>

              <div className="pdFeature">
                <div className="pdIconCircle">🚚</div>
                <div className="pdFTitle">Free Shipping</div>
                <div className="pdFSub">On all orders</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
