import React from "react";

export function Button({ variant = "primary", size, block, children, ...rest }) {
  const cls = `btn btn--${variant}${size ? " btn--" + size : ""}${block ? " btn--block" : ""}`;
  if (rest.href) return <a className={cls} {...rest}>{children}</a>;
  return <button className={cls} {...rest}>{children}</button>;
}

export function Portrait({ initials, size, src, alt }) {
  const cls = "portrait" + (size === "lg" ? " portrait--lg" : "") + (src ? " portrait--photo" : "");
  if (src) return <div className={cls}><img src={src} alt={alt || initials || ""} /></div>;
  return <div className={cls}>{initials}</div>;
}

export function Eyebrow({ children }) {
  return <span className="eyebrow">{children}</span>;
}

export function SectionHead({ eyebrow, title, lede }) {
  return (
    <div className="section__head">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className="section__title" dangerouslySetInnerHTML={{ __html: title }} />}
      {lede && <p className="section__lede">{lede}</p>}
    </div>
  );
}
