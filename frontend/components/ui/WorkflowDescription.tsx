"use client";
import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";

export default function WorkflowDescription({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!description) return null;
  return (
    <span
      className="relative inline-flex ml-2 align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`À propos de ${label}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="text-gray-500 hover:text-accent-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-full"
      >
        <CircleHelp size={17} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full mt-2 z-20 w-64 max-w-[70vw] rounded-xl border border-gray-200 bg-white p-3 text-sm font-normal text-gray-700 shadow-lg"
        >
          {description}
        </span>
      )}
    </span>
  );
}
