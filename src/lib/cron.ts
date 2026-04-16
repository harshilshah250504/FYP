import cron from "node-cron";
import { prisma } from "./db";
import { fetchOpenMeteoAirQuality } from "./apis/openmeteo";
import { pm25ToAqi, interpretAqi } from "./utils";
import { sendSms } from "./sms";

// This function will run every hour
export function setupCronJobs() {
  console.log("Scheduling AQI alert cron job (Every Hour)...");
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ [Cron] Starting hourly AQI alert check cycle...");
    
    try {
      const trackedLocations = await prisma.trackedLocation.findMany({
        where: { active: true },
        include: { user: true },
      });

      console.log(`[Cron] Found ${trackedLocations.length} active tracked locations.`);

      for (const loc of trackedLocations) {
        console.log(`[Cron] Checking location: ${loc.displayName} for user: ${loc.user.username}`);
        
        if (!loc.user.phoneNumber) {
          console.log(`[Cron] ⚠️ Skipping: User ${loc.user.username} has no phone number.`);
          continue;
        }

        try {
          const airQuality = await fetchOpenMeteoAirQuality(loc.lat, loc.lon);
          const currentPm25 = airQuality?.pm2_5;
          console.log(`[Cron] Current PM2.5 for ${loc.displayName}: ${currentPm25}`);
          
          if (currentPm25 != null) {
            const currentAqi = pm25ToAqi(currentPm25);
            console.log(`[Cron] Calculated AQI: ${currentAqi} (Threshold: ${loc.threshold})`);
            
            if (currentAqi != null && currentAqi >= loc.threshold) {
              const aqiInfo = interpretAqi(currentAqi);
              const message = `⚠️ AQI Alert for your tracked location ${loc.displayName}: The AQI has reached ${currentAqi} (${aqiInfo.label}). Please take necessary health precautions.`;
              
              console.log(`[Cron] 📤 Attempting to send SMS to ${loc.user.phoneNumber}...`);
              await sendSms(loc.user.phoneNumber, message);
              console.log(`[Cron] ✅ SMS sent successfully to ${loc.user.username}`);
            } else {
              console.log(`[Cron] ℹ️ AQI ${currentAqi} is below threshold ${loc.threshold}. No alert sent.`);
            }
          } else {
            console.log(`[Cron] ❌ Could not fetch PM2.5 data for ${loc.displayName}`);
          }
        } catch (error) {
          console.error(`[Cron] ❌ Error checking AQI for location ${loc.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[Cron] ❌ Critical Error in AQI check cron job:", error);
    }
    console.log("⏰ [Cron] Finished check cycle.");
  });
}
