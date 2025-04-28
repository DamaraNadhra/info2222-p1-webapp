"use client";

// This is the main chat page with E2EE demo functionality.
// E2EE can be toggled on/off with the lock icon. When ON, messages are encrypted before sending.
// The UI always shows plaintext if possible, and shows [Encrypted] for encrypted messages when E2EE is OFF.

import type { Channel } from "@prisma/client";
import {
  AtSign,
  Bell,
  ChevronDown,
  Hash,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Lock,
  Unlock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import moment from "~/lib/moment-adapter";
import { useStore, addChannel } from "~/lib/store";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import Link from "next/link";
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "~/lib/encryption";

// Static channel public key for demo (base64, 32 bytes)
// All users use this for encryption/decryption so E2EE works for demo
const STATIC_CHANNEL_PUBLIC_KEY_BASE64 = "Qk1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Q=";
const STATIC_CHANNEL_PUBLIC_KEY = base64ToUint8Array(STATIC_CHANNEL_PUBLIC_KEY_BASE64);

export default function Notes() {
  // State for selected channel, messages, and channels
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { messages, channels, setChannels, setUsers } = useStore({
    channelId: selectedChannel?.id ?? undefined,
  });
  // Message input state
  const [message, setMessage] = useState("");
  // Auth/session
  const { data: userData } = useSession();
  // Mutations for channel and message actions
  const deleteChannel = api.channel.deleteChannel.useMutation();
  const deleteMessage = api.channel.deleteMessage.useMutation();
  const addMessage = api.channel.addMessage.useMutation({
    onError: (error) => {
      console.error(error);
    },
  });
  const createChannel = api.channel.createChannel.useMutation();
  // E2EE toggle state (locked = E2EE ON)
  const [e2eeEnabled, setE2eeEnabled] = useState(false);
  // Mutation for clearing all messages in a channel
  const clearMessages = api.channel.clearMessages.useMutation();
  // Each user gets a key pair for E2EE
  const [userKeyPair, setUserKeyPair] = useState<{ publicKey: Uint8Array; secretKey: Uint8Array } | null>(null);

  // Generate a key pair for this user on mount
  useEffect(() => {
    setUserKeyPair(generateKeyPair());
  }, []);

  // Auto-select the first channel if none is selected
  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0]!);
    }
  }, [channels]);

  // Mock data for direct messages (not E2EE, just for UI demo)
  const directMessages = [
    { id: 1, name: "Yee Cheng", status: "online", unread: false },
    { id: 2, name: "Braxton Ong", status: "offline", unread: true },
    { id: 3, name: "Danny Zhang", status: "online", unread: false },
  ];

  // Handle sending a message (encrypt if E2EE is enabled)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChannel && userKeyPair && message.trim()) {
      try {
        let content = message;
        let nonceBase64 = "";
        let publicKeyBase64 = "";
        if (e2eeEnabled) {
          // Encrypt message with static channel public key
          const { encrypted, nonce } = encryptMessage(
            message,
            STATIC_CHANNEL_PUBLIC_KEY,
            userKeyPair.secretKey
          );
          content = uint8ArrayToBase64(encrypted);
          nonceBase64 = uint8ArrayToBase64(nonce);
          publicKeyBase64 = uint8ArrayToBase64(userKeyPair.publicKey);
        }
        // Send message (encrypted or plaintext) to server
        await addMessage.mutateAsync({
          channelId: selectedChannel.id,
          content,
          nonce: nonceBase64,
          publicKey: publicKeyBase64,
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Get the displayable message content for the UI
  // - If message is encrypted and E2EE is ON, decrypt and show plaintext
  // - If message is encrypted and E2EE is OFF, show [Encrypted]
  // - If message is plaintext, always show it
  const getDecryptedContent = (msg: any) => {
    if (
      msg &&
      typeof msg.content === "string" &&
      !!msg.nonce &&
      !!msg.publicKey &&
      userKeyPair
    ) {
      try {
        return decryptMessage(
          base64ToUint8Array(msg.content),
          base64ToUint8Array(msg.nonce),
          STATIC_CHANNEL_PUBLIC_KEY,
          userKeyPair.secretKey
        );
      } catch (e) {
        // If decryption fails, just show nothing or fallback to content
        return "";
      }
    }
    // For plaintext/old/empty messages, just show the content
    return typeof msg.content === "string" ? msg.content : "";
  };

  // Clear all messages in the current channel
  const handleClearChat = async () => {
    if (selectedChannel) {
      await clearMessages.mutateAsync({ channelId: selectedChannel.id });
      window.location.reload();
    }
  };

  // Delete a channel
  const handleDeleteChannel = (channelId: string) => {
    void deleteChannel.mutateAsync({ id: channelId });
    if (channelId === selectedChannel?.id) {
      setSelectedChannel(null);
    }
  };

  // Delete a message (not used in clear all, but available for context menu)
  const handleDeleteMessage = (messageId: string) => {
    void deleteMessage.mutateAsync({ id: messageId });
  };

  // Create a new channel
  const handleCreateChannel = () => {
    const slug = prompt("Enter a name for the new channel");
    if (slug) {
      const slugified = slugify(slug);
      void createChannel.mutateAsync({ slug: slugified });
    }
  };

  // Slugify helper for channel names
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  // For demo: create a new channel (calls slugify and addChannel)
  const newChannel = () => {
    const slug = prompt("Enter a name for the new channel");
    if (slug) {
      const slugified = slugify(slug);
      void addChannel(slugified, userData?.user?.id ?? "");
    }
  };

  return (
    <div className="bg-background flex h-screen">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r">
        {/* Workspace header */}
        <div className="border-b p-3">
          <button className="hover:bg-muted flex w-full items-center justify-between rounded p-2 text-left font-semibold">
            <span>Group 1 Workspace</span>
            <ChevronDown size={16} />
          </button>
        </div>
        {/* Sidebar content */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Channels section */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold">
                  CHANNELS
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={handleCreateChannel}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <ul>
                {channels.map((channel) => (
                  <ContextMenu key={channel.id}>
                    <ContextMenuTrigger>
                      <li key={channel.id}>
                        <button
                          className={cn(
                            `flex w-full cursor-pointer items-center rounded p-1 px-2 text-left transition-colors`,
                            channel.id === selectedChannel?.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted",
                          )}
                          onClick={() => setSelectedChannel(channel)}
                        >
                          <Hash size={16} className="mr-2 opacity-70" />
                          <span>{channel.name}</span>
                        </button>
                      </li>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>Rename</ContextMenuItem>
                      <ContextMenuItem variant="destructive">
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </ul>
            </div>
            {/* Direct messages section */}
            <div>
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold">
                  DIRECT MESSAGES
                </h3>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus size={14} />
                </Button>
              </div>
              <ul>
                {directMessages.map((dm) => (
                  <li key={dm.id}>
                    <button
                      className={`hover:bg-muted flex w-full items-center rounded p-1 px-2 text-left ${
                        dm.unread ? "font-semibold" : ""
                      }`}
                    >
                      <span
                        className={`mr-2 h-2 w-2 rounded-full ${
                          dm.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></span>
                      <span>{dm.name}</span>
                      {dm.unread && (
                        <span className="bg-primary ml-auto h-1.5 w-1.5 rounded-full"></span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </div>
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Channel header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center">
            <Hash size={18} className="mr-2" />
            <h2 className="font-semibold">
              {selectedChannel?.name ?? "No channel selected"}
            </h2>
          </div>
          {/* Header controls: Home, E2EE toggle, clear chat, search, user */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Bell size={18} style={{ cursor: 'pointer' }} />
            </Link>
            {/* Lock/unlock icon toggles E2EE for sending */}
            <span
              style={{ cursor: 'pointer', color: 'black', display: 'flex', alignItems: 'center' }}
              title={e2eeEnabled ? 'E2EE enabled' : 'E2EE disabled'}
              onClick={() => setE2eeEnabled((v) => !v)}
            >
              {e2eeEnabled ? <Lock size={18} /> : <Unlock size={18} />}
            </span>
            {/* Trash icon clears all messages in the channel */}
            <span
              style={{ cursor: 'pointer', color: 'black', display: 'flex', alignItems: 'center' }}
              title="Clear Chat"
              onClick={handleClearChat}
            >
              🗑️
            </span>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search"
                className="h-9 w-48 pl-8"
              />
            </div>
            <Button variant="ghost" size="icon">
              <AtSign size={18} />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src="/placeholder.svg?height=32&width=32"
                alt="User"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* Messages area */}
        <ScrollArea className="h-[calc(100vh-8rem)] p-4">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="group flex">
                <Avatar className="mt-0.5 mr-3 h-10 w-10">
                  <AvatarImage
                    src={msg.author?.image ?? "/profile-placeholder.png"}
                    alt={msg.author?.name ?? "User"}
                  />
                  <AvatarFallback>{msg.author?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold">
                      {msg.author?.name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {moment(msg.createdAt).format("HH:mm a")}
                    </span>
                    <div className="ml-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Smile size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <AtSign size={14} />
                      </Button>
                    </div>
                  </div>
                  {/* Show decrypted or plaintext message, or [Encrypted] if not viewable */}
                  <p className="mt-0.5">
                    {getDecryptedContent(msg)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* Message input */}
        <div className="border-t p-3">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <Button type="button" variant="ghost" size="icon">
              <Plus size={18} />
            </Button>
            <div className="relative flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  selectedChannel
                    ? `Message #${selectedChannel.name}`
                    : "No channel selected, please select a channel or create a new one"
                }
                className="pr-20"
                disabled={!selectedChannel}
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <AtSign size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Paperclip size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Smile size={16} />
                </Button>
              </div>
            </div>
            <Button type="submit" size="icon" disabled={!message.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
