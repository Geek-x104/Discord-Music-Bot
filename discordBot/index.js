const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();

const queue = new Map();

client.on('ready', () => {
  console.log('Music bot is online!');
});

client.on('message', async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!play') {
    const songUrl = args[0];
    if (!songUrl) return message.reply('Please provide a YouTube URL or song title!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

    const songInfo = await ytdl.getInfo(songUrl);
    const song = {
      title: songInfo.title,
      url: songUrl,
    };

    if (!queue.has(message.guild.id)) queue.set(message.guild.id, []);
    queue.get(message.guild.id).push(song);

    try {
      const connection = await voiceChannel.join();
      playSong(connection, queue, message);
    } catch (error) {
      console.error(error);
      message.reply('Error joining voice channel!');
    }
  } else if (command === '!skip') {
    if (!queue.has(message.guild.id)) return message.reply('No songs in queue!');
    const connection = voiceChannel.connection;
    connection.dispatcher.destroy();
  } else if (command === '!queue') {
    if (!queue.has(message.guild.id)) return message.reply('No songs in queue!');
    const songs = queue.get(message.guild.id);
    let queueMessage = '';
    for (let i = 0; i < songs.length; i++) {
      queueMessage += `${i + 1}. ${songs[i].title}\n`;
    }
    message.reply(queueMessage);
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

  message.reply(`Now playing: **${song.title}**`);
}

client.login('YOUR_BOT_TOKEN_HERE');