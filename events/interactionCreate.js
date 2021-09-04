const client = require("../index");
const config = require("../config.json");
const { Collection, MessageEmbed } = require("discord.js");
client.on("interactionCreate", async (interaction) => {
  // Slash Command Handling
  if (interaction.isCommand()) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});

    const cmd = client.slashCommands.get(interaction.commandName);
    if (!cmd) return interaction.followUp({ content: "An error has occured " });

    const args = [];

    for (let option of interaction.options.data) {
      if (option.type === "SUB_COMMAND") {
        if (option.name) args.push(option.name);
        option.options?.forEach((x) => {
          if (x.value) args.push(x.value);
        });
      } else if (option.value) args.push(option.value);
    }

    if (cmd) {
      if (!interaction.member.permissions.has(cmd.permissions || [])) {
        interaction.followUp({
          content: "Invalid permissions. You need " + cmd.permissions,
        });
      }
      if (cmd.nsfw && !interaction.channel.nsfw) {
        interaction.followUp({
          embeds: [
            new MessageEmbed()
              .setTitle("WOAH! NSFW not allowed here!")
              .setDescription(
                `Use NSFW commands in a NSFW marked channel (look in channel settings, dummy)`
              )
              .setColor("RED")
              .setImage("https://i.imgur.com/oe4iK5i.gif"),
          ],
        });
        return;
      }
      if (command.ownerOnly && interaction.member.user.id != config.owner) {
        message.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(`Umm... Only the bot owner can use that command.`)
              .setColor("RED"),
          ],
        });
        return;
      }
      cmd.run(client, interaction, args);
    }

    if (interaction.isContextMenu()) {
      await interaction.deferReply({ ephemeral: false });
      const cmd = client.slash.get(interaction.commandName);
      if (!cmd) return interaction.followUp({ content: "An error occured" });
      const args = [];
      interaction.member = interaction.guild.members.cache.get(
        interaction.user.id
      );
      cmd.run(client, interaction, args);
    }
  }
});
