import React from "react";
import { FiWifiOff, FiRefreshCw,  } from "react-icons/fi";

import "./Network.css";

export default function Network({
  title = "Network Error",
  message = "Looks like you're offline or the server is not reachable. Please check your internet connection and try again.",
  onRetry = null,
}) {
    
  return (
    <div className="netWrap">
      <div className="netCard">
        <div className="netIcon">
          <FiWifiOff />
        </div>

        <h2 className="netTitle">{title}</h2>
        <p className="netMsg">{message}</p>

        <div className="netActions">
          {onRetry && (
            <button className="netBtn primary" onClick={onRetry} type="button">
              <FiRefreshCw /> Retry
            </button>
          )}

        </div>

        
      </div>
    </div>
  );
}
