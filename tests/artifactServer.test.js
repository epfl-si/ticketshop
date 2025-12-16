require('dotenv').config({ path: '.env' })
const { assertArtifactServer } = require('./artifactServer.functions.js')

const scipers = JSON.parse(process.env.JEST_SCIPERS);
const emails = JSON.parse(process.env.JEST_EMAILS);

await Promise.all(emails.map(async(email) => {
	await assertArtifactServer(email);
}));