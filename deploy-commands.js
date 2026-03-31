/**
 * deploy-commands.js
 * Slash командуудыг Discord API-д бүртгэх скрипт.
 * Зөвхөн нэг удаа эсвэл команд өөрчлөгдсөн үед ажиллуулна.
 *
 * Ажиллуулах: node deploy-commands.js
 */

require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  commands.push(cmd.data.toJSON());
  console.log(`📋 Команд уншив: /${cmd.data.name}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('\n🔄 Slash командуудыг Discord-д бүртгэж байна...');

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log(`✅ ${data.length} команд амжилттай бүртгэгдлээ!\n`);
  } catch (err) {
    console.error('❌ Бүртгэхэд алдаа гарлаа:', err);
  }
})();
