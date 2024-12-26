import { FaFilter } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

const SearchBar = ({ placeholder, value, onChange }) => {
  return (
    <div className="relative">
      <FaFilter
        className="absolute left-3 top-1/2 -translate-y-1/2 text-opposite-secondary"
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full my-4 p-2 pl-10 pr-10 bg-background-secondary text-primary rounded-md border border-zinc-700 focus:outline-none focus:border-zinc-500"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-opposite-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-full"
          aria-label="Clear search"
        >
          <IoMdClose aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;