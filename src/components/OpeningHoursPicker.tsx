import { useState, useEffect, useCallback } from "react";
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

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/** Serialize schedule to a human-readable string for the backend */
function serializeSchedule(schedule: WeekSchedule): string {
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

  const toggleDay = (day: DayKey) => {
    updateDay(day, { open: !schedule[day].open });
  };

  const summary = serializeSchedule(schedule);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-md border bg-card divide-y">
        {DAYS.map((day) => {
          const s = schedule[day.key];
          return (
            <div key={day.key} className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2">
              <button
                type="button"
                onClick={() => toggleDay(day.key)}
                className={cn(
                  "shrink-0 w-10 text-center rounded-md py-1 text-xs font-semibold transition-colors",
                  s.open
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {day.short}
              </button>
              {s.open ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    type="time"
                    value={s.from}
                    onChange={(e) => updateDay(day.key, { from: e.target.value })}
                    className="h-8 w-full max-w-[110px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">–</span>
                  <input
                    type="time"
                    value={s.to}
                    onChange={(e) => updateDay(day.key, { to: e.target.value })}
                    className="h-8 w-full max-w-[110px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Closed</span>
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
