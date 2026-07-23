"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import createLogger from "@/lib/utils/logger";

const logger = createLogger("erp:notifications");

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  isDanger: boolean;
  created_at: string;
}

interface RawNotificationRow {
  id: string;
  subject: string | null;
  body: string | null;
  event_type: string | null;
  read_at: string | null;
  created_at: string;
  status: string;
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
      logger.error("Error fetching notifications", { data: { error } });
      return [];
    }

    return ((data as RawNotificationRow[]) || []).map((notif) => ({
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
    logger.error("Exception fetching notifications", { error: error instanceof Error ? error : undefined, data: { raw: error } });
    return [];
  }
}
