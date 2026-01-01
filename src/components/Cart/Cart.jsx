import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiClipboard,
} from "react-icons/fi";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "./Cart.css";

export default function Cart({
  cartItems = [],
  onInc = () => {},
  onDec = () => {},
  onRemove = () => {},
  onCheckoutDone = () => {},
}) {
  const nav = useNavigate();
  const location = useLocation();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  const makeReceiptId = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
    return `RCP-${yyyy}${mm}${dd}-${rand}`;
  };

  const downloadReceipt = (data, items) => {
    try {
      const now = new Date();
      const dateStr = now.toLocaleString();

      const rows = (items || [])
        .map(
          (i) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">${i.name}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs ${Number(i.price || 0).toFixed(2)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs ${(Number(i.price || 0) * Number(i.qty || 0)).toFixed(2)}</td>
          </tr>
        `
        )
        .join("");

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${data.receiptId}</title>
</head>
<body style="font-family:Arial, sans-serif;background:#f6f7fb;margin:0;padding:24px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:16px;overflow:hidden;">
    <div style="padding:18px 20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;">
      <h2 style="margin:0;">ShopHub Receipt</h2>
      <div style="opacity:.9;margin-top:6px;">${dateStr}</div>
    </div>

    <div style="padding:18px 20px;">
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;">
        <div>
          <div style="font-size:12px;color:#64748b;font-weight:700;">Receipt ID</div>
          <div style="font-size:16px;font-weight:900;color:#0f172a;">${data.receiptId}</div>
        </div>
        
      </div>

      <div style="margin-top:16px;display:grid;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(15,23,42,.10);border-radius:12px;">
          <div style="font-size:12px;color:#64748b;font-weight:800;">Customer</div>
          <div style="font-weight:900;color:#0f172a;margin-top:4px;">${data.customerName || "—"}</div>
          <div style="color:#334155;margin-top:6px;"><b>Phone:</b> ${data.customerPhone || "—"}</div>
          <div style="color:#334155;margin-top:4px;"><b>Email:</b> ${data.userEmail || "—"}</div>
        </div>
      </div>

      <h3 style="margin:18px 0 10px;color:#0f172a;">Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;color:#64748b;">Product</th>
            <th style="text-align:center;padding:10px;border-bottom:1px solid #eee;color:#64748b;">Qty</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #eee;color:#64748b;">Price</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #eee;color:#64748b;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;display:grid;gap:6px;">
        <div style="display:flex;justify-content:space-between;color:#334155;font-weight:800;">
          <span>Items</span><span>${data.itemsCount}</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:#0f172a;font-weight:1000;font-size:16px;margin-top:6px;">
          <span>Total</span><span style="color:#6d28d9;">Rs ${Number(data.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.receiptId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleCheckout = async () => {
    setMsg("");

    const user = auth.currentUser;

    // ✅ ONLY HERE we check login
    if (!user) {
      nav("/signin", { state: { redirectTo: location.pathname } });
      return;
    }

    if (cartItems.length === 0) return;

    try {
      setSaving(true);

      let customerName = "";
      let customerPhone = "";

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          customerName = u.name || "";
          customerPhone = u.phone || "";
        }
      } catch {}

      const receiptId = makeReceiptId();

      const orderItems = cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price || 0),
        qty: Number(i.qty || 1),
        image: i.image || i.imageUrl || "",
      }));

      const order = {
        receiptId,
        userId: user.uid,
        userEmail: user.email || "",
        customer: { name: customerName, phone: customerPhone },
        items: orderItems,
        itemsCount,
        subtotal,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), order);

      onCheckoutDone();

      const payload = {
        receiptId,
        customerName,
        customerPhone,
        userEmail: user.email || "",
        total,
        subtotal,
        itemsCount,
      };

      setReceiptData(payload);
      setShowPopup(true);

      downloadReceipt(payload, orderItems);
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
    } catch {
      setMsg("❌ Copy failed");
      setTimeout(() => setMsg(""), 1500);
    }
  };

  return (
    <>
      <section className="cartPage">
        <div className="cartWrap">
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
                        <button className="qtyBtn" type="button" onClick={() => onDec(item)}>
                          <FiMinus />
                        </button>
                        <div className="qtyVal">{item.qty || 1}</div>
                        <button className="qtyBtn" type="button" onClick={() => onInc(item)}>
                          <FiPlus />
                        </button>
                      </div>

                      <div className="cartItemRight">
                        <div className="cartItemTotal">
                          Rs : {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                        </div>

                        <button className="removeBtn" type="button" onClick={() => onRemove(item)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="cartRight">
              <div className="summaryCard">
                <h3>Order Summary</h3>

                <div className="sumRow">
                  <span>Subtotal ({itemsCount} items)</span>
                  <span>Rs : {subtotal.toFixed(2)}</span>
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
              </div>
            </aside>
          </div>
        </div>
      </section>

      {showPopup && receiptData && (
        <div className="rcOverlay" onClick={() => setShowPopup(false)} role="presentation">
          <div className="rcModal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="rcClose" type="button" onClick={() => setShowPopup(false)}>
              <FiX />
            </button>

            <div className="rcTop">
              <div className="rcIcon">
                <FiCheckCircle />
              </div>
              <div>
                <h3>Order Placed Successfully</h3>
                <p>Receipt downloaded automatically. Your order is pending.</p>
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
