import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiClipboard,
} from "react-icons/fi";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import "./Cart.css";

export default function Cart({
  cartItems = [],
  onInc = () => {},
  onDec = () => {},
  onRemove = () => {},
  onCheckoutDone = () => {}, // ✅ clear cart
}) {
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ POPUP STATE
  const [showPopup, setShowPopup] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const { itemsCount, subtotal } = useMemo(() => {
    const count = cartItems.reduce((a, i) => a + Number(i.qty || 0), 0);
    const sub = cartItems.reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
      0
    );
    return { itemsCount: count, subtotal: sub };
  }, [cartItems]);

  const total = subtotal;

  // ✅ Create receipt id
  const makeReceiptId = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
    return `RCP-${yyyy}${mm}${dd}-${rand}`;
  };

  // ✅ Auto-checkout after login
  useEffect(() => {
    const flag = localStorage.getItem("sh_do_checkout");
    const user = auth.currentUser;

    if (flag === "1" && user && cartItems.length > 0 && !saving) {
      localStorage.removeItem("sh_do_checkout");
      handleCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  const handleCheckout = async () => {
    setMsg("");

    const user = auth.currentUser;
    if (!user) {
      localStorage.setItem("sh_do_checkout", "1");
      nav("/signin", { state: { redirectTo: "/cart" } });
      return;
    }

    if (cartItems.length === 0) return;

    try {
      setSaving(true);

      // ✅ Get logged user's name + phone from Firestore
      let customerName = "";
      let customerPhone = "";

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const u = userSnap.data();
        customerName = u.name || "";
        customerPhone = u.phone || "";
      }

      const receiptId = makeReceiptId();

      const order = {
        receiptId,
        userId: user.uid,
        userEmail: user.email || "",
        customer: {
          name: customerName,
          phone: customerPhone,
        },
        items: cartItems.map((i) => ({
          id: i.id,
          name: i.name,
          price: Number(i.price || 0),
          qty: Number(i.qty || 1),
          image: i.image || i.imageUrl || "",
        })),
        itemsCount,
        subtotal,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), order);

      // ✅ clear cart
      onCheckoutDone();

      // ✅ OPEN POPUP
      setReceiptData({
        receiptId,
        customerName,
        customerPhone,
        total,
        itemsCount,
      });
      setShowPopup(true);

      setMsg("");
    } catch (e) {
      console.error(e);
      setMsg("❌ Failed to place order. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyReceipt = async () => {
    if (!receiptData?.receiptId) return;
    try {
      await navigator.clipboard.writeText(receiptData.receiptId);
      setMsg("✅ Receipt copied!");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg("❌ Copy failed");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  return (
    <>
      <section className="cartPage">
        <div className="cartWrap">
          {/* Top bar */}
          <div className="cartTop">
            <button className="cartBack" type="button" onClick={() => nav("/")}>
              <FiArrowLeft />
              <span>Continue Shopping</span>
            </button>

            <div className="cartTitle">
              <h2>Shopping Cart</h2>
              <p>({itemsCount} items)</p>
            </div>
          </div>

          {msg && <div className="cartMsg">{msg}</div>}

          <div className="cartGrid">
            {/* Left: items */}
            <div className="cartLeft">
              {cartItems.length === 0 ? (
                <div className="cartEmpty">
                  <div className="cartEmptyCard">
                    <h3>Your cart is empty</h3>
                    <p>Add products to see them here.</p>
                    <button className="cartPrimary" onClick={() => nav("/")}>
                      Browse Products
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cartList">
                  {cartItems.map((item) => (
                    <div className="cartItem" key={item.id}>
                      <div className="cartItemMedia">
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="cartItemImg"
                          loading="lazy"
                        />
                      </div>

                      <div className="cartItemInfo">
                        <div className="cartItemName">{item.name}</div>
                        <div className="cartItemPrice">
                          Rs : {Number(item.price || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="cartItemQty">
                        <button
                          className="qtyBtn"
                          type="button"
                          onClick={() => onDec(item)}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus />
                        </button>
                        <div className="qtyVal">{item.qty || 1}</div>
                        <button
                          className="qtyBtn"
                          type="button"
                          onClick={() => onInc(item)}
                          aria-label="Increase quantity"
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="cartItemRight">
                        <div className="cartItemTotal">
                          Rs :{" "}
                          {(
                            Number(item.price || 0) * Number(item.qty || 0)
                          ).toFixed(2)}
                        </div>

                        <button
                          className="removeBtn"
                          type="button"
                          onClick={() => onRemove(item)}
                          title="Remove"
                          aria-label="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: summary */}
            <aside className="cartRight">
              <div className="summaryCard">
                <h3>Order Summary</h3>

                <div className="sumRow">
                  <span>Subtotal ({itemsCount} items)</span>
                  <span>Rs : {subtotal.toFixed(2)}</span>
                </div>

                <div className="sumRow">
                  <span>Shipping</span>
                  <span className="sumFree">Free</span>
                </div>

                <div className="sumRow">
                  <span>Tax</span>
                  <span className="sumMuted">Calculated at checkout</span>
                </div>

                <div className="sumDivider" />

                <div className="sumRow sumTotal">
                  <span>Total</span>
                  <span>Rs : {total.toFixed(2)}</span>
                </div>

                <button
                  className="checkoutBtn"
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || saving}
                >
                  {saving ? "Placing Order..." : "Proceed to Checkout"}
                </button>

                <div className="sumNote">
                  🚚 <span>Free shipping on all orders</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ✅ POPUP MODAL */}
      {showPopup && receiptData && (
        <div
          className="rcOverlay"
          onClick={() => setShowPopup(false)}
          role="presentation"
        >
          <div
            className="rcModal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="rcClose"
              type="button"
              onClick={() => setShowPopup(false)}
              aria-label="Close"
              title="Close"
            >
              <FiX />
            </button>

            <div className="rcTop">
              <div className="rcIcon">
                <FiCheckCircle />
              </div>
              <div>
                <h3>Order Placed Successfully</h3>
                <p>Your order is now pending. We’ll process it soon.</p>
              </div>
            </div>

            <div className="rcCard">
              <div className="rcRow">
                <span>Receipt ID</span>
                <div className="rcReceipt">
                  <b>{receiptData.receiptId}</b>
                  <button className="rcCopy" type="button" onClick={copyReceipt}>
                    <FiClipboard /> Copy
                  </button>
                </div>
              </div>

              <div className="rcRow">
                <span>Customer</span>
                <b>{receiptData.customerName || "—"}</b>
              </div>

              <div className="rcRow">
                <span>Phone</span>
                <b>{receiptData.customerPhone || "—"}</b>
              </div>

              <div className="rcRow">
                <span>Items</span>
                <b>{receiptData.itemsCount}</b>
              </div>

              <div className="rcRow rcTotal">
                <span>Total</span>
                <b>Rs : {Number(receiptData.total || 0).toFixed(2)}</b>
              </div>
            </div>

            <div className="rcActions">
              <button className="rcBtn ghost" onClick={() => nav("/")}>
                Continue Shopping
              </button>

              <button className="rcBtn" onClick={() => nav("/profile")}>
                View My Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
