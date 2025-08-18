import { supabase } from "@/integrations/supabase/client";

export interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
}

export const submitContactMessage = async (
  messageData: ContactMessageData,
): Promise<void> => {
  try {
    const { error } = await supabase.from("contact_messages").insert({
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject,
      message: messageData.message,
      status: "unread",
    });

    if (error) {
      console.error("Error submitting contact message:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in submitContactMessage:", error);
    throw new Error("Failed to submit contact message");
  }
};

export const getAllContactMessages = async (): Promise<ContactMessage[]> => {
  console.log("🔍 Fetching contact messages...");

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Contact messages database error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Contact messages error: ${error.message}`);
  }

  console.log(`✅ Successfully fetched ${data?.length || 0} contact messages`);

  return (data || []).map((message) => ({
    ...message,
    status: message.status as "unread" | "read",
  }));
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in markMessageAsRead:", error);
    throw new Error("Failed to mark message as read");
  }
};

export const clearAllMessages = async (): Promise<void> => {
  try {
    console.log("Clearing all contact messages...");

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .gte("created_at", "1900-01-01"); // This will match all records safely

    if (error) {
      console.error("Error clearing messages:", error.message || String(error));
      throw error;
    }

    console.log("All contact messages cleared successfully");
  } catch (error) {
    console.error(
      "Error in clearAllMessages:",
      error instanceof Error ? error.message : String(error),
    );
    throw new Error("Failed to clear all messages");
  }
};
