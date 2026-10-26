# SportLinkMain

A lightweight SportLink login demo served by Node.js 18+.

Start it with `node server.js`, then open http://127.0.0.1:3000. Users can create an account with an email and password; credentials are hashed and user records persist in `.data/users.json` on the server. Login sessions use an HTTP-only cookie and are held in memory (sessions end when the server restarts).

## Google sign-in setup

Create an OAuth 2.0 **Web application** client ID in Google Cloud Console. Add the origin where SportLink is served (for local development: `http://127.0.0.1:3000`) to **Authorized JavaScript origins**, then start the server with `GOOGLE_CLIENT_ID` set to that client ID. For PowerShell:

```powershell
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
node server.js
```

Google token validation is performed by the server. No client secret is used or exposed in the browser.

## Local admin demo

In a terminal, run `node server.js --create-admin` and follow the prompts to save an admin email and password in the server-side user file. Then start the server with `node server.js` and visit `http://127.0.0.1:3000/admin` (use the same host and port shown by the server if you changed them). The admin dashboard lists client accounts and a client count. Admin accounts are role-checked by the server and do not appear in the client list.
