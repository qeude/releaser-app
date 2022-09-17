import { MongoClient } from "mongodb";
import { Channel } from "../types/channel";
import "./env";

const uri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:27017/?authMechanism=DEFAULT`;

console.log(uri);
const client = new MongoClient(uri);

export async function addChannel(id: string) {
  try {
    await client.connect();
    const database = client.db("releaser");
    const channels = database.collection("channels");
    const channel = { id: id, users: [] };
    await channels.insertOne(channel);
  } finally {
    await client.close();
  }
}

export async function fetchUsers(channelId: string): Promise<string[]> {
  try {
    const channel = await fetchChannel(channelId);
    return channel.users;
  } finally {
    await client.close();
  }
}

export async function fetchChannel(channelId: string): Promise<Channel> {
  try {
    await client.connect();
    const database = client.db("releaser");
    const channels = database.collection("channels");
    const query = { id: channelId, users: [] };
    const channel = await channels.findOne(query);
    return channel as Channel;
  } finally {
    await client.close();
  }
}

export async function addUser(channelId: string, user: string) {
  try {
    await client.connect();
    const database = client.db("releaser");
    const channels = database.collection("channels");
    const filter = { id: channelId };
    const updatedChannel = {
      $push: {
        users: user,
      },
    };
    const result = await channels.updateOne(filter, updatedChannel);
    return result;
  } finally {
    await client.close();
  }
}
