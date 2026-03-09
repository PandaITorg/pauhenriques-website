"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { CATEGORIES } from "@/constants/categories";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  activeTab?: "compra" | "catalogo";
}

const CategoryFilter = ({
  selectedCategory,
  onCategorySelect,
  activeTab = "compra",
}: CategoryFilterProps) => {
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const toggleParent = (parent: string) => {
    setExpandedParent(expandedParent === parent ? null : parent);
  };

  const isActive = (cat: string) => selectedCategory === cat;

  // Tab-aware active color
  const activePillClass =
    activeTab === "catalogo"
      ? "bg-warm-700 text-warm-50"
      : "bg-primary text-white";

  const activeSidebarClass =
    activeTab === "catalogo"
      ? "bg-warm-700/20 text-warm-300 font-semibold"
      : "bg-primary-muted text-primary font-semibold";

  return (
    <>
      {/* Desktop: sidebar accordion */}
      <aside className="hidden md:block w-56 shrink-0">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-text-main/45 mb-3">
          Categorías
        </h3>
        <button
          onClick={() => onCategorySelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            !selectedCategory
              ? activeSidebarClass
              : "text-text-main/60 hover:bg-surface-card"
          }`}
        >
          Todas
        </button>

        {Object.entries(CATEGORIES).map(([parent, subs]) => (
          <div key={parent} className="mb-1">
            <button
              onClick={() => toggleParent(parent)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-text-main/70 hover:bg-surface-card transition-colors"
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
                      ? activeSidebarClass
                      : "text-text-main/50 hover:bg-surface-card hover:text-text-main/70"
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
              ? activePillClass
              : "bg-surface-card text-text-main/60 border border-border-subtle"
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
                  ? activePillClass
                  : "bg-surface-card text-text-main/60 border border-border-subtle"
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
