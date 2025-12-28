import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiClipboard,
  FiShoppingBag,
  FiPhone,
  FiLogOut,
} from "react-icons/fi";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import "./Profile.css";

export default function Profile() {
  const nav = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let unsubOrders = null;

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        nav("/signin", { replace: true });
        return;
      }

      // 🔹 Read name + phone from Firestore
      let name = "";
      let phone = "";

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          name = data.name || "";
          phone = data.phone || "";
        }
      } catch {}

      setUser({
        uid: u.uid,
        email: u.email || "",
        name,
        phone,
      });

      // 🔹 Load orders
      const qOrders = query(
        collection(db, "orders"),
        where("userId", "==", u.uid),
        orderBy("createdAt", "desc")
      );

      unsubOrders = onSnapshot(qOrders, (snap) => {
        setOrders(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoadingOrders(false);
      });
    });

    return () => {
      if (unsubOrders) unsubOrders();
      unsubAuth();
    };
  }, [nav]);

  // ✅ LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("sh_user"); // optional
      nav("/signin", { replace: true });
    } catch (e) {
      alert("Failed to logout. Try again.");
    }
  };

  if (!user) return null;

  return (
    <div className="pfWrap">
      <div className="pfInner">
        {/* ===== HEADER ===== */}
        <div className="pfHeader">
          <div className="pfAvatar">
            <FiUser />
          </div>

          <div className="pfHeaderInfo">
            <h2>{user.name || "My Profile"}</h2>
            <span className="pfRole">Customer</span>
          </div>

          {/* ✅ LOGOUT BUTTON */}
          <button className="pfLogoutBtn" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

        {/* ===== INFO ===== */}
        <div className="pfCard">
          <div className="pfRow">
            <FiMail />
            <div>
              <label>Email</label>
              <p>{user.email || "—"}</p>
            </div>
          </div>

          <div className="pfRow">
            <FiPhone />
            <div>
              <label>Phone</label>
              <p>{user.phone || "—"}</p>
            </div>
          </div>
        </div>

        {/* ===== ORDERS ===== */}
        <div className="pfOrders">
          <h3>
            <FiShoppingBag /> My Orders
          </h3>

          {loadingOrders ? (
            <div className="pfLoading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="pfEmpty">No orders yet</div>
          ) : (
            <div className="pfOrderList">
              {orders.map((o) => (
                <div className="pfOrderCard" key={o.id}>
                  <div className="pfOrderTop">
                    <div>
                      <span className="pfOrderId">
                        <FiClipboard /> {o.receiptId || o.id.slice(0, 8)}
                      </span>
                      <span className={`pfStatus ${o.status || "pending"}`}>
                        {o.status || "pending"}
                      </span>
                    </div>

                    <div className="pfTotal">
                      Rs : {Number(o.total || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="pfItems">
                    {(o.items || []).map((i, idx) => (
                      <div className="pfItem" key={idx}>
                        <img src={i.image} alt={i.name} />
                        <div>
                          <div className="pfItemName">{i.name}</div>
                          <div className="pfItemQty">Qty: {i.qty}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
