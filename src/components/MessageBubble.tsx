"use client";

import moment from "~/lib/moment-adapter";
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "./ui/avatar";
import { AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Smile, AtSign, GlobeLock, Globe } from "lucide-react";
import { useState } from "react";
import TooltipComponent from "./TooltipComponent";

export default function MessageBubble({ message }: { message: any }) {
  const [e2eeEnabled, setE2eeEnabled] = useState(true);
  return (
    <div key={message.id} className="group flex">
      <Avatar className="mt-0.5 mr-3 h-10 w-10">
        <AvatarImage
          src={message.author?.image ?? "/profile-placeholder.png"}
          alt={message.author?.name ?? "User"}
        />
        <AvatarFallback>{message.author?.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center">
          <span className="mr-2 font-semibold">
            {message.author?.name ?? "Unknown"}
          </span>
          <span className="text-muted-foreground text-xs">
            {moment
              .utc(message.createdAt)
              .tz("Australia/Sydney")
              .format("hh:mm a")}
          </span>
          <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Smile size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <AtSign size={14} />
            </Button>
            <TooltipComponent
              content={
                e2eeEnabled ? "show raw message" : "show decrypted message"
              }
            >
              <div
                className="flex cursor-pointer items-center justify-center rounded-full p-2 hover:bg-gray-100"
                onClick={() => setE2eeEnabled(!e2eeEnabled)}
              >
                {e2eeEnabled ? <GlobeLock size={14} /> : <Globe size={14} />}
              </div>
            </TooltipComponent>
          </div>
        </div>
        {/* Show decrypted or plaintext message, or [Encrypted] if not viewable */}
        <p className="mt-0.5">
          {e2eeEnabled ? message.decryptedContent : message.content}
        </p>
      </div>
    </div>
  );
}
