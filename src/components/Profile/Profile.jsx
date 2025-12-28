import React from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit } from "react-icons/fi";
import "./Profile.css";

/*
  You can later replace this object with Firebase Auth user data:
  const user = auth.currentUser;
*/
const user = {
  name: "Nehan Perera",
  email: "nehan@email.com",
  phone: "+94 77 123 4567",
  address: "Colombo, Sri Lanka",
  role: "Customer",
};

export default function Profile() {
  return (
    <div className="pfWrap">
      <div className="pfInner">
        {/* Header */}
        <div className="pfHeader">
          <div className="pfAvatar">
            <FiUser />
          </div>

          <div className="pfHeaderInfo">
            <h2>{user.name}</h2>
            <span className="pfRole">{user.role}</span>
          </div>

          <button className="pfEditBtn">
            <FiEdit /> Edit
          </button>
        </div>

        {/* Info Card */}
        <div className="pfCard">
          <div className="pfRow">
            <FiMail />
            <div>
              <label>Email</label>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="pfRow">
            <FiPhone />
            <div>
              <label>Phone</label>
              <p>{user.phone}</p>
            </div>
          </div>

          <div className="pfRow">
            <FiMapPin />
            <div>
              <label>Address</label>
              <p>{user.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
