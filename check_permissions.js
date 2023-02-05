module.exports = (guildMember, permissions) => {
	return guildMember.permissions.has(permissions, { checkAdmin: true, checkOwner: true });
};