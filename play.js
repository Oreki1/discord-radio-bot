const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('📻 Радио стримийг тоглуулна'),

  async execute(interaction, { isPlaying, connectToChannel, playRadio, audioPlayer, RADIO_URL, CHANNEL_ID }) {
    await interaction.deferReply({ ephemeral: true });

    if (isPlaying) {
      return interaction.editReply({
        content: `▶️ Радио аль хэдийн тоглуулж байна!\n🔗 \`${RADIO_URL}\``,
      });
    }

    const guild = interaction.guild;
    await connectToChannel(guild);

    return interaction.editReply({
      content: `✅ **Радио эхэллээ!**\n🔗 \`${RADIO_URL}\`\n🔊 Channel: <#${CHANNEL_ID}>`,
    });
  },
};
