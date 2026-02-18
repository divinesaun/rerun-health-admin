import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+263", country: "ZW", flag: "🇿🇼", label: "Zimbabwe" },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa" },
  { code: "+258", country: "MZ", flag: "🇲🇿", label: "Mozambique" },
  { code: "+260", country: "ZM", flag: "🇿🇲", label: "Zambia" },
  { code: "+267", country: "BW", flag: "🇧🇼", label: "Botswana" },
  { code: "+265", country: "MW", flag: "🇲🇼", label: "Malawi" },
  { code: "+255", country: "TZ", flag: "🇹🇿", label: "Tanzania" },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya" },
  { code: "+234", country: "NG", flag: "🇳🇬", label: "Nigeria" },
  { code: "+233", country: "GH", flag: "🇬🇭", label: "Ghana" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States" },
] as const;

function parsePhoneNumber(value: string): { countryCode: string; number: string } {
  if (!value) return { countryCode: "+263", number: "" };

  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const cleaned = value.replace(/\s/g, "");

  for (const cc of sorted) {
    if (cleaned.startsWith(cc.code)) {
      return { countryCode: cc.code, number: cleaned.slice(cc.code.length) };
    }
  }

  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^(\+\d{1,3})(.*)/);
    if (match) return { countryCode: match[1], number: match[2] };
  }

  return { countryCode: "+263", number: cleaned };
}

function formatLocalNumber(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function WhatsAppInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const parsed = parsePhoneNumber(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parsePhoneNumber(value);
    setCountryCode(p.countryCode);
    setLocalNumber(p.number);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emitChange = (code: string, num: string) => {
    const digits = num.replace(/\D/g, "");
    if (!digits) { onChange(""); return; }
    onChange(`${code}${digits}`);
  };

  const handleCodeSelect = (code: string) => {
    setCountryCode(code);
    emitChange(code, localNumber);
    setDropdownOpen(false);
  };

  const handleNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setLocalNumber(digits);
    emitChange(countryCode, digits);
  };

  const selectedCC = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <div ref={wrapperRef} className={cn("relative flex", className)}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1 shrink-0 rounded-l-md border border-r-0 border-input bg-muted/50 px-2 text-xs h-10 hover:bg-muted transition-colors"
      >
        <span>{selectedCC?.flag ?? "🌍"}</span>
        <span className="font-medium">{countryCode}</span>
        <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>
      {dropdownOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover shadow-lg max-h-52 overflow-y-auto">
          {COUNTRY_CODES.map((cc) => (
            <button
              key={cc.country}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                cc.code === countryCode && "bg-accent"
              )}
              onClick={() => handleCodeSelect(cc.code)}
            >
              <span>{cc.flag}</span>
              <span className="font-medium">{cc.code}</span>
              <span className="text-muted-foreground text-xs">{cc.label}</span>
            </button>
          ))}
        </div>
      )}
      <input
        type="tel"
        inputMode="numeric"
        value={formatLocalNumber(localNumber)}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder || "77 123 4567"}
        className="flex-1 min-w-0 h-10 rounded-r-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

export { WhatsAppInput as PhoneInput };
