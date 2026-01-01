// src/components/Profile/Profile.jsx
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
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import "./Profile.css";

export default function Profile() {
  const nav = useNavigate();

  const [user, setUser] = useState(null); // {uid,email,name,phone}
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    let unsubOrders = null;

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      // cleanup previous order listener when auth changes
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }

      if (!u) {
        nav("/signin", { replace: true });
        return;
      }

      setLoadingOrders(true);
      setOrdersError("");

      // ✅ Read name + phone from Firestore users/{uid}
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
      } catch (e) {
        // ignore (still allow profile)
      }

      setUser({
        uid: u.uid,
        email: u.email || "",
        name,
        phone,
      });

      // ✅ Orders query (requires composite index: userId Asc + createdAt Desc)
      const qOrders = query(
        collection(db, "orders"),
        where("userId", "==", u.uid),
        orderBy("createdAt", "desc")
      );

      unsubOrders = onSnapshot(
        qOrders,
        (snap) => {
          setOrders(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
          );
          setLoadingOrders(false);
        },
        (err) => {
          console.error("Orders listener error:", err);
          setOrdersError(
            err?.message?.includes("requires an index")
              ? "Orders query needs a Firestore index (userId + createdAt). Create the index and refresh."
              : "Failed to load orders. Please try again."
          );
          setLoadingOrders(false);
        }
      );
    });

    return () => {
      if (unsubOrders) unsubOrders();
      unsubAuth();
    };
  }, [nav]);

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
        {/* HEADER */}
        <div className="pfHeader">
          <div className="pfAvatar">
            <FiUser />
          </div>

          <div className="pfHeaderInfo">
            <h2>{user.name || "My Profile"}</h2>
            <span className="pfRole">Customer</span>
          </div>

          <button className="pfLogoutBtn" type="button" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

        {/* INFO */}
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

        {/* ORDERS */}
        <div className="pfOrders">
          <h3>
            <FiShoppingBag /> My Orders
          </h3>

          {loadingOrders ? (
            <div className="pfLoading">Loading orders...</div>
          ) : ordersError ? (
            <div className="pfError">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="pfEmpty">No orders yet</div>
          ) : (
            <div className="pfOrderList">
              {orders.map((o) => {
                const status = String(o.status || "pending").toLowerCase();
                return (
                  <div className="pfOrderCard" key={o.id}>
                    <div className="pfOrderTop">
                      <div>
                        <span className="pfOrderId">
                          <FiClipboard /> {o.receiptId || o.id.slice(0, 8)}
                        </span>
                        <span className={`pfStatus ${status}`}>
                          {status}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
