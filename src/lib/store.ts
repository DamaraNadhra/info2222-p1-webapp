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
 * @param {string} channelId the currently selected Channel
 */
export const useStore = ({ channelId }: { channelId?: string }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users] = useState(new Map());
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
    fetchChannels(setChannels);

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
      supabase.removeChannel(messageListener);
      supabase.removeChannel(userListener);
      supabase.removeChannel(channelListener);
    };
  }, []);

  // Update when the route changes
  useEffect(() => {
    if (channelId) {
      fetchMessages(channelId, (messages) => {
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
        let authorId = newMessage.userId;
        if (!users.get(authorId))
          await fetchUser(authorId, (user) => handleNewOrUpdatedUser(user));
        // console.log("newMessage", newMessage);
        setMessages(messages.concat(newMessage));
      };
      handleAsync();
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
      setChannels(channels.concat(newChannel));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newChannel]);

  useEffect(() => {
    console.log(channels);
  }, [channels]);

  // Deleted channel received from postgres
  useEffect(() => {
    if (deletedChannel) {
      console.log(deletedChannel);
      setChannels(
        channels.filter((channel) => channel.id !== deletedChannel.id),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedChannel]);

  // New or updated user received from Postgres
  useEffect(() => {
    if (newOrUpdatedUser) users.set(newOrUpdatedUser.id, newOrUpdatedUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  };
};

/**
 * Fetch all channels
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchChannels = async (setState: (value: any) => void) => {
  try {
    let { data } = await supabase.from("Channel").select("*");
    if (setState) setState(data);
    return data;
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * Fetch a single user
 * @param {number} userId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchUser = async (
  userId: string,
  setState: (value: any) => void,
) => {
  try {
    let { data } = await supabase.from("User").select(`*`).eq("id", userId);
    if (!data) return null;
    let user = data[0];
    if (setState) setState(user);
    return user;
  } catch (error) {
    console.log("error", error);
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
    let { data } = await supabase
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
    let { data } = await supabase.from("User").select("*");
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
    let { data } = await supabase
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
    let { data } = await supabase
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
    let { data } = await supabase
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
    let { data } = await supabase
      .from("messages")
      .delete()
      .match({ id: message_id });
    return data;
  } catch (error) {
    console.log("error", error);
  }
};
