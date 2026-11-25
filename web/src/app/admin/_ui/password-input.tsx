"use client";

import { useState, type InputHTMLAttributes } from "react";

/** Champ mot de passe de l'espace équipe, avec un œil pour voir ce que l'on tape. */
export function PasswordInput({
  wrapperClassName = "",
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { wrapperClassName?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`relative ${wrapperClassName}`}>
      <input {...props} type={shown ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-1.5 my-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {shown ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.4.8-1.4 2.3-3 3.6M6.5 7.6C4.5 9 3.3 10.8 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2.5 12c1-1.8 4.5-6 9.5-6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6s-8.5-4.2-9.5-6z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
