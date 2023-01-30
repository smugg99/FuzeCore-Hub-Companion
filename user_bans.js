const fs = require('fs');
const dayjs = require('dayjs');
const LocalStorage = require('node-localstorage').LocalStorage;
const config = require('./config.json');

const bannedUsersStoragePath = './' + config.bannedUsersStorageName;
const bannedUsersStorage = new LocalStorage(bannedUsersStoragePath);

function hoursToMiliseconds(hours) {
	return hours * 3600000;
}

function registerBan(targetUser, banDuration, banReason, guildId, timestamp) {
	console.log('Registering ban for user: ', targetUser, ' with a duration of: ', banDuration, ' and reason: ', banReason);

	if (bannedUsersStorage.getItem(targetUser)) { 
		console.log('User: ', targetUser, ' already has a ban record!'); return false;
	}

	var banRecordObject = {
		userId: targetUser.id,
		guildId: guildId,
		timestamp: timestamp,
		duration: hoursToMiliseconds(banDuration),
		reason: banReason,
	};

	var encodedJson = JSON.stringify(banRecordObject);
	bannedUsersStorage.setItem(targetUser.id, encodedJson);

	return true;
}

function unregisterBan(targetUser) {
	console.log('Unregistering ban for user: ', targetUser);

	if (!bannedUsersStorage.getItem(targetUser)) { 
		console.log('User: ', targetUser, ' doesn\' have a registered ban!'); return false;
	}

	bannedUsersStorage.removeItem(targetUser.id);

	return true;
}

function getBanRecords() {
	var banRecords = [];
	const bannedUsersRecords = fs.readdirSync(bannedUsersStoragePath);

	for (const userId of bannedUsersRecords) {
		const banRecord = bannedUsersStorage.getItem(userId);
		if (!banRecord) { console.log('Invalid ban record for file: ', userId); continue; }
		
		var shouldBeUnbannedYet = false;
		try {
			const banRecordObject = JSON.parse(banRecord);

			if (banRecordObject.duration && banRecordObject.duration) {
				shouldBeUnbannedYet = (Date.now() >= banRecordObject.timestamp + banRecordObject.duration)? true : false;
			}

			if (shouldBeUnbannedYet) {
				banRecords.push(banRecordObject);
			}
		} catch (error) {
			console.error('There has been an error while trying to parse: ', banRecord, error);
			continue;
		}
	}

	return banRecords;
}

async function refreshRecords(client) {
	console.log('Refreshing ban records!');
	var banRecords = getBanRecords();
	for (const banRecord of banRecords) {
		if (!banRecord.userId || !banRecord.guildId) { continue; }

		const guild = await client.guilds.cache.get(banRecord.guildId);
		const user = await client.users.fetch(banRecord.userId);

		try {
			guild.members.unban(banRecord.userId);
			unregisterBan(user);
		} catch (error) {
			console.log('There has been an error while unbanning user id', banRecord.userId, ' from guild id: ', banRecord.guildId, error);
			continue;
		}

		console.log('Unbanned user id: ', banRecord.userId, ' from guild id: ', banRecord.guildId);
	}
}

module.exports = { registerBan, unregisterBan, getBanRecords, refreshRecords };