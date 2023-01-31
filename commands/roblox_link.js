const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dayjs = require('dayjs');
const Mustache = require('mustache');
const config = require('../config.json');
const user_bans = require('../user_bans.js');

const command = new SlashCommandBuilder()
	.setName('robloxlink')
	.setDescription('Links your roblox account to your discord account')
	.addStringOption(option =>
		option
			.setName('url')
			.setDescription('Url of your roblox account')
			.setRequired(true))
	.setDMPermission(true);

async function execute(interaction) {
	await interaction.reply({ content: 'Link', ephemeral: true });
}

module.exports = { data: command, execute }