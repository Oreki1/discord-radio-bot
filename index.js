require('dotenv').config();

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');

// ─── Клиент үүсгэх ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

// ─── Глобал төлөв ─────────────────────────────────────────────────────────────
let voiceConnection = null;
let audioPlayer     = null;
let isPlaying       = false;
let reconnectTimer  = null;

const RADIO_URL  = process.env.RADIO_URL;
const GUILD_ID   = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

// ─── Slash командуудыг уншиж Collection-д хадгалах ──────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.data.name, cmd);
}

// ─── Аудио тоглуулах ─────────────────────────────────────────────────────────
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
    console.log(`[Radio] YouTube тоглуулж байна: ${RADIO_URL}`);
  } catch (err) {
    console.error('[Radio] Алдаа:', err.message);
    setTimeout(() => playRadio(), 5000);
  }
}

// ─── Voice Channel-д холбогдох ───────────────────────────────────────────────
async function connectToChannel(guild) {
  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    console.error('[Bot] Voice Channel олдсонгүй! CHANNEL_ID-г шалгана уу.');
    return;
  }

  try {
    // Хуучин холболт байвал устгах
    if (voiceConnection) {
      voiceConnection.destroy();
      voiceConnection = null;
    }

    voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId:   guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    // AudioPlayer үүсгэх
    audioPlayer = createAudioPlayer();
    voiceConnection.subscribe(audioPlayer);

    // ── AudioPlayer event-үүд ──────────────────────────────────────────────
    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      console.log('[Player] Idle болов — дахин тоглуулж байна...');
      setTimeout(() => playRadio(), 3000);
    });

    audioPlayer.on('error', (err) => {
      console.error('[Player] Алдаа:', err.message);
      setTimeout(() => playRadio(), 5000);
    });

    // ── VoiceConnection event-үүд ──────────────────────────────────────────
    voiceConnection.on(VoiceConnectionStatus.Ready, () => {
      console.log('[Voice] Холбогдлоо ✓');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      playRadio();
    });

    voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.warn('[Voice] Холболт тасарлаа — дахин оролдож байна...');
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling,   5_000),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting,   5_000),
        ]);
        // Дахин холбогдох процесс эхэллээ
      } catch {
        // Холбогдож чадсангүй → reconnect schedule хийх
        voiceConnection.destroy();
        voiceConnection = null;
        isPlaying = false;
        scheduleReconnect();
      }
    });

    voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
      console.warn('[Voice] Connection устгагдлаа.');
      audioPlayer?.stop();
      isPlaying = false;
    });

    voiceConnection.on('error', (err) => {
      console.error('[Voice] Connection алдаа:', err.message);
      scheduleReconnect();
    });

    // Ready болтол хүлээх
    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30_000);

  } catch (err) {
    console.error('[Bot] Холбогдоход алдаа гарлаа:', err.message);
    scheduleReconnect();
  }
}

// ─── Auto-Reconnect: 15 секунд дараа дахин оролдох ──────────────────────────
function scheduleReconnect(delayMs = 15_000) {
  if (reconnectTimer) return; // Аль хэдийн товлогдсон
  console.log(`[Bot] ${delayMs / 1000}с дараа дахин холбогдоно...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
      await connectToChannel(guild);
    } else {
      console.error('[Bot] Guild олдсонгүй.');
    }
  }, delayMs);
}

// ─── Бот бэлэн болоход ────────────────────────────────────────────────────────
client.once('clientReady', async () => {
  console.log(`\n✅ Бот нэвтэрлээ: ${client.user.tag}`);
  console.log(`📻 Радио URL    : ${RADIO_URL}`);
  console.log(`🔊 Channel ID   : ${CHANNEL_ID}\n`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error('[Bot] Guild олдсонгүй! GUILD_ID-г шалгана уу.');
    return;
  }

  await connectToChannel(guild);
});

// ─── Slash командын handler ───────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, {
      voiceConnection,
      audioPlayer,
      isPlaying,
      connectToChannel,
      playRadio,
      stopRadio: () => {
        audioPlayer?.stop();
        voiceConnection?.destroy();
        voiceConnection = null;
        isPlaying = false;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      },
      setIsPlaying: (val) => { isPlaying = val; },
      RADIO_URL,
      CHANNEL_ID,
    });
  } catch (err) {
    console.error('[Command] Алдаа:', err);
    const msg = { content: '❌ Команд гүйцэтгэхэд алдаа гарлаа.', ephemeral: true };
    interaction.replied || interaction.deferred
      ? await interaction.followUp(msg)
      : await interaction.reply(msg);
  }
});

// ─── Интернет дахин холбогдсон үед шалгах (5 минут тутамд) ──────────────────
setInterval(() => {
  if (!voiceConnection && !reconnectTimer) {
    console.log('[Heartbeat] Холболт байхгүй — дахин оролдож байна...');
    scheduleReconnect(1000);
  }
}, 5 * 60 * 1000);

// ─── Бот нэвтрэх ──────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
