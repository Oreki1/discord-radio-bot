const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('📻 Радио тоглуулна'),
  async execute(interaction, { getIsPlaying, connectToChannel, RADIO_URL }) {
    await interaction.deferReply({ flags: 64 });
    if (getIsPlaying()) {
      return interaction.editReply({ content: `▶️ Аль хэдийн тоглуулж байна!\n🔗 \`${RADIO_URL}\`` });
    }
    await connectToChannel(interaction.guild);
    return interaction.editReply({ content: `✅ Радио эхэллээ!\n🔗 \`${RADIO_URL}\`` });
  },
};
