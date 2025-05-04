import { api } from "~/trpc/react";
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

export default function ClearingChatDialog({
  isOpen,
  onOpenChange,
  handleClearChat,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  handleClearChat: () => Promise<void>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            message history for this channel.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async (e) => {
              e.preventDefault();
              onOpenChange(false);
              await handleClearChat();
            }}
            className="hover:bg-destructive hover:opacity-80"
          >
            Clear chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
