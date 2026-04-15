import cron from "node-cron";
import { prisma } from "./db";
import { fetchOpenMeteoAirQuality } from "./apis/openmeteo";
import { pm25ToAqi, interpretAqi } from "./utils";
import { sendSms } from "./sms";

// This function will run every hour
export function setupCronJobs() {
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly AQI alert check...");
    
    try {
      const trackedLocations = await prisma.trackedLocation.findMany({
        where: { active: true },
        include: { user: true },
      });

      for (const loc of trackedLocations) {
        if (!loc.user.phoneNumber) continue;

        try {
          const airQuality = await fetchOpenMeteoAirQuality(loc.lat, loc.lon);
          const currentPm25 = airQuality?.pm2_5;
          
          if (currentPm25 != null) {
            const currentAqi = pm25ToAqi(currentPm25);
            
            if (currentAqi != null && currentAqi >= loc.threshold) {
              const aqiInfo = interpretAqi(currentAqi);
              const message = `⚠️ AQI Alert for your tracked location ${loc.displayName}: The AQI has reached ${currentAqi} (${aqiInfo.label}). Please take necessary health precautions.`;
              
              await sendSms(loc.user.phoneNumber, message);
              console.log(`Alert sent to ${loc.user.username} for ${loc.displayName}`);
            }
          }
        } catch (error) {
          console.error(`Error checking AQI for location ${loc.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in AQI check cron job:", error);
    }
  });
}
