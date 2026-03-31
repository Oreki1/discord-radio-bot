const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Радиог зогсооно'),
  async execute(interaction, { getIsPlaying, stopRadio }) {
    await interaction.deferReply({ flags: 64 });
    if (!getIsPlaying()) {
      return interaction.editReply({ content: '⚠️ Радио тоглуулж байхгүй байна.' });
    }
    stopRadio();
    return interaction.editReply({ content: '⏹️ Радио зогсоогдлоо.' });
  },
};
