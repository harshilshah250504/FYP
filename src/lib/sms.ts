import twilio from "twilio";
import { env } from "./env";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendSms(to: string, body: string) {
  console.log(`[SMS] Preparing to send to ${to}...`);
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    console.warn(`[SMS] ❌ Twilio credentials missing: SID=${!!env.TWILIO_ACCOUNT_SID}, Token=${!!env.TWILIO_AUTH_TOKEN}, From=${!!env.TWILIO_PHONE_NUMBER}`);
    return;
  }

  try {
    const message = await client.messages.create({
      body,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`[SMS] ✅ Message sent to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`[SMS] ❌ Failed to send to ${to}:`, error);
    throw error;
  }
}
