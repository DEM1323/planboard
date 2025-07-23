import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import { Button } from "./ui/button";
import "react-day-picker/dist/style.css";

interface CalendarPopupProps {
  isOpen: boolean;
  selectedDate?: Date;
  onSelect: (date: Date | undefined) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  tldrawEditor?: any; // TLDraw editor instance for focus management
}

const timezones = [
  { value: "America/New_York", label: "EST", offset: -5 },
  { value: "America/Chicago", label: "CST", offset: -6 },
  { value: "America/Denver", label: "MST", offset: -7 },
  { value: "America/Los_Angeles", label: "PST", offset: -8 },
  { value: "UTC", label: "UTC", offset: 0 },
];

export function CalendarPopup({
  isOpen,
  selectedDate,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
  tldrawEditor,
}: CalendarPopupProps) {
  const [selectedTimezone, setSelectedTimezone] = useState("America/New_York");
  const [month, setMonth] = useState(selectedDate || new Date());
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalEditorFocusRef = useRef<boolean>(false);

  // Initialize input value when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "MM/dd/yyyy"));
      setMonth(selectedDate);
    } else {
      setInputValue("");
    }
  }, [selectedDate]);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure popup is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle TLDraw editor focus management (only when we have an editor)
  useEffect(() => {
    if (!tldrawEditor) return;

    if (isInputFocused) {
      // Store original focus state and blur TLDraw editor
      originalEditorFocusRef.current =
        tldrawEditor.getInstanceState()?.isFocused ?? false;
      tldrawEditor.updateInstanceState({ isFocused: false });

      // Also set editor to readonly to prevent interactions
      try {
        tldrawEditor.setCurrentTool("select");
        tldrawEditor.updateInstanceState({ isReadonly: true });
      } catch (e) {
        // Ignore errors if methods don't exist
        console.warn("TLDraw editor methods not available:", e);
      }
    } else if (!isOpen) {
      // Restore TLDraw editor focus and readonly state when calendar closes
      if (originalEditorFocusRef.current) {
        tldrawEditor.updateInstanceState({ isFocused: true });
      }

      try {
        tldrawEditor.updateInstanceState({ isReadonly: false });
      } catch (e) {
        // Ignore errors if methods don't exist
        console.warn("TLDraw editor methods not available:", e);
      }
    }
  }, [isInputFocused, isOpen, tldrawEditor]);

  if (!isOpen) return null;

  const handleDayPickerSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue("");
      onSelect(undefined);
    } else {
      setInputValue(format(date, "MM/dd/yyyy"));
      setMonth(date);
      onSelect(date);
    }
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Parse the input value and update the calendar month (but don't select yet)
    const parsedDate = parse(e.target.value, "MM/dd/yyyy", new Date());

    if (isValid(parsedDate)) {
      setMonth(parsedDate); // Navigate calendar to the typed date
      // Don't call onSelect here - wait for Enter key or calendar click
    }
  };

  const handleInputFocus = () => {
    // Only manage TLDraw focus state if we have an editor (not in modals)
    if (tldrawEditor) {
      setIsInputFocused(true);
    }
  };

  const handleInputBlur = () => {
    // Only manage TLDraw focus state if we have an editor (not in modals)
    if (tldrawEditor) {
      setIsInputFocused(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only prevent propagation of specific keys that might conflict with TLDraw shortcuts
    // and only if we have a TLDraw editor instance (not in modals)
    if (tldrawEditor) {
      // List of keys that might trigger TLDraw shortcuts
      const tldrawShortcutKeys = [
        "v",
        "s",
        "r",
        "t",
        "d",
        "a",
        "h",
        "f",
        "z",
        "y",
        "c",
        "x",
        "Delete",
        "Backspace",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Space",
      ];

      // Check if it's a shortcut combination or problematic key
      const isShortcutKey =
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        tldrawShortcutKeys.includes(e.key);

      if (isShortcutKey && e.key !== "Backspace" && e.key !== "Delete") {
        // Allow backspace and delete for normal text editing
        e.stopPropagation();
      }
    }

    if (e.key === "Enter") {
      e.stopPropagation(); // Always stop Enter to prevent form submission
      // Try to parse and set the date, then close
      const parsedDate = parse(inputValue, "MM/dd/yyyy", new Date());
      if (isValid(parsedDate)) {
        onSelect(parsedDate);
      }
      onClose();
    } else if (e.key === "Escape") {
      e.stopPropagation(); // Always stop Escape
      onClose();
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

  // Handle overlay click to close calendar (only in TLDraw context)
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentTimezone = timezones.find((tz) => tz.value === selectedTimezone);

  return (
    <>
      {/* Overlay - Different behavior for modal vs TLDraw context */}
      {tldrawEditor ? (
        // TLDraw context: Use overlay to block canvas events and handle clicks
        <div
          className="fixed inset-0"
          onClick={handleOverlayClick}
          style={{
            background: "transparent",
            pointerEvents: "all",
            zIndex: 999999999,
          }}
        />
      ) : (
        // Modal context: Minimal overlay that doesn't interfere with input
        // Click-outside handling is done by DatePickerInput component
        <div
          className="fixed inset-0"
          style={{
            background: "transparent",
            pointerEvents: "none", // Let events pass through following TLDraw pattern
            zIndex: 999999999,
          }}
        />
      )}

      {/* Calendar popup container */}
      <div
        className="absolute bg-white border border-gray-200 rounded-lg shadow-xl calendar-popup"
        style={{
          top: position.top + 8,
          left: position.left,
          minWidth: "320px",
          maxWidth: "380px",
          zIndex: 9999999999,
          pointerEvents: "all", // Following TLDraw event-blocker pattern
        }}
        // Only stop propagation if we have TLDraw editor (not in modals)
        {...(tldrawEditor
          ? {
              onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
              onPointerMove: (e: React.PointerEvent) => e.stopPropagation(),
              onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
              onClick: (e: React.MouseEvent) => e.stopPropagation(),
            }
          : {})}
      >
        {/* Header with timezone */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-900">Select Date</h3>
            <select
              value={selectedTimezone}
              onChange={handleTimezoneChange}
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onFocus={() => tldrawEditor && setIsInputFocused(true)}
              onBlur={() => tldrawEditor && setIsInputFocused(false)}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>

        {/* Date input field with proper focus management */}
        <div className="p-3 border-b border-gray-100">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onKeyUp={(e) => {
              // Only prevent keyup propagation for specific keys in TLDraw context
              if (tldrawEditor && (e.ctrlKey || e.metaKey || e.altKey)) {
                e.stopPropagation();
              }
            }}
            placeholder="MM/DD/YYYY"
            autoComplete="off"
            className="w-full px-3 py-2 border border-blue-300 rounded-md text-center font-mono bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              userSelect: "text", // Following TLDraw event-blocker pattern
              pointerEvents: "all",
            }}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            Type a date or use the calendar below
          </p>
        </div>

        {/* Calendar */}
        <div className="p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDayPickerSelect}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays
            fixedWeeks
            style={{
              margin: 0,
              fontSize: "14px",
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTodayClick}
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearClick}
              className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              Clear
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            {currentTimezone &&
              `${currentTimezone.label} (UTC${currentTimezone.offset >= 0 ? "+" : ""}${currentTimezone.offset})`}
          </div>
        </div>

        {/* Simplified CSS */}
        <style>{`
          .calendar-popup .rdp {
            margin: 0;
            --rdp-accent-color: #3b82f6;
            --rdp-accent-background-color: #3b82f6;
            --rdp-day-width: 32px;
            --rdp-day-height: 32px;
            --rdp-day_button-width: 30px;
            --rdp-day_button-height: 30px;
            --rdp-day_button-border-radius: 6px;
            font-size: 13px;
          }

          .calendar-popup .rdp-caption {
            padding: 0 0 12px 0;
            margin-bottom: 8px;
          }

          .calendar-popup .rdp-caption_label {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
          }

          .calendar-popup .rdp-nav_button {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            transition: background-color 0.15s ease;
          }

          .calendar-popup .rdp-nav_button:hover {
            background-color: #f3f4f6;
          }

          .calendar-popup .rdp-head_cell {
            font-size: 11px;
            font-weight: 500;
            color: #6b7280;
            padding: 0;
            width: 32px;
            height: 24px;
          }

          .calendar-popup .rdp-day {
            width: 32px;
            height: 32px;
            font-size: 13px;
            border-radius: 6px;
            transition: all 0.15s ease;
          }

          .calendar-popup .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
            background-color: #f3f4f6;
          }

          .calendar-popup .rdp-day_today:not(.rdp-day_selected) {
            background-color: #f3f4f6;
            color: #1f2937;
            font-weight: 600;
            position: relative;
          }

          .calendar-popup .rdp-day_today:not(.rdp-day_selected)::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background-color: #3b82f6;
            border-radius: 50%;
          }

          .calendar-popup .rdp-day_selected {
            background-color: #3b82f6;
            color: white;
            font-weight: 600;
          }

          .calendar-popup .rdp-day_selected:hover {
            background-color: #2563eb;
          }

          .calendar-popup .rdp-day_outside {
            color: #d1d5db;
            opacity: 0.5;
          }

          .calendar-popup .rdp-day_disabled {
            color: #d1d5db;
            cursor: not-allowed;
          }

          .calendar-popup .rdp-table {
            width: 100%;
            margin: 0;
          }

          .calendar-popup .rdp-tbody {
            border: none;
          }

          .calendar-popup .rdp-row {
            margin: 0;
          }

          .calendar-popup .rdp-cell {
            padding: 1px;
            text-align: center;
          }
        `}</style>
      </div>
    </>
  );
}
