import React from 'react';
import { FiSearch } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

const SearchBar = ({
  placeholder,
  value,
  onChange,
  className = "",
  variant = "default", // "default" | "compact"
  rightElementClass = ""
}) => {

  const getInputStyles = () => {
    const baseStyles = "w-full bg-background placeholder:text-tertiary text-primary rounded-md border border-[rgb(var(--background-secondary-color))] focus:outline-none";
    const variantStyles = variant === "compact"
      ? "py-1.5 pl-8 pr-3 text-sm focus:border-zinc-500"
      : "p-2 pl-9 focus:border-zinc-500";

    // Add right padding if specified
    const rightPadding = rightElementClass ? " " + rightElementClass : " pr-8";

    return baseStyles + " " + variantStyles + rightPadding;
  };

  return (
    <div className={`relative ` + className}>
      <FiSearch
        className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
        aria-hidden="true"
        size={variant === "compact" ? 14 : 16}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={getInputStyles()}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-tertiary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-full"
          aria-label="Clear search"
        >
          <IoMdClose aria-hidden="true" size={variant === "compact" ? 14 : 16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;