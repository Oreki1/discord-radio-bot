const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Радиог зогсооно'),
  async execute(interaction, { isPlaying, stopRadio }) {
    await interaction.deferReply({ ephemeral: true });
    if (!isPlaying) return interaction.editReply({ content: '⚠️ Радио тоглуулж байхгүй байна.' });
    stopRadio();
    return interaction.editReply({ content: '⏹️ Радио зогсоогдлоо.' });
  },
};
