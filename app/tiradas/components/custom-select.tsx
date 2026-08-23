"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./tiradas-laterales.module.css";

export type CustomSelectOption = {
  id: string;
  label: string;
  disabled?: boolean;
  meta?: string;
};

type CustomSelectProps = {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function CustomSelect({ value, options, onChange, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.customSelectContainer} ref={containerRef}>
      <button
        type="button"
        className={styles.sidePanelSelect}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundImage: "none", paddingRight: "12px" }}
      >
        <span>
          {selectedOption ? selectedOption.label : "Selecciona..."}
          {selectedOption && selectedOption.meta ? ` • ${selectedOption.meta}` : ""}
        </span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="#D7AD69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <ul className={styles.customSelectDropdown}>
          {options.map((option) => (
            <li
              key={option.id}
              className={`${styles.customSelectOption} ${value === option.id ? styles.customSelectOptionActive : ""} ${
                option.disabled ? styles.customSelectOptionDisabled : ""
              }`}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.id);
                  setIsOpen(false);
                }
              }}
            >
              <span>{option.label}</span>
              {option.meta && <span style={{ opacity: 0.7, fontSize: "0.8em" }}>{option.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
