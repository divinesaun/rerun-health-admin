import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type WeekSchedule = Record<DayKey, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { open: true, from: "08:00", to: "18:00" },
  tue: { open: true, from: "08:00", to: "18:00" },
  wed: { open: true, from: "08:00", to: "18:00" },
  thu: { open: true, from: "08:00", to: "18:00" },
  fri: { open: true, from: "08:00", to: "18:00" },
  sat: { open: true, from: "08:00", to: "13:00" },
  sun: { open: false, from: "08:00", to: "13:00" },
};

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ["00", "30"]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/** Serialize schedule to a human-readable string for the backend */
function serializeSchedule(schedule: WeekSchedule): string {
  // Group consecutive days with the same hours
  const groups: { days: string[]; from: string; to: string }[] = [];
  const closedDays: string[] = [];

  for (const day of DAYS) {
    const s = schedule[day.key];
    if (!s.open) {
      closedDays.push(day.short);
      continue;
    }
    const last = groups[groups.length - 1];
    if (last && last.from === s.from && last.to === s.to) {
      last.days.push(day.short);
    } else {
      groups.push({ days: [day.short], from: s.from, to: s.to });
    }
  }

  const parts = groups.map((g) => {
    const dayRange = g.days.length > 2
      ? `${g.days[0]}-${g.days[g.days.length - 1]}`
      : g.days.join(", ");
    return `${dayRange} ${formatTime(g.from)}-${formatTime(g.to)}`;
  });

  if (closedDays.length > 0 && closedDays.length < 7) {
    const closedRange = closedDays.length > 2
      ? `${closedDays[0]}-${closedDays[closedDays.length - 1]}`
      : closedDays.join(", ");
    parts.push(`${closedRange} Closed`);
  }

  return parts.join("; ");
}

/** Try to parse a serialized string back to schedule, fallback to defaults */
function parseSchedule(value: string): WeekSchedule {
  if (!value) return { ...DEFAULT_SCHEDULE };

  // Try JSON first
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed.mon !== undefined) {
      return parsed as WeekSchedule;
    }
  } catch {
    // Not JSON, use defaults
  }

  return { ...DEFAULT_SCHEDULE };
}

interface OpeningHoursPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function OpeningHoursPicker({ value, onChange, className }: OpeningHoursPickerProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => parseSchedule(value));

  const emitChange = useCallback((newSchedule: WeekSchedule) => {
    // Store as JSON for lossless round-trips, but the display string is generated on read
    onChange(JSON.stringify(newSchedule));
  }, [onChange]);

  // Sync from external value changes
  useEffect(() => {
    const parsed = parseSchedule(value);
    setSchedule(parsed);
  }, [value]);

  const updateDay = (day: DayKey, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => {
      const next = { ...prev, [day]: { ...prev[day], ...updates } };
      emitChange(next);
      return next;
    });
  };

  const summary = serializeSchedule(schedule);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-md border bg-card">
        {DAYS.map((day, i) => {
          const s = schedule[day.key];
          return (
            <div
              key={day.key}
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                i < DAYS.length - 1 && "border-b"
              )}
            >
              <Switch
                checked={s.open}
                onCheckedChange={(open) => updateDay(day.key, { open })}
                className="shrink-0"
              />
              <Label className="w-10 text-xs font-medium shrink-0">
                {day.short}
              </Label>
              {s.open ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Select value={s.from} onValueChange={(v) => updateDay(day.key, { from: v })}>
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIMES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {formatTime(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">to</span>
                  <Select value={s.to} onValueChange={(v) => updateDay(day.key, { to: v })}>
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIMES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {formatTime(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Closed</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{summary}</p>
    </div>
  );
}

/** Helper to get a display string from the stored value */
export function formatOpeningHours(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed.mon !== undefined) {
      return serializeSchedule(parsed as WeekSchedule);
    }
  } catch {
    // Already a plain string
  }
  return value;
}
