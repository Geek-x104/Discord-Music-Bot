require('dotenv').config(); // initializes dotenv
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const pingCommand = {
  name: 'ping',
  description: 'Check if the bot is working properly',
  execute(interaction) {
    interaction.reply('pong!');
  },
};

const joinCommand = {
  name: 'join',
  description: 'Join a voice channel',
  execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      interaction.reply('You need to be in a voice channel to use this command!');
      return;
    }

    voiceChannel.join().then(() => {
      interaction.reply(`Joined ${voiceChannel.name}!`);
    }).catch((error) => {
      console.error(error);
      interaction.reply('Error joining voice channel!');
    });
  },
};

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
  const guildId = interaction.guild.id; // Declare guildId here

  if (!interaction.isCommand()) return;

  if (interaction.commandName === pingCommand.name) {
    pingCommand.execute(interaction);
  } else if (interaction.commandName === joinCommand.name) {
    joinCommand.execute(interaction);
  }

  // Register commands for the guild
  const commands = [pingCommand, joinCommand];
  await client.application.commands.set(commands, guildId);
  console.log(`Commands registered for guild ${guildId}!`);
});

client.commands = [pingCommand, joinCommand];

client.login(process.env.CLIENT_TOKEN); // signs the bot in with token