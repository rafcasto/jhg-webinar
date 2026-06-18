import React from "react";
import RegistrationForm from "./RegistrationForm.jsx";

export default function SignupModal({ events = [], content = {}, initialIndex = 0, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        <RegistrationForm events={events} content={content} plain defaultSessionIdx={initialIndex} onDone={onClose} />
      </div>
    </div>
  );
}
