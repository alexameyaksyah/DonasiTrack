import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../config/env";

type NotificationInput = {
  userId?: string;
  title: string;
  body: string;
  token?: string;
  payload?: Record<string, unknown>;
};

export async function sendNotification(input: NotificationInput) {
  let status = "stored";

  if (input.token && env.fcmServerKey) {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${env.fcmServerKey}`,
      },
      body: JSON.stringify({
        to: input.token,
        notification: {
          title: input.title,
          body: input.body,
        },
        data: input.payload || {},
      }),
    });

    status = response.ok ? "sent" : "failed";
  }

  await prisma.notificationLog.create({
    data: {
      userId: input.userId,
      channel: "FCM",
      title: input.title,
      body: input.body,
      status,
      payload: input.payload as Prisma.JsonObject | undefined,
    },
  });

  return { status };
}
