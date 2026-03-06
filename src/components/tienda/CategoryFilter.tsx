"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { CATEGORIES } from "@/constants/categories";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const CategoryFilter = ({
  selectedCategory,
  onCategorySelect,
}: CategoryFilterProps) => {
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const toggleParent = (parent: string) => {
    setExpandedParent(expandedParent === parent ? null : parent);
  };

  const isActive = (cat: string) => selectedCategory === cat;

  return (
    <>
      {/* Desktop: sidebar accordion */}
      <aside className="hidden md:block w-56 shrink-0">
        <h3 className="font-bold text-sm uppercase tracking-wider text-text-inverted/60 mb-3">
          Categorias
        </h3>
        <button
          onClick={() => onCategorySelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            !selectedCategory
              ? "bg-primary/10 text-primary font-semibold"
              : "text-text-inverted/70 hover:bg-gray-100"
          }`}
        >
          Todas
        </button>

        {Object.entries(CATEGORIES).map(([parent, subs]) => (
          <div key={parent} className="mb-1">
            <button
              onClick={() => toggleParent(parent)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-text-inverted/80 hover:bg-gray-100 transition-colors"
            >
              {parent}
              <FaChevronDown
                className={`w-3 h-3 transition-transform ${
                  expandedParent === parent ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandedParent === parent ? "max-h-60" : "max-h-0"
              }`}
            >
              {subs.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onCategorySelect(sub)}
                  className={`w-full text-left pl-7 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive(sub)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text-inverted/60 hover:bg-gray-50"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Mobile: horizontal pills */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => onCategorySelect(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-primary text-white"
              : "bg-white text-text-inverted/70 border border-gray-200"
          }`}
        >
          Todas
        </button>
        {Object.values(CATEGORIES)
          .flat()
          .map((sub) => (
            <button
              key={sub}
              onClick={() => onCategorySelect(sub)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive(sub)
                  ? "bg-primary text-white"
                  : "bg-white text-text-inverted/70 border border-gray-200"
              }`}
            >
              {sub}
            </button>
          ))}
      </div>
    </>
  );
};

export default CategoryFilter;
