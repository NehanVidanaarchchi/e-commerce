import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrash2, FiMinus, FiPlus } from "react-icons/fi";
import "./Cart.css";

export default function Cart({
  cartItems = [],
  onInc = () => {},
  onDec = () => {},
  onRemove = () => {},
  onCheckout = () => {},
}) {
  const nav = useNavigate();

  const { itemsCount, subtotal } = useMemo(() => {
    const count = cartItems.reduce((a, i) => a + Number(i.qty || 0), 0);
    const sub = cartItems.reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
      0
    );
    return { itemsCount: count, subtotal: sub };
  }, [cartItems]);

  const total = subtotal; // shipping free, tax at checkout (like screenshot)

  return (
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
                        Rs : {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
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
                onClick={onCheckout}
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </button>

              <div className="sumNote">
                🚚 <span>Free shipping on all orders</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
