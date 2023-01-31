const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dayjs = require('dayjs');
const Mustache = require('mustache');
const config = require('../config.json');
const user_bans = require('../user_bans.js');

const command = new SlashCommandBuilder()
	.setName('robloxunlink')
	.setDescription('Unlinks your roblox account from your discord acccount')
	.setDMPermission(true);

async function execute(interaction) {
	await interaction.reply({ content: 'Unlink', ephemeral: true });
}

module.exports = { data: command, execute }