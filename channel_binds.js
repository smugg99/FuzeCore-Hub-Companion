const LocalStorage = require('node-localstorage').LocalStorage;
const config = require('./config.json');

const guildsStoragePath = config.generics.storagesPath + config.generics.guildsStorageName;
const guildsStorage = new LocalStorage(guildsStoragePath);

function newGuildStorageObject(guild) {
	return {
		channelIds: {
			general: "",
			commands: "",
			announcements: "",
			bans: "",
		},
	}
}

function checkForGuildStorage(guild) {
	var guildStorage = guildsStorage.getItem(guild.id);
	if (!guildStorage) {
		const guildStorageObject = newGuildStorageObject(guild);
		var encodedJson = JSON.stringify(guildStorageObject);
		guildStorage = guildsStorage.setItem(guild.id, encodedJson);
	}

	return guildStorage;
}

function getChannel() {

}

// Option value is the value of the chosen command option (eg. {'Set bans', value: 'bans'})
function bindChannel(channel, feature) {
	//console.log(channel, feature);

	const guildStorage = checkForGuildStorage(channel.guild);
	const guildStorageObject = JSON.parse(guildStorage);

	console.log(guildStorageObject);

	if (!guildStorageObject.channelIds[feature]) {
		console.log('This channel doesn\'t have an entry!'); return false;
	}

	return true;
}

module.exports = { checkForGuildStorage, bindChannel };