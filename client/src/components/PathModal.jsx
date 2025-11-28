import React, { useState } from "react";

function PathModal({ path, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Full Path</h2>
        <div className="path-display" style={{ marginTop: "20px", fontSize: "16px" }}>
          {path.map((item, index) => (
            <span key={item._id || index}>
              <span className="path-item">{item.name}</span>
              {index < path.length - 1 && <span className="path-separator"> / </span>}
            </span>
          ))}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PathModal;
