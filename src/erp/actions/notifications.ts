"use server";

import { supabaseAdmin } from "@/platform/auth/clients";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  isDanger: boolean;
  created_at: string;
}

export async function getUnreadNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, subject, body, event_type, read_at, created_at, status")
      .eq("recipient_user_id", userId)
      .is("read_at", null)
      .neq("status", "ANULADA")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return (data || []).map((notif: any) => ({
      id: notif.id,
      title: notif.subject ?? "(sin asunto)",
      description: notif.body ?? "",
      isRead: notif.read_at !== null,
      isDanger:
        notif.event_type === "danger" ||
        notif.event_type === "alert" ||
        notif.status === "FALLIDA",
      created_at: notif.created_at,
    }));
  } catch (error) {
    console.error("Exception fetching notifications:", error);
    return [];
  }
}
