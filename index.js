const path = require('path');
const googleAuthLibrary = require("google-auth-library")
const express = require('express')
const app = express()

const cookieParser = require('cookie-parser');
const { listMails, getMessage, getAttachment } = require("./utils.js");
app.use(cookieParser());
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, 'config', 'credentials.json');

const keyFile = require(CREDENTIALS_PATH);
const keys = keyFile.installed || keyFile.web;

const client = new googleAuthLibrary.OAuth2Client({
    clientId: keys.client_id,
    clientSecret: keys.client_secret,
});

function generateOAuth2URL(_provider = "gmail") {
    return client.generateAuthUrl({
        redirect_uri: keys.redirect_uris[0],
        access_type: 'offline',
        scope: SCOPES,
    });
}

app.get('/oauth2/gmail/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await client.getToken({
        code: code,
        redirect_uri: keys.redirect_uris?.[0],
    });
    res.cookie('tokens', JSON.stringify(tokens), { maxAge: COOKIE_MAX_AGE, httpOnly: true });
    res.redirect('/gmail/fetch-mail');
});

app.get('/oauth2/gmail', async (_req, res) => {
    const redirectURL = generateOAuth2URL();
    res.redirect(redirectURL);
});

app.use(function tokenExtractionMiddleware(req, res, next) {
    const tokensString = req.cookies?.tokens || '';
    if (!tokensString) return res.status(401).json({ message: 'unauthorised' });
    const tokens = JSON.parse(tokensString);
    client.credentials = tokens;
    req.client = client;
    return next();
});

app.get('/gmail/fetch-mail', async ({ client }, res) => {
    const messages = await listMails(client);
    res.json(messages);
});

app.get('/gmail/fetch-mail/:id', async ({ client, params }, res) => {
    const { id } = params;
    const message = await getMessage(client, id);
    const attachmentID = message?.payload?.parts?.[1]?.body?.attachmentId;
    const attachment = await getAttachment(client, id, attachmentID);
    const buffer = Buffer.from(attachment.data, 'base64');
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="result_buffer.pdf"',
    });
    res.end(buffer);
})

app.listen(8000, () => {
    console.log('Authenticate on  http://localhost:8000/oauth2/gmail');
    console.log('Messages on http://localhost:8000/gmail/fetch-mail');
});
