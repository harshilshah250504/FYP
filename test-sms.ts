import twilio from "twilio";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env because for some reason it's failing to pick up
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};

envContent.split("\n").forEach(line => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const accountSid = envVars["TWILIO_ACCOUNT_SID"];
const authToken = envVars["TWILIO_AUTH_TOKEN"];
const fromPhone = envVars["TWILIO_PHONE_NUMBER"];
const toPhone = "+918140411311"; // Using your actual number for the test

async function testSms() {
  console.log("Starting SMS test with manual env parsing...");
  console.log("Account SID:", accountSid);
  console.log("From:", fromPhone);
  console.log("To:", toPhone);

  if (!accountSid || !authToken || !fromPhone) {
    console.error("Missing Twilio environment variables in manual parse.");
    return;
  }

  const client = (twilio as any)(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: "AQInsights Test: Your Twilio integration is working! 🌍💨",
      from: fromPhone,
      to: toPhone,
    });
    console.log("✅ SMS sent successfully!");
    console.log("Message SID:", message.sid);
  } catch (error) {
    console.error("❌ SMS failed to send:");
    console.error(error);
  }
}

testSms();
