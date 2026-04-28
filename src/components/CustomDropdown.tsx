"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  key: string;
  name: string;
}

interface CustomDropdownProps {
  options: readonly Option[] | Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  icon,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`custom-dropdown-root ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`custom-dropdown-trigger ${isOpen ? "active" : ""}`}
        type="button"
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          {selectedOption?.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-in fade-in zoom-in-95 duration-200">
          <div className="custom-dropdown-scroll">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onChange(option.key);
                  setIsOpen(false);
                }}
                className={`custom-dropdown-item ${option.key === value ? "selected" : ""}`}
              >
                {option.name}
                {option.key === value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
