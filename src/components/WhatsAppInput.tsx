import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Try to match known country codes (longest first)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const cleaned = value.replace(/\s/g, "");

  for (const cc of sorted) {
    if (cleaned.startsWith(cc.code)) {
      return { countryCode: cc.code, number: cleaned.slice(cc.code.length) };
    }
  }

  // If starts with +, extract code
  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^(\+\d{1,3})(.*)/);
    if (match) return { countryCode: match[1], number: match[2] };
  }

  return { countryCode: "+263", number: cleaned };
}

function formatLocalNumber(num: string): string {
  // Remove non-digits
  const digits = num.replace(/\D/g, "");
  // Format as groups: XX XXX XXXX
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function WhatsAppInput({ value, onChange, placeholder, className }: WhatsAppInputProps) {
  const parsed = parsePhoneNumber(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.number);

  useEffect(() => {
    const p = parsePhoneNumber(value);
    setCountryCode(p.countryCode);
    setLocalNumber(p.number);
  }, [value]);

  const emitChange = (code: string, num: string) => {
    const digits = num.replace(/\D/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    onChange(`${code}${digits}`);
  };

  const handleCodeChange = (code: string) => {
    setCountryCode(code);
    emitChange(code, localNumber);
  };

  const handleNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setLocalNumber(digits);
    emitChange(countryCode, digits);
  };

  const selectedCC = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <div className={cn("flex gap-1.5", className)}>
      <Select value={countryCode} onValueChange={handleCodeChange}>
        <SelectTrigger className="h-10 w-[110px] shrink-0 text-xs">
          <SelectValue>
            {selectedCC ? `${selectedCC.flag} ${selectedCC.code}` : countryCode}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {COUNTRY_CODES.map((cc) => (
            <SelectItem key={cc.country} value={cc.code} className="text-xs">
              <span className="mr-1.5">{cc.flag}</span>
              {cc.code} {cc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={formatLocalNumber(localNumber)}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder || "77 123 4567"}
        className="flex-1"
      />
    </div>
  );
}
