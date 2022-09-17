import "./utils/env";
import { App, LogLevel } from "@slack/bolt";
import { addChannel, fetchChannel } from "./utils/store";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
  port: 3000,
});

app.command("/create", async ({ command, ack, respond }) => {
  await ack();
  const storedChannel = await fetchChannel(command.channel_id);
  if (storedChannel != null) {
    await respond("A releasers queue already exists in this channel.");
  } else {
    await addChannel(command.channel_id);
    await respond("🎉 Your releasers queue has been created.");
  }
});

(async () => {
  await app.start();
  console.log(process.env.SLACK_BOT_TOKEN);
  console.log("⚡️ Bolt app is running!");
})();
