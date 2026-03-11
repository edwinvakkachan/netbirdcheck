import dotenv from "dotenv"
dotenv.config();
import axios from 'axios'

const CHECK_URL = process.env.CHECK_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 120000;
const TIMEOUT = parseInt(process.env.TIMEOUT) || 10000;

async function triggerWebhook(status) {
  try {
    await axios.post(WEBHOOK_URL, {
      site: CHECK_URL,
      status: status,
      time: new Date().toISOString()
    });

    console.log("🚨 Webhook triggered:", status);
  } catch (err) {
    console.log("Webhook error:", err.message);
  }
}

async function checkSite() {
  try {
    const res = await axios.get(CHECK_URL, {
      timeout: TIMEOUT,
      validateStatus: () => true
    });

    if (res.status === 200) {
      console.log("✅ Site recovered:", res.status);
      return true;
    }

    console.log(`❌ Site unhealthy: ${res.status}`);
    await triggerWebhook(res.status);
    return false;

  } catch (err) {
    console.log("❌ Site unreachable:", err.message);
    await triggerWebhook("unreachable");
    return false;
  }
}

async function monitor() {
  while (true) {
    const healthy = await checkSite();

    if (healthy) {
      console.log("Monitoring stopped because site is healthy.");
      break;
    }

    console.log("⏳ Retrying in 2 minutes...");
    await new Promise(resolve => setTimeout(resolve, INTERVAL));
  }
}

monitor();