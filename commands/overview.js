const { SlashCommandBuilder } = require('discord.js');

const command = new SlashCommandBuilder()
.setName('overview')
.setDescription('Shows user\'s overview!')

async function execute(interaction) {
	await interaction.reply('Deeeeeez nuttttsss nigga gottem ;asm,dfkldksalkflksdkte9o49378s././/');
}

module.exports = { data: command, execute }