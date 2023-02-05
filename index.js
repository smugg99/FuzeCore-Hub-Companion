const { Client, Collection, Events } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');

const user_bans = require('./user_bans.js');
const spam_filter = require('./spam_filter.js');
const { botToken, clientId } = require('./bot-credentials.json');
const config = require('./config.json');

// Adds every intent possible because the bot will be private
const client = new Client({
	intents: 131071,
});

client.commands = new Collection();

// This is used for removing global commands (use only after an update)
//client.application?.commands.set([]);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found`); return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: config.messages.actionError, ephemeral: true });
	}
});

client.on(Events.MessageCreate, async message => {
	// console.log('New message!');

	if (spam_filter.isMessageValid(message)) {
		// console.log('New message is valid text channel message!');

		spam_filter.filterMessage(message).then(([taggedAsSpam, guildMember, reason]) => {
			console.log(taggedAsSpam, guildMember.user.tag, reason);
			if (!taggedAsSpam || !guildMember) { return; }
			
			spam_filter.takeActions(message, guildMember, reason).catch(
				error => console.log(error)
			);
		}).catch(error => console.log(error));
	}
});

client.on(Events.GuildBanAdd, async guildBan => {
	console.log('Ban added!');
	user_bans.buildEmbedForGuildBan(guildBan);
});

client.on(Events.GuildBanRemove, async guildBan => {
	console.log('Ban removed!');
});

client.on(Events.ClientReady, async interaction => {
	console.log('Client ready!');

	// Check every some time if any banned player needs to be unbanned
	setInterval(user_bans.refreshRecords, config.generics.banRecordsCheckInterval, client);
});

client.login(botToken);