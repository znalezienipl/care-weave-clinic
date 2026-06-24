interface SMSProvider {
  send(to: string, message: string): Promise<boolean>;
}

class TwilioProvider implements SMSProvider {
  async send(to: string, message: string): Promise<boolean> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !from) {
      console.log(`[SMS stub] to=${to} msg=${message}`);
      return true;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({ To: to, From: from, Body: message });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[SMS] Twilio error:", err);
      return false;
    }
    return true;
  }
}

const provider = new TwilioProvider();

export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    return await provider.send(phone, message);
  } catch (error) {
    console.error("[SMS] failed:", error);
    return false;
  }
};
