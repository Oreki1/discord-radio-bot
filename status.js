const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Ботын одоогийн байдлыг харуулна'),

  async execute(interaction, { voiceConnection, isPlaying, RADIO_URL, CHANNEL_ID }) {
    const connStatus = voiceConnection
      ? voiceConnection.state.status
      : 'Холбогдоогүй';

    const statusEmoji = {
      [VoiceConnectionStatus.Ready]:       '🟢 Бэлэн',
      [VoiceConnectionStatus.Connecting]:  '🟡 Холбогдож байна',
      [VoiceConnectionStatus.Signalling]:  '🟡 Дохио илгээж байна',
      [VoiceConnectionStatus.Disconnected]:'🔴 Тасарсан',
      [VoiceConnectionStatus.Destroyed]:   '⚫ Устгагдсан',
    };

    const embed = new EmbedBuilder()
      .setTitle('📻 Радио Ботын Статус')
      .setColor(isPlaying ? 0x57F287 : 0xED4245)
      .addFields(
        {
          name: '▶️ Тоглуулж байгаа эсэх',
          value: isPlaying ? '✅ Тийм' : '❌ Үгүй',
          inline: true,
        },
        {
          name: '🔌 Холболтын байдал',
          value: statusEmoji[connStatus] ?? `❓ ${connStatus}`,
          inline: true,
        },
        {
          name: '📡 Радио URL',
          value: `\`${RADIO_URL}\``,
          inline: false,
        },
        {
          name: '🔊 Voice Channel',
          value: `<#${CHANNEL_ID}>`,
          inline: true,
        },
        {
          name: '⏱️ Uptime',
          value: formatUptime(process.uptime()),
          inline: true,
        },
      )
      .setFooter({ text: 'Discord Radio Bot • 24/7' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}ц ${m}м ${s}с`;
}
