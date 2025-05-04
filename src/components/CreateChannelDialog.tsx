"use client";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { useState } from "react";

export default function CreateChannelDialog({
  isOpen,
  onOpenChange,
  handleCreateChannel,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  handleCreateChannel: (channelName: string) => void;
}) {
  const [channelName, setChannelName] = useState("");
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What should we call this channel?</DialogTitle>
          <DialogDescription className="mt-4">
            <Input
              type="text"
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={channelName.length === 0}
            variant="default"
            onClick={async (e) => {
              e.preventDefault();
              onOpenChange(false);
              handleCreateChannel(channelName);
            }}
            className="hover:opacity-80"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
