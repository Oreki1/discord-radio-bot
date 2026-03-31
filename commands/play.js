const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('📻 Радио тоглуулна'),
  async execute(interaction, { isPlaying, connectToChannel, RADIO_URL }) {
    await interaction.deferReply({ ephemeral: true });
    if (isPlaying) return interaction.editReply({ content: '▶️ Аль хэдийн тоглуулж байна!' });
    await connectToChannel(interaction.guild);
    return interaction.editReply({ content: `✅ Радио эхэллээ!\n🔗 \`${RADIO_URL}\`` });
  },
};
