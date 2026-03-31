const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Ботын байдлыг харуулна'),
  async execute(interaction, { voiceConnection, isPlaying, RADIO_URL, CHANNEL_ID }) {
    const connStatus = voiceConnection ? voiceConnection.state.status : 'Холбогдоогүй';
    const statusEmoji = {
      [VoiceConnectionStatus.Ready]: '🟢 Бэлэн',
      [VoiceConnectionStatus.Connecting]: '🟡 Холбогдож байна',
      [VoiceConnectionStatus.Disconnected]: '🔴 Тасарсан',
    };
    const embed = new EmbedBuilder()
      .setTitle('📻 Радио Ботын Статус')
      .setColor(isPlaying ? 0x57F287 : 0xED4245)
      .addFields(
        { name: '▶️ Тоглуулж байгаа эсэх', value: isPlaying ? '✅ Тийм' : '❌ Үгүй', inline: true },
        { name: '🔌 Холболт', value: statusEmoji[connStatus] ?? '❓ Тодорхойгүй', inline: true },
        { name: '📡 Радио URL', value: `\`${RADIO_URL}\``, inline: false },
        { name: '🔊 Channel', value: `<#${CHANNEL_ID}>`, inline: true },
      )
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
