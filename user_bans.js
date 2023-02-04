const fs = require('fs');
const dayjs = require('dayjs');
const LocalStorage = require('node-localstorage').LocalStorage;
const config = require('./config.json');
const { EmbedBuilder } = require('@discordjs/builders');

const banRecordsStoragePath = config.generics.storagesPath + config.generics.banRecordsStorageName;
const banRecordsStorage = new LocalStorage(banRecordsStoragePath);

function hoursToMiliseconds(hours) { return hours * 3600000; }

function newBanRecordObject(targetUser, banDuration, banReason, guildId, timestamp) {
	return {
		userId: targetUser.id,
		guildId: guildId,
		timestamp: timestamp,
		duration: hoursToMiliseconds(banDuration),
		reason: banReason,
	};
}

function buildEmbedForGuildBan(guildBan) {
	console.log(guildBan);
	var thumbnailUrl = guildBan.user.displayAvatarUrl();

	const wholeUsername = guildBan.user.tag;
	const wholeReason = 'Reason: ' + guildBan.reason;
	const wholeUserId = 'User Id: ' + guildBan.user.id;
	var banEndsOnTimestamp = '(no ban record found)';
		
	const banRecord = getBanRecordFromUserId(guildBan.user.id);
	if (banRecord) {
		const banRecordObject = JSON.parse(banRecord);
		if (banRecordObject.timestamp && banRecordObject.duration) {
			const banEndTimestamp = banRecordObject.timestamp + banRecordObject.duration;

			const timestamp = dayjs(banEndTimestamp).utc().format('DD/MM/YYYY HH:mm');
			banEndsOnTimestamp = 'Ends on: ' + timestamp + ' UTC';
		}
	}

	var description = wholeUserId + '\n' + wholeReason + '\n' + banEndTimestamp;

	const banEmbed = new EmbedBuilder()
		.setTitle(Mustache.render(config.messages.userBanned, { name: wholeUsername }))
		.setColor(config.colors.primary)
		.setThumbnail(thumbnailUrl)
		.setDescription(description);
	
	return banEmbed;
}

function registerBan(targetUser, banDuration, banReason, guildId, timestamp) {
	console.log('Registering ban for user: ', targetUser, ' with a duration of: ', banDuration, ' and reason: ', banReason);

	if (banRecordsStorage.getItem(targetUser)) { 
		console.log('User: ', targetUser, ' already has a ban record!'); return false;
	}

	var banRecordObject = newBanRecordObject(targetUser, banDuration, banReason, guildId, timestamp);
	var encodedJson = JSON.stringify(banRecordObject);
	banRecordsStorage.setItem(targetUser.id, encodedJson);

	return true;
}

function unregisterBan(targetUser) {
	console.log('Unregistering ban for user: ', targetUser);

	if (!banRecordsStorage.getItem(targetUser)) { 
		console.log('User: ', targetUser, ' doesn\' have a registered ban!'); return false;
	}

	banRecordsStorage.removeItem(targetUser.id);

	return true;
}

function getBanRecordFromUserId(userId) {
	return banRecordsStorage.getItem(userId);
}

function getBanRecords() {
	var banRecords = [];
	const bannedUsersRecords = fs.readdirSync(banRecordsStoragePath);
 
	for (const userId of bannedUsersRecords) {
		const banRecord = banRecordsStorage.getItem(userId);
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

module.exports = { registerBan, unregisterBan, getBanRecords, getBanRecordFromUserId, refreshRecords, buildEmbedForGuildBan };