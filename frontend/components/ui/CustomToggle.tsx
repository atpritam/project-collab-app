"use client";

import React from "react";

interface CustomToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CustomToggle({
  id,
  checked,
  onChange,
  disabled = false,
  size = "md",
}: CustomToggleProps) {
  const sizeClasses = {
    sm: {
      button: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
    },
    md: {
      button: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
    lg: {
      button: "h-7 w-12",
      thumb: "h-6 w-6",
      translate: "translate-x-5",
    },
  };

  const { button, thumb, translate } = sizeClasses[size];

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex ${button} flex-shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out 
        focus:outline-none
        ${checked ? "bg-violet-600" : "bg-gray-200"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block ${thumb} transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? translate : "translate-x-0"}
        `}
      />
    </button>
  );
}
