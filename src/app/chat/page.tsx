"use client";

// This is the main chat page with E2EE demo functionality.
// E2EE can be toggled on/off with the lock icon. When ON, messages are encrypted before sending.
// The UI always shows plaintext if possible, and shows [Encrypted] for encrypted messages when E2EE is OFF.

import type { Channel } from "@prisma/client";
import sodium from "libsodium-wrappers";
await sodium.ready;
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
  Trash,
  Loader2,
  UserRound,
  HomeIcon,
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
import TooltipComponent from "~/components/TooltipComponent";
import MessageBubble from "~/components/MessageBubble";
import toast from "react-hot-toast";
import ClearingChatDialog from "~/components/ClearingChatDialog";
import CreateChannelDialog from "~/components/CreateChannelDialog";
import { redirect } from "next/navigation";

export default function Chat() {
  // State for selected channel, messages, and channels
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { messages, channels, setChannels, setUsers, setMessages } = useStore({
    channelId: selectedChannel?.id ?? undefined,
  });
  const [isJoiningChannel, setIsJoiningChannel] = useState<boolean>(false);
  const [clearingChatDialogOpen, setClearingChatDialogOpen] =
    useState<boolean>(false);
  const [createChannelDialogOpen, setCreateChannelDialogOpen] =
    useState<boolean>(false);
  // Message input state
  const [message, setMessage] = useState("");
  // Auth/session

  const { data: userData, isLoading: isUserDataLoading } =
    api.user.getUserData.useQuery(
      {
        channelId: selectedChannel?.id ?? "",
      },
      {
        enabled: !!selectedChannel,
      },
    );
  const { data: sessionData } = useSession();
  const ctx = api.useUtils();
  // Mutations for channel and message actions
  const deleteChannel = api.channel.deleteChannel.useMutation();
  const deleteMessage = api.channel.deleteMessage.useMutation();
  const joinChannel = api.channel.joinChannel.useMutation({
    onSuccess: () => {
      setIsJoiningChannel(false);
      toast.success("Joined channel");
      void ctx.user.getUserData.invalidate();
    },
    onMutate: () => {
      setIsJoiningChannel(true);
    },
  });
  const addMessage = api.channel.addMessage.useMutation({
    onError: (error) => {
      console.error(error);
    },
  });
  const createChannel = api.channel.createChannel.useMutation({
    onSuccess: (channel) => {
      setSelectedChannel(channel);
    },
  });
  const [channelKey, setChannelKey] = useState<string | null>(null);
  // Mutation for clearing all messages in a channel
  const clearMessages = api.channel.clearMessages.useMutation({
    onSuccess: () => {
      setMessages([]);
    },
  });
  // Auto-select the first channel if none is selected
  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0]!);
    }
  }, [channels]);

  useEffect(() => {
    if (selectedChannel && userData && userData.channels.length > 0) {
      const currentChannel = channels.find(
        (channel) => channel.id === selectedChannel?.id,
      );
      const decryptedGroupKey = sodium.crypto_box_open_easy(
        sodium.from_base64(userData?.channels[0]!.encryptedKey),
        sodium.from_base64(userData?.channels[0]!.nonce),
        sodium.from_base64(currentChannel?.createdByUser?.publicKey ?? ""),
        sodium.from_base64(userData?.privateKey ?? ""),
      );
      setChannelKey(sodium.to_base64(decryptedGroupKey));
    }
  }, [selectedChannel, userData]);

  // Mock data for direct messages (not E2EE, just for UI demo)
  const directMessages = [
    { id: 1, name: "Yee Cheng", status: "online", unread: false },
    { id: 2, name: "Braxton Ong", status: "offline", unread: true },
    { id: 3, name: "Danny Zhang", status: "online", unread: false },
  ];

  // Get the displayable message content for the UI
  const getDecryptedContent = (msg: any) => {
    if (!msg || typeof msg.content !== "string") {
      return "";
    }

    if (channelKey) {
      try {
        const decrypted = sodium.to_string(
          sodium.crypto_secretbox_open_easy(
            sodium.from_base64(msg.content),
            sodium.from_base64(msg.nonce),
            sodium.from_base64(channelKey),
          ),
        );
        return decrypted;
      } catch (e) {
        return msg.content;
      }
    }
    return msg.content;
  };

  // Handle sending a message (encrypt if E2EE is enabled)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) {
      console.error("No channel selected");
      return;
    }
    if (!message.trim()) {
      console.error("Message is empty");
      return;
    }
    if (!channelKey) {
      console.error("No channel key available");
      return;
    }
    setMessage("");
    try {
      const messageNonce = sodium.randombytes_buf(
        sodium.crypto_secretbox_NONCEBYTES,
      );
      const ciphertext = sodium.crypto_secretbox_easy(
        sodium.from_string(message),
        messageNonce,
        sodium.from_base64(channelKey),
      );
      const messageResult = {
        content: sodium.to_base64(ciphertext),
        nonce: sodium.to_base64(messageNonce),
      };

      // Send message (encrypted or plaintext) to server
      await addMessage.mutateAsync({
        channelId: selectedChannel.id,
        ...messageResult,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Clear stored messages when clearing chat
  const handleClearChat = async () => {
    if (selectedChannel) {
      await toast.promise(
        clearMessages.mutateAsync({ channelId: selectedChannel.id }),
        {
          loading: "Clearing chat...",
          success: "Chat cleared",
          error: "Error clearing chat",
        },
      );
      void ctx.user.getUserData.invalidate();
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

  // Create a new channel
  const handleCreateChannel = async (channelName: string) => {
    const slugified = slugify(channelName);
    await toast.promise(createChannel.mutateAsync({ slug: slugified }), {
      loading: "Creating channel...",
      success: "Channel created",
      error: "Error creating channel",
    });
  };

  // For demo: create a new channel (calls slugify and addChannel)
  const newChannel = () => {
    const slug = prompt("Enter a name for the new channel");
    if (slug) {
      const slugified = slugify(slug);
      void addChannel(slugified, sessionData?.user?.id ?? "");
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
                  onClick={() => setCreateChannelDialogOpen(true)}
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
            {/* Trash icon clears all messages in the channel */}
            <TooltipComponent content="Clear Chat">
              <button
                disabled={messages.length === 0}
                className="hover:bg-muted cursor-pointer rounded-full p-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setClearingChatDialogOpen(true)}
              >
                <Trash size={18} />
              </button>
            </TooltipComponent>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search"
                className="h-9 w-48 pl-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                redirect("/");
              }}
            >
              <HomeIcon size={18} />
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
        {isUserDataLoading ? (
          <div className="text-muted-foreground flex h-[calc(100vh-8rem)] items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading message history...</p>
          </div>
        ) : channelKey ? (
          <>
            <ScrollArea className="h-[calc(100vh-8rem)] p-4">
              <div className="space-y-6">
                {messages.map((msg) => {
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={{
                        ...msg,
                        decryptedContent: getDecryptedContent(msg),
                      }}
                    />
                  );
                })}
              </div>
            </ScrollArea>

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
            <ClearingChatDialog
              isOpen={clearingChatDialogOpen}
              onOpenChange={setClearingChatDialogOpen}
              handleClearChat={handleClearChat}
            />
            <CreateChannelDialog
              isOpen={createChannelDialogOpen}
              onOpenChange={setCreateChannelDialogOpen}
              handleCreateChannel={handleCreateChannel}
            />
          </>
        ) : (
          <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-2 transition-colors">
            <p className="text-muted-foreground">
              You have to join this channel in order to view messages.
            </p>
            <Button
              variant="outline"
              disabled={isJoiningChannel}
              onClick={() => {
                setIsJoiningChannel(true);
                void joinChannel.mutateAsync({
                  channelId: selectedChannel?.id ?? "",
                });
              }}
            >
              {isJoiningChannel && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isJoiningChannel ? "Joining..." : "Join Channel"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
