"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Channel } from "@prisma/client";
import type { Message } from "@prisma/client";
import type { User } from "@prisma/client";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * E2EE key storage note:
 * In this demo, each user's E2EE key pair is generated and stored in-memory (React state) per session.
 * The keys are NOT persisted to the database or localStorage. If you reload the page, a new key pair is generated.
 * In a real-world app, you would want to persist the user's private key securely (e.g., in localStorage or via a secure key management system).
 */

/**
 * @param {string} channelId the currently selected Channel
 */
export const useStore = ({ channelId }: { channelId?: string }) => {
  const [channels, setChannels] = useState<
    (Channel & { createdByUser: User | null })[]
  >([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState(new Map<string, User>());
  const [newMessage, handleNewMessage] = useState<Message | null>(null);
  const [newChannel, handleNewChannel] = useState<Channel | null>(null);
  const [newOrUpdatedUser, handleNewOrUpdatedUser] = useState<User | null>(
    null,
  );
  const [deletedChannel, handleDeletedChannel] = useState<Channel | null>(null);
  const [deletedMessage, handleDeletedMessage] = useState<Message | null>(null);

  // Load initial data and set up listeners
  useEffect(() => {
    // // Get Channels
    void fetchChannels(setChannels);

    // Listen for new and deleted messages
    const messageListener = supabase
      .channel("public:Message")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload) => {
          console.log("payload", payload);
          handleNewMessage(payload.new as Message);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "Message" },
        (payload) => handleDeletedMessage(payload.old as Message),
      )
      .subscribe();
    // Listen for changes to our users
    const userListener = supabase
      .channel("public:User")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "User" },
        (payload) => handleNewOrUpdatedUser(payload.new as User),
      )
      .subscribe();

    const channelListener = supabase
      .channel("public:Channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Channel" },
        (payload) => handleNewChannel(payload.new as Channel),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "Channel" },
        (payload) => handleDeletedChannel(payload.old as Channel),
      )
      .subscribe();
    console.log("Listening for changes");
    return () => {
      void supabase.removeChannel(messageListener);
      void supabase.removeChannel(userListener);
      void supabase.removeChannel(channelListener);
    };
  }, []);

  // Update when the route changes
  useEffect(() => {
    if (channelId) {
      void fetchMessages(channelId, async (messages) => {
        // For each message, ensure the user is in the users map
        await Promise.all(
          messages.map(async (x: any) => {
            if (!users.get(x.userId)) {
              await fetchUser(x.userId, (user) => users.set(user.id, user));
            }
          }),
        );
        messages.forEach((x: any) => users.set(x.userId, x.user));
        setMessages(messages);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // New message received from Postgres
  useEffect(() => {
    console.log("newMessage", newMessage);
    if (newMessage && newMessage.channelId === channelId) {
      const handleAsync = async () => {
        const authorId = newMessage.userId;
        if (!users.get(authorId))
          await fetchUser(authorId, (user) => handleNewOrUpdatedUser(user));
        // console.log("newMessage", newMessage);
        setMessages(messages.concat(newMessage));
      };
      void handleAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // Deleted message received from postgres
  useEffect(() => {
    if (deletedMessage) {
      console.log(deletedMessage);
      setMessages(
        messages.filter((message: Message) => message.id !== deletedMessage.id),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedMessage]);

  // New channel received from Postgres
  useEffect(() => {
    if (newChannel) {
      console.log(newChannel);
      setChannels((prev) => [
        ...prev,
        {
          ...newChannel,
          createdByUser: users.get(newChannel.createdById) ?? null,
        },
      ]);
    }
  }, [newChannel]);

  useEffect(() => {
    console.log(channels);
  }, [channels]);

  // Deleted channel received from postgres
  useEffect(() => {
    if (deletedChannel) {
      console.log(deletedChannel);
      setChannels((prev) =>
        prev.filter((channel) => channel.id !== deletedChannel.id),
      );
    }
  }, [deletedChannel]);

  // New or updated user received from Postgres
  useEffect(() => {
    if (newOrUpdatedUser) users.set(newOrUpdatedUser.id, newOrUpdatedUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    console.log("users", users);
  }, [newOrUpdatedUser]);

  return {
    // We can export computed values here to map the authors to each message
    messages: messages.map((x) => ({ ...x, author: users.get(x.userId) })),
    channels:
      channels !== null
        ? channels.sort((a, b) => a.slug.localeCompare(b.slug))
        : [],
    setChannels,
    setMessages,
    users,
    setUsers, // expose setUsers so it can be used to clear users map after clearing messages
  };
};

/**
 * Fetch all channels
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchChannels = async (setState: (value: any) => void) => {
  try {
    const { data } = await supabase.from("Channel").select(`
        *,
        createdByUser:createdById(*)
      `);
    console.log("data", data);
    if (setState) setState(data);
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

// Helper to fetch a user by ID and update the users map
export const fetchUser = async (
  userId: string,
  setUser: (user: User) => void,
) => {
  try {
    const { data } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setUser(data);
  } catch (error) {
    console.log("error fetching user", error);
  }
};

/**
 * Fetch all messages and their authors
 * @param {string} channelId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchMessages = async (
  channelId: string,
  setState: (value: any) => void,
) => {
  try {
    const { data } = await supabase
      .from("Message")
      .select(`*, user:userId(*)`)
      .eq("channelId", channelId)
      .order("createdAt", { ascending: true });
    if (setState) setState(data);
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

export const fetchUsers = async (users: Map<string, User>) => {
  try {
    const { data } = await supabase.from("User").select("*");
    data?.forEach((user) => users.set(user.id, user));
    return users;
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * Insert a new channel into the DB
 * @param {string} slug The channel name
 * @param {number} user_id The channel creator
 */
export const addChannel = async (slug: string, user_id: string) => {
  try {
    const { data } = await supabase
      .from("Channel")
      .insert([{ slug, createdById: user_id }])
      .select();
    console.log("created channel");
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * Insert a new message into the DB
 * @param {string} message The message text
 * @param {number} channel_id
 * @param {number} user_id The author
 */
export const addMessage = async (
  message: string,
  channel_id: string,
  user_id: string,
) => {
  try {
    const { data } = await supabase
      .from("messages")
      .insert([{ message, channel_id, user_id }])
      .select();
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * Delete a channel from the DB
 * @param {number} channel_id
 */
export const deleteChannel = async (channel_id: string) => {
  try {
    const { data } = await supabase
      .from("channels")
      .delete()
      .match({ id: channel_id });
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * Delete a message from the DB
 * @param {number} message_id
 */
export const deleteMessage = async (message_id: string) => {
  try {
    const { data } = await supabase
      .from("messages")
      .delete()
      .match({ id: message_id });
    return data;
  } catch (error) {
    console.log("error", error);
  }
};
