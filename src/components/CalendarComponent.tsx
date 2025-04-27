"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { useState } from "react";

export const CalendarComponent = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit">
        <span className="text-sm">Please select a date</span>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow"
        />
      </DialogContent>
    </Dialog>
  );
};
