import "./utils/env";
import { App, LogLevel } from "@slack/bolt";
import {
  addChannel,
  addUser,
  fetchChannel,
  fetchUsers,
  removeUser,
  rotateUsers,
  swapUsers,
  userExists,
} from "./utils/store";

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
    ?.filter((user) => user.is_bot === false && user.name !== "slackbot")
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
      await say(`👷🏻 <${commandUser}> has been add to the releasers queue.`);
    }
  }
});

app.command("/swapusers", async ({ command, ack, say, respond }) => {
  await ack();
  const commandUser1 = command.text.split(" ")[0];
  const commandUser2 = command.text.split(" ")[1];
  const users = await fetchUsers(command.channel_id);
  if (
    commandUser1 === undefined ||
    commandUser1 === "" ||
    commandUser2 === undefined ||
    commandUser2 === ""
  ) {
    await respond("Ensure that you passed two users to swap.");
  } else if (users?.includes(commandUser1) === false) {
    await respond(
      "First user passed doesn't exists in the current releasers queue."
    );
  } else if (users?.includes(commandUser2) === false) {
    await respond(
      "Second user passed doesn't exists in the current releasers queue."
    );
  } else if (commandUser1 === commandUser2) {
    await respond("First and second users are the same.");
  } else {
    await swapUsers(command.channel_id, commandUser1, commandUser2);
    await say(
      `🔀 <${commandUser1}> & <${commandUser2}> have been swapped in the releasers queue.`
    );
  }
});

app.command("/removeuser", async ({ command, ack, say, respond }) => {
  await ack();
  const commandUser = command.text.split(" ")[0];
  const users = await fetchUsers(command.channel_id);
  if (commandUser === undefined || commandUser === "") {
    await respond("Ensure you passed a user to remove.");
  } else if (users?.includes(commandUser) === false) {
    await respond("User doesn't exists in the current releasers queue.");
  } else {
    await removeUser(command.channel_id, commandUser);
    await say(`👋 <${commandUser}> has been removed from the releasers queue.`);
  }
});

app.command("/rotate", async ({ command, ack, respond }) => {
  await ack();
  await rotateUsers(command.channel_id);
  await respond(`♻️ Releasers queue rotation done`);
});

app.command("/show", async ({ command, ack, respond, say }) => {
  await ack();
  const channel = await fetchChannel(command.channel_id);
  if (channel === null) {
    await respond("There is no existing queue in this Slack channel.");
    return;
  }
  const users = channel.users;
  let message = users
    .map((user, index) => {
      if (index === 0) {
        return `🥇 <${user}>\n\n`;
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
