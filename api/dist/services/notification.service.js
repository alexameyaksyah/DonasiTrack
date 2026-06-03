"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const db_1 = require("../db");
const env_1 = require("../config/env");
async function sendNotification(input) {
    let status = "stored";
    if (input.token && env_1.env.fcmServerKey) {
        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `key=${env_1.env.fcmServerKey}`,
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
    await db_1.prisma.notificationLog.create({
        data: {
            userId: input.userId,
            channel: "FCM",
            title: input.title,
            body: input.body,
            status,
            payload: input.payload,
        },
    });
    return { status };
}
