import "./utils/env";
import { App, LogLevel } from "@slack/bolt";
import { addChannel, addUser, fetchChannel, userExists } from "./utils/store";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
  port: 3000,
});

app.command("/createqueue", async ({ command, ack, say, respond, client }) => {
  await ack();
  const storedChannel = await fetchChannel(command.channel_id);
  if (storedChannel !== null) {
    await respond("A releasers queue already exists in this channel.");
  } else {
    await client.conversations.join({
      channel: command.channel_id,
    });
    await addChannel(command.channel_id);
    await say("🎉 A releasers queue has been created.");
  }
});

app.command("/adduser", async ({ command, ack, client, say, respond }) => {
  await ack();
  const users = (await client.users.list()).members
    ?.filter((user) => user.is_bot === false && user.name !== "slacbot")
    .map((user) => `@${user.name}`);
  const commandUser = command.text.split(" ")[0];
  if (commandUser === undefined || commandUser === "") {
    await respond("Ensure that you passed an user to add.");
  } else if (users?.includes(commandUser) === false) {
    await respond(
      "The user passed doesn't exists in the current Slack workspace."
    );
  } else {
    const exists = await userExists(command.channel_id, commandUser);
    if (exists) {
      await respond(`<${commandUser}> is already in this queue.`);
    } else {
      await addUser(command.channel_id, commandUser);
      await say(`🚀 <${commandUser}> has been add to the releasers queue.`);
    }
  }
});

app.command("/show", async ({ command, ack, respond, say }) => {
  await ack();
  const channel = await fetchChannel(command.channel_id);
  if (channel === null) {
    await respond("There is no existing queue in this Slack channel.");
    return;
  }
  const users = channel.users;
  console.log(channel.users);
  let message = channel.users
    .map((user, index) => {
      if (index === 0) {
        return `1️⃣ <${user}>\n\n`;
      } else if (index === 1) {
        return `2️⃣ <${user}>\n\n`;
      } else if (index === 2) {
        return `3️⃣ <${user}>\n\n\n\n\n`;
      } else if (index === users.length - 1) {
        return `<${user}>.`;
      } else {
        return `<${user}>, `;
      }
    })
    .join("");
  await say({
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚀 Releasers queue",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message.length > 0 ? message : "No one in the queue",
        },
      },
    ],
  });
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app is running!");
})();
