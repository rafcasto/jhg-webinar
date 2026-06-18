import React from "react";
import RegistrationForm from "./RegistrationForm.jsx";

export default function SignupModal({ events = [], content = {}, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        <RegistrationForm events={events} content={content} plain onDone={onClose} />
      </div>
    </div>
  );
}
