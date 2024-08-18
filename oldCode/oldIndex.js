require('dotenv').config()
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const { ActivityType } = require('discord.js');
const queue = new Map();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on('ready', () => {
  console.log('Music bot is online!');
  client.user.setActivity('for your commands! Use "!play" to play music.', { type: ActivityType.Listening });
});

client.on('messageCreate', async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!play') {
    const songUrl = args[0];
    if (!songUrl) return message.channel.send('Please provide a YouTube URL or song title!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');

    const songInfo = await ytdl.getInfo(songUrl);
    const song = {
      title: songInfo.title,
      url: songUrl,
    };

    if (!queue.has(message.guild.id)) queue.set(message.guild.id, []);
    queue.get(message.guild.id).push(song);

    try {
      let connection = voiceChannel.joinable ? await voiceChannel.join({ selfDeaf: true }) : voiceChannel.guild.me.voice.connection;
      if (!connection) {
        connection = await voiceChannel.join({ selfDeaf: true });
      }
      playSong(connection, queue, message);
    } catch (error) {
      console.error(error);
      message.channel.send('Error joining voice channel!');
    }
  } else if (command === '!skip') {
    if (!queue.has(message.guild.id)) return message.channel.send('No songs in queue!');
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send('You need to be in a voice channel to skip songs!');
    const connection = voiceChannel.guild.me.voice.connection;
    if (!connection) return message.channel.send('I am not connected to a voice channel!');
    connection.destroy();
  } else if (command === '!queue') {
    if (!queue.has(message.guild.id)) return message.channel.send('No songs in queue!');
    const songs = queue.get(message.guild.id).slice();
    let queueMessage = '';
    for (let i = 0; i < songs.length; i++) {
      queueMessage += `${i + 1}. ${songs[i].title}\n`;
    }
    message.channel.send(queueMessage);
  } else if (message.content === '!crash') {
    message.channel.send('Crashing the bot...');
    process.exit(1);
  }
});

async function playSong(connection, queue, message) {
  const song = queue.get(message.guild.id).shift();
  if (!song) {
    connection.disconnect();
    return;
  }

  const dispatcher = connection.play(ytdl(song.url, { filter: 'audioonly' }));
  dispatcher.on('finish', () => {
    playSong(connection, queue, message);
  });

  message.channel.send(`Now playing: **${song.title}**`);
}

client.login(process.env.CLIENT_TOKEN);