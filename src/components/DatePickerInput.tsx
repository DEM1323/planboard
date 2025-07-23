import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CalendarPopup } from "./CalendarPopup";
import { Button } from "./ui/button";

interface DatePickerInputProps {
  id?: string;
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  tldrawEditor?: any; // TLDraw editor instance for focus management
}

export function DatePickerInput({
  id,
  value = "",
  onChange,
  placeholder,
  label,
  className = "",
  tldrawEditor,
}: DatePickerInputProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Add/remove body class to track calendar state globally
  useEffect(() => {
    if (showCalendar) {
      document.body.classList.add("calendar-popup-active");
      document.body.style.setProperty("--calendar-popup-active", "true");
    } else {
      document.body.classList.remove("calendar-popup-active");
      document.body.style.removeProperty("--calendar-popup-active");
    }

    return () => {
      document.body.classList.remove("calendar-popup-active");
      document.body.style.removeProperty("--calendar-popup-active");
    };
  }, [showCalendar]);

  // Convert YYYY-MM-DD to Date object for calendar
  const getSelectedDate = (): Date | undefined => {
    if (!value) return undefined;
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = value.split("-").map((num) => parseInt(num, 10));
    return new Date(year, month - 1, day); // month is 0-based
  };

  // Format date for display
  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "Select date...";
    const [year, month, day] = dateStr
      .split("-")
      .map((num) => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Intelligent positioning that places calendar to the left of modals
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calendar popup dimensions (approximate)
    const popupWidth = 380;
    const popupHeight = 450;

    // Check if we're inside a modal by looking for modal dialog elements
    const modalDialog = buttonRef.current.closest('[role="dialog"]');
    const modalContent = buttonRef.current.closest(
      '[data-testid="dialog-content"], .sm\\:max-w-md, [class*="dialog"]'
    );

    if (modalDialog || modalContent) {
      // We're inside a modal - position to the left of it
      const modalElement = modalDialog || modalContent;
      const modalRect = modalElement!.getBoundingClientRect();

      // Position to the left of the modal
      let top = modalRect.top + window.scrollY + 20; // Align with top of modal + small margin
      let left = modalRect.left + window.scrollX - popupWidth - 20; // 20px gap from modal

      // Ensure calendar doesn't go off the left edge of screen
      if (left < 16) {
        // If no room on left, try right side of modal
        left = modalRect.right + window.scrollX + 20;

        // If still off-screen on right, center in available space
        if (left + popupWidth > viewportWidth - 16) {
          left = Math.max(16, (viewportWidth - popupWidth) / 2);
        }
      }

      // Ensure calendar doesn't go off the top or bottom
      if (top + popupHeight > viewportHeight + window.scrollY - 16) {
        // If no room below, align with bottom of viewport
        top = viewportHeight + window.scrollY - popupHeight - 16;
      }

      // Ensure minimum top margin
      top = Math.max(window.scrollY + 16, top);

      return { top, left };
    }

    // Not in a modal - use standard positioning logic
    // Calculate initial position (below the button)
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Adjust horizontal position if it would go off-screen
    if (left + popupWidth > viewportWidth) {
      // Try to align right edge of popup with right edge of button
      left = rect.right + window.scrollX - popupWidth;

      // If still off-screen, align with right edge of viewport
      if (left < 0) {
        left = viewportWidth - popupWidth - 16; // 16px margin
      }
    }

    // Adjust vertical position if it would go off-screen
    if (top + popupHeight > viewportHeight + window.scrollY) {
      // Show above the button instead
      top = rect.top + window.scrollY - popupHeight - 8;

      // If still off-screen, position at top of viewport
      if (top < window.scrollY) {
        top = window.scrollY + 16; // 16px margin
      }
    }

    // Ensure minimum margins
    left = Math.max(16, Math.min(left, viewportWidth - popupWidth - 16));
    top = Math.max(window.scrollY + 16, top);

    return { top, left };
  }, []);

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling up to modal handlers
    e.stopPropagation();

    const position = calculatePosition();
    setCalendarPosition(position);
    setShowCalendar(true);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    let dateToSave = "";

    if (date) {
      // Convert Date to YYYY-MM-DD format for storage
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      dateToSave = `${year}-${month}-${day}`;
    }

    if (onChange) {
      onChange(dateToSave);
    }
    setShowCalendar(false);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  // Update position when window resizes
  useEffect(() => {
    if (!showCalendar) return;

    const handleResize = () => {
      const position = calculatePosition();
      setCalendarPosition(position);
    };

    const handleScroll = () => {
      const position = calculatePosition();
      setCalendarPosition(position);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true); // Use capture to catch all scroll events

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showCalendar, calculatePosition]);

  // Close calendar when clicking outside (but not on the button or calendar)
  useEffect(() => {
    if (!showCalendar) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking on our button
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on the calendar popup itself
      const calendarElements = document.querySelectorAll(".calendar-popup");
      for (const element of calendarElements) {
        if (element.contains(target)) {
          return;
        }
      }

      // Close if clicking anywhere else
      setShowCalendar(false);
    };

    // Use capture phase to ensure we get the event before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showCalendar]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium mb-2 block">
          {label}
        </label>
      )}

      <Button
        ref={buttonRef}
        id={id}
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        onMouseDown={(e) => e.stopPropagation()} // Prevent modal from detecting this as outside click
        className="w-full justify-start text-left font-normal h-10 px-3 py-2"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {formatDisplayDate(value)}
        </span>
        <div className="ml-auto">📅</div>
      </Button>

      {showCalendar &&
        createPortal(
          <CalendarPopup
            isOpen={showCalendar}
            selectedDate={getSelectedDate()}
            onSelect={handleCalendarSelect}
            onClose={handleCalendarClose}
            position={calendarPosition}
            tldrawEditor={tldrawEditor}
          />,
          document.body
        )}
    </div>
  );
}
