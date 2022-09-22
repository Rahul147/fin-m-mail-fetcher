const { google } = require('googleapis');


async function getMessage(auth, id) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id
    });
    return res.data;
}
exports.getMessage = getMessage;

async function getAttachment(auth, messageID, attachmentID) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.attachments.get({
        userId: 'me',
        id: attachmentID,
        messageId: messageID
    });
    return res.data;
}
exports.getAttachment = getAttachment;

async function listMails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:Emailstatements.cards@hdfcbank.net has:attachment'
    });
    return res.data;
}
exports.listMails = listMails;
