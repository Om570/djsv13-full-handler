const { Collection, Client, Discord, MessageEmbed } = require("discord.js");
const fs = require("fs");
const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    // "GUILD_EMOJIS",
    "GUILD_INTEGRATIONS",
    "GUILD_WEBHOOKS",
    "GUILD_INVITES",
    "GUILD_VOICE_STATES",
    "GUILD_PRESENCES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "GUILD_MESSAGE_TYPING",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS",
    "DIRECT_MESSAGE_TYPING",
  ],
});
module.exports = client;
global.client = client
const config = require("./config.json");
const prefix = config.prefix;
const token = config.token;
const ch = config.slashtestingguildid;
client.login(token);
const { mongoString } = require("./config.json");
const mongoose = require("mongoose");
mongoose
  .connect(mongoString, {
    useFindAndModify: false,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to mongodb.");
  });
client.commands = new Collection();
client.scommands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync("./commands/");
const Timeout = new Collection();
["command"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

//------------------------------------------------REQUIREMENTS------------------------------------------------------//
const ms = require("ms");

//------------------------------------------------READY------------------------------------------------------//

client.on("ready", async () => {
  client.user.setActivity(`${prefix}help`);
  console.log(`${client.user.username} ✅`);
  console.log("-------------------------------------------------HANDLER BY @ISHANDEV2004-----------------------------------------\nJoin https://discord.gg/fQDgHAh7 for free accounts\nHave a great day!")


  const commandFiles = fs.readdirSync('./scommands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./scommands/${file}`);
        client.api.applications(client.user.id).guilds(ch).commands.post({ data: {
            name: command.name,
            description: command.description,
            options: command.commandOptions
        }})
        if (command.global == true) {
            client.api.applications(client.user.id).commands.post({ data: {
                name: command.name,
                description: command.description,
                options: command.commandOptions
            }})
        }
        client.scommands.set(command.name, command);
        console.log(`Command POST : ${command.name} from ${file} (${command.global ? "global" : "guild"})`)
    }
    console.log("")
    
    let cmdArrGlobal = await client.api.applications(client.user.id).commands.get()
    let cmdArrGuild = await client.api.applications(client.user.id).guilds(ch).commands.get()
    cmdArrGlobal.forEach(element => {
        console.log("Global command loaded : " + element.name + " (" + element.id + ")" )
    });
    console.log("")
    cmdArrGuild.forEach(element => {
        console.log("Guild command loaded : " + element.name + " (" + element.id + ")")
    });
    console.log("")
});

//------------------------------------------------MESSAGE------------------------------------------------------//

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  let p;
  let mentionRegex = message.content.match(
    new RegExp(`^<@!?(${client.user.id})>`, "gi")
  );
  if (mentionRegex) {
    p = `${mentionRegex}`;
  } else {
    p = config.prefix;
  }
  if (!message.content.startsWith(p)) return;
  if (!message.guild) return;
  if (!message.member)
    message.member = await message.guild.fetchMember(message);
  const args = message.content.slice(p.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();
  if (cmd.length == 0) return;
  let command = client.commands.get(cmd);
  if (!command) command = client.commands.get(client.aliases.get(cmd));
  if (command) {
    if(!message.member.permissions.has(command.userPerms || [])) return message.reply({content: `You dont have permissions to execute that command.`})
    if(!message.guild.me.permissions.has(command.botPerms || [])) return message.reply({content: `I dont have permissions to execute that command.`})
    if (command.timeout) {
      if (Timeout.has(`${command.name}${message.author.id}`))
        return message.channel.send(
          `You are on a \`${ms(
            Timeout.get(`${command.name}${message.author.id}`) - Date.now(),
            { long: true }
          )}\` cooldown.`
        );
      command.run(client, message, args);
      Timeout.set(
        `${command.name}${message.author.id}`,
        Date.now() + command.timeout
      );
      setTimeout(() => {
        Timeout.delete(`${command.name}${message.author.id}`);
      }, command.timeout);
    }
  }
});


client.ws.on('INTERACTION_CREATE', async interaction => {

  if (!client.scommands.has(interaction.data.name)) return;

  try {
      client.scommands.get(interaction.data.name).execute(interaction);
  } catch (error) {
      console.log(`Error from command ${interaction.data.name} : ${error.message}`);
      console.log(`${error.stack}\n`)
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
    type: 4,
    data: {
        content: `Sorry, there was an error executing that command!`
      }
    }
  })
  }
  
})