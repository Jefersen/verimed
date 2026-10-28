import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih salah satu...",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  icon,
  align = "auto",
  placement = "auto",
  matchWidth = true,
  id,
  "aria-label": ariaLabel,
  onOpenChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [computedAlign, setComputedAlign] = useState("left");
  const containerRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const selectedOption = options.find((opt) => opt.value === value);
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };
  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (placement === "bottom") {
      setOpenUpward(false);
    } else if (placement === "top") {
      setOpenUpward(true);
    } else {
      const modalParent = containerRef.current.closest(
        '[role="dialog"], .rounded-3xl, .overflow-y-auto'
      );
      const windowSpaceBelow = window.innerHeight - rect.bottom;
      const parentSpaceBelow = modalParent ? modalParent.getBoundingClientRect().bottom - rect.bottom : windowSpaceBelow;
      const effectiveSpaceBelow = Math.min(windowSpaceBelow, parentSpaceBelow);
      const spaceAbove = modalParent ? rect.top - modalParent.getBoundingClientRect().top : rect.top;
      if (effectiveSpaceBelow < 180 && spaceAbove > effectiveSpaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    if (!matchWidth) {
      if (align === "right") {
        setComputedAlign("right");
      } else if (align === "left") {
        setComputedAlign("left");
      } else {
        if (rect.left + 320 > window.innerWidth - 20) {
          setComputedAlign("right");
        } else {
          setComputedAlign("left");
        }
      }
    }
  }, [isOpen, align, matchWidth]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);
  const handleSelect = (optValue) => {
    onChange(optValue);
    handleClose();
  };
  return <div
    ref={containerRef}
    className={`relative ${isOpen ? "z-40" : "z-10"} ${className}`}
  >
      {
    /* Trigger Button */
  }
      <button
    type="button"
    id={selectId}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={ariaLabel || placeholder}
    disabled={disabled}
    onClick={handleToggle}
    className={`w-full px-3 py-2 text-xs border rounded-xl bg-white transition-all flex items-center justify-between gap-2.5 text-left group shadow-2xs ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" : isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" : "border-slate-200/90 hover:border-slate-300 text-slate-800"} ${buttonClassName}`}
  >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption ? <div className="flex items-center gap-2 min-w-0">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate font-semibold text-slate-800">
                {selectedOption.label}
              </span>
              {selectedOption.badge && <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${selectedOption.badgeColor || "bg-emerald-100 text-emerald-800"}`}
  >
                  {selectedOption.badge}
                </span>}
            </div> : <span className="text-slate-400 truncate">{placeholder}</span>}
        </div>

        <ChevronDown
    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ease-out group-hover:text-slate-600 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
  />
      </button>

      {
    /* Floating Animated Dropdown Menu */
  }
      <AnimatePresence>
        {isOpen && <motion.div
    initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
    role="listbox"
    tabIndex={-1}
    className={`absolute ${openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"} ${matchWidth ? "left-0 right-0 w-full" : `${computedAlign === "right" ? "right-0" : "left-0"} min-w-full w-max max-w-[min(90vw,480px)]`} z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-400/20 p-2 overflow-x-hidden max-h-64 overflow-y-auto space-y-1 outline-none focus:outline-none ${menuClassName}`}
  >
            {options.map((opt) => {
    const isSelected = opt.value === value;
    return <div
      key={String(opt.value)}
      role="option"
      aria-selected={isSelected}
      onClick={() => handleSelect(opt.value)}
      className={`p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2.5 cursor-pointer ${isSelected ? "bg-emerald-50/90 text-emerald-950 font-semibold border border-emerald-200/70 shadow-2xs" : "text-slate-700 hover:bg-slate-50/90 hover:text-slate-900 border border-transparent"}`}
    >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {opt.icon && <span className="text-slate-500 shrink-0 mt-0.5">{opt.icon}</span>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
      className={`font-semibold ${isSelected ? "text-emerald-950 font-bold" : "text-slate-800"}`}
    >
                          {opt.label}
                        </span>
                        {opt.badge && <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${opt.badgeColor || (isSelected ? "bg-emerald-200 text-emerald-900" : "bg-slate-100 text-slate-600")}`}
    >
                            {opt.badge}
                          </span>}
                      </div>
                      {opt.description && <p
      className={`text-[11px] mt-1 leading-snug whitespace-normal break-words ${isSelected ? "text-emerald-800/90" : "text-slate-500"}`}
    >
                          {opt.description}
                        </p>}
                    </div>
                  </div>

                  {isSelected && <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 ml-1.5 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>}
                </div>;
  })}
          </motion.div>}
      </AnimatePresence>
    </div>;
}
export {
  CustomSelect
};
