const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Радиог зогсооно (auto-reconnect идэвхгүй болно)'),

  async execute(interaction, { isPlaying, stopRadio }) {
    await interaction.deferReply({ ephemeral: true });

    if (!isPlaying) {
      return interaction.editReply({ content: '⚠️ Одоо радио тоглуулж байхгүй байна.' });
    }

    stopRadio();

    return interaction.editReply({
      content: '⏹️ **Радио зогсоогдлоо.**\nДахин тоглуулахдаа `/play` командыг ашиглана уу.',
    });
  },
};
