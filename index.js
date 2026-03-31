require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');

const fs   = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

let voiceConnection = null;
let audioPlayer     = null;
let isPlaying       = false;
let reconnectTimer  = null;

const RADIO_URL  = process.env.RADIO_URL;
const GUILD_ID   = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.data.name, cmd);
}

async function playRadio() {
  if (!voiceConnection || !audioPlayer) return;
  try {
    const ytdl = require('ytdl-core');
    const stream = ytdl(RADIO_URL, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });
    resource.volume?.setVolume(1);
    audioPlayer.play(resource);
    isPlaying = true;
    console.log(`[Radio] Тоглуулж байна: ${RADIO_URL}`);
  } catch (err) {
    console.error('[Radio] Алдаа:', err.message);
    setTimeout(() => playRadio(), 5000);
  }
}

async function connectToChannel(guild) {
  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) { console.error('[Bot] Channel олдсонгүй!'); return; }

  try {
    if (voiceConnection) { voiceConnection.destroy(); voiceConnection = null; }

    voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    audioPlayer = createAudioPlayer();
    voiceConnection.subscribe(audioPlayer);

    audioPlayer.on(AudioPlayerStatus.Idle, () => setTimeout(() => playRadio(), 3000));
    audioPlayer.on('error', (err) => { console.error('[Player]', err.message); setTimeout(() => playRadio(), 5000); });

    voiceConnection.on(VoiceConnectionStatus.Ready, () => {
      console.log('[Voice] Холбогдлоо ✓');
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      playRadio();
    });

    voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        voiceConnection.destroy();
        voiceConnection = null;
        isPlaying = false;
        scheduleReconnect();
      }
    });

    voiceConnection.on(VoiceConnectionStatus.Destroyed, () => { audioPlayer?.stop(); isPlaying = false; });
    voiceConnection.on('error', (err) => { console.error('[Voice]', err.message); scheduleReconnect(); });

    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30_000);
  } catch (err) {
    console.error('[Bot] Холбогдоход алдаа гарлаа:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect(delayMs = 15_000) {
  if (reconnectTimer) return;
  console.log(`[Bot] ${delayMs / 1000}с дараа дахин холбогдоно...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) await connectToChannel(guild);
  }, delayMs);
}

client.once('clientReady', async () => {
  console.log(`\n✅ Бот нэвтэрлээ: ${client.user.tag}`);
  console.log(`📻 Радио URL    : ${RADIO_URL}`);
  console.log(`🔊 Channel ID   : ${CHANNEL_ID}\n`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) { console.error('[Bot] Guild олдсонгүй!'); return; }
  await connectToChannel(guild);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, {
      getIsPlaying:  () => isPlaying,
      getConnection: () => voiceConnection,
      connectToChannel,
      playRadio,
      stopRadio: () => {
        audioPlayer?.stop();
        voiceConnection?.destroy();
        voiceConnection = null;
        isPlaying = false;
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      },
      RADIO_URL,
      CHANNEL_ID,
    });
  } catch (err) {
    console.error('[Command] Алдаа:', err);
    const msg = { content: '❌ Алдаа гарлаа.', flags: 64 };
    interaction.replied || interaction.deferred ? await interaction.followUp(msg) : await interaction.reply(msg);
  }
});

setInterval(() => {
  if (!voiceConnection && !reconnectTimer) scheduleReconnect(1000);
}, 5 * 60 * 1000);

client.login(process.env.TOKEN);
