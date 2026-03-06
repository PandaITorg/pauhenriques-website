"use client";

import { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const SearchBar = ({
  onSearch,
  placeholder = "Buscar productos...",
}: SearchBarProps) => {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, onSearch]);

  return (
    <div className="relative w-full max-w-md">
      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-inverted/40 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-2.5 rounded-full bg-white border border-gray-200 text-text-inverted text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-inverted/40 hover:text-text-inverted p-1"
          aria-label="Limpiar busqueda"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
