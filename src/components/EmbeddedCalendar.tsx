import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import "react-day-picker/dist/style.css";

interface EmbeddedCalendarProps {
  selectedDate?: Date;
  onSelect: (date: Date | undefined) => void;
}

const timezones = [
  { value: "America/New_York", label: "EST", offset: -5 },
  { value: "America/Chicago", label: "CST", offset: -6 },
  { value: "America/Denver", label: "MST", offset: -7 },
  { value: "America/Los_Angeles", label: "PST", offset: -8 },
  { value: "UTC", label: "UTC", offset: 0 },
];

export function EmbeddedCalendar({
  selectedDate,
  onSelect,
}: EmbeddedCalendarProps) {
  const [selectedTimezone, setSelectedTimezone] = useState("America/New_York");
  const [month, setMonth] = useState(selectedDate || new Date());
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "MM/dd/yyyy"));
      setMonth(selectedDate);
    } else {
      setInputValue("");
    }
  }, [selectedDate]);

  const handleDayPickerSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue("");
      onSelect(undefined);
    } else {
      setInputValue(format(date, "MM/dd/yyyy"));
      setMonth(date);
      onSelect(date);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Parse the input value and update the calendar month
    const parsedDate = parse(e.target.value, "MM/dd/yyyy", new Date());

    if (isValid(parsedDate)) {
      setMonth(parsedDate);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsedDate = parse(inputValue, "MM/dd/yyyy", new Date());
      if (isValid(parsedDate)) {
        onSelect(parsedDate);
      }
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    handleDayPickerSelect(today);
  };

  const handleClearClick = () => {
    handleDayPickerSelect(undefined);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimezone(e.target.value);
  };

  const currentTimezone = timezones.find((tz) => tz.value === selectedTimezone);

  return (
    <div className="embedded-calendar bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Header with timezone */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Date</h3>
        <select
          value={selectedTimezone}
          onChange={handleTimezoneChange}
          className="text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date input field */}
      <div className="mb-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="MM/DD/YYYY"
          autoComplete="off"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1 text-center">
          Type a date or use the calendar below
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-md p-3 w-full">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDayPickerSelect}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          fixedWeeks
          className="rdp-embedded w-full"
          style={{ width: "100%" }}
        />
      </div>

      {/* Action buttons and timezone info */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTodayClick}
            className="text-xs px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleClearClick}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {currentTimezone &&
            `${currentTimezone.label} (UTC${currentTimezone.offset >= 0 ? "+" : ""}${currentTimezone.offset})`}
        </div>
      </div>

      {/* Custom styles for embedded calendar */}
      <style>{`
        .embedded-calendar .rdp {
          margin: 0;
          --rdp-accent-color: #3b82f6;
          --rdp-accent-background-color: #3b82f6;
          --rdp-day-width: calc((100% - 12px) / 7);
          --rdp-day-height: calc((100% - 12px) / 7);
          --rdp-day_button-width: calc((100% - 12px) / 7 - 2px);
          --rdp-day_button-height: calc((100% - 12px) / 7 - 2px);
          --rdp-day_button-border-radius: 6px;
          font-size: clamp(12px, 2.5vw, 14px);
          width: 100%;
          height: auto;
        }

        .embedded-calendar .rdp-months {
          width: auto;
          display: flex;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
        }

        .embedded-calendar .rdp-month {
          /* Remove width: 100% and max-width: none to allow natural sizing */
        }

        .embedded-calendar .rdp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0 12px 0;
          margin-bottom: 8px;
          width: 100%;
        }

        .embedded-calendar .rdp-caption_label {
          font-size: clamp(14px, 3vw, 16px);
          font-weight: 600;
          color: #1f2937;
        }

        .embedded-calendar .rdp-nav {
          display: flex;
          gap: 4px;
        }

        .embedded-calendar .rdp-nav_button {
          width: clamp(24px, 5vw, 32px);
          height: clamp(24px, 5vw, 32px);
          border-radius: 4px;
          transition: background-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .embedded-calendar .rdp-nav_button:hover {
          background-color: #f3f4f6;
        }

        .embedded-calendar .rdp-head_cell {
          font-size: clamp(10px, 2vw, 12px);
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          padding: 0;
          width: calc((100% - 12px) / 7);
          height: clamp(20px, 4vw, 28px);
        }

        .embedded-calendar .rdp-day {
          width: calc((100% - 12px) / 7);
          height: calc((100% - 12px) / 7);
          font-size: clamp(12px, 2.5vw, 14px);
          border-radius: 6px;
          transition: all 0.15s ease;
          min-width: 32px;
          min-height: 32px;
        }

        .embedded-calendar .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #f3f4f6;
        }

        .embedded-calendar .rdp-day_today:not(.rdp-day_selected) {
          background-color: #f3f4f6;
          color: #1f2937;
          font-weight: 600;
          position: relative;
        }

        .embedded-calendar .rdp-day_today:not(.rdp-day_selected)::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background-color: #3b82f6;
          border-radius: 50%;
        }

        .embedded-calendar .rdp-day_selected {
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .embedded-calendar .rdp-day_selected:hover {
          background-color: #2563eb;
        }

        .embedded-calendar .rdp-day_outside {
          color: #d1d5db;
          opacity: 0.5;
        }

        .embedded-calendar .rdp-day_disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }

        .embedded-calendar .rdp-table {
          width: 100%;
          margin: 0;
          table-layout: fixed;
        }

        .embedded-calendar .rdp-tbody {
          border: none;
        }

        .embedded-calendar .rdp-row {
          margin: 0;
        }

        .embedded-calendar .rdp-cell {
          padding: 1px;
          text-align: center;
          width: calc((100% - 12px) / 7);
        }

        /* Responsive adjustments for smaller screens */
        @media (max-width: 640px) {
          .embedded-calendar .rdp {
            --rdp-day-width: 40px;
            --rdp-day-height: 40px;
            --rdp-day_button-width: 38px;
            --rdp-day_button-height: 38px;
          }
          
          .embedded-calendar .rdp-day {
            min-width: 40px;
            min-height: 40px;
          }
          
          .embedded-calendar .rdp-head_cell {
            min-width: 40px;
            min-height: 24px;
          }
        }
      `}</style>
    </div>
  );
}
