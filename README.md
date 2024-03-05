# GH Scrum Poker
This is an application that integrates with GitHub Projects for seamless import of product backlogs into a UI for easy sprint estimation.
Scrum-Poker will **watch** select repos after the app is installed to a user's GitHub (user acct, org acct, or repo)

- To test this, Scrum Poker is currently installed on this [scrum-poker-test repository](https://github.com/colinwilliams91/scrum-poker-test)
  - Please clone down that repo and use it for [testing](https://github.com/colinwilliams91/scrum-poker?tab=readme-ov-file#to-test)

## Op-Specs

### First Time:
- In your terminal:
```sh
git clone https://github.com/hotfix-studios/scrum-poker.git
cd scrum-poker
npm i
```
- _To gain access to application code you will need to be granted permission from @colinwilliams91 or @bryanpburnside. (contact them via email from respective GH profiles)_
- Change the `local.env` file name to `.env`
- Visit the #🔐-op-credentials channel inside `🦺-GH-SCRUM-POKER` region and plug in the following values:
```env
APP_ID="..."
WEBHOOK_SECRET="..."
CLIENT_ID="..."
INSTALLATION_ID="..."
PRIVATE_KEY="..."

NODE_ENV="development"
PORT="..."
WSS_PORT="..."
WEBHOOK_PATH="..."
```

### To Develop:
- In root of `scrum-poker`
- Make sure your branch is up to date:
  - This will fetch current remote main and merge into your feature-branch
```sh
# fetch and merge remote main into your feature branch
git pull origin main
# Install packages if needed
npm i
```
- Build and run:
```sh
# compile TypeScript files to JavaScript files in `./dist` so that Node can run
npm run build
# Kick off the Node server
npm run server
# Redirects event payloads from our proxy to our app
npx smee -u https://smee.io/hcbsiedRHAM0Aka3 -t http://localhost:3000/api/webhook
```

### To Test:
- Inside your IDE (scrum-poker project)
- Spin up Proxy Webhook Watch Server
```sh
npx smee -u https://smee.io/hcbsiedRHAM0Aka3 -t http://localhost:3000/api/webhook
```
- Spin up Scrum Poker server locally
```sh
npm run server
```
- Make changes for Event you want to test to [this scrum-poker-test repository](https://github.com/colinwilliams91/scrum-poker-test)
  - This will most likely be a change in this repository's GH GUI (issue comment, PR request, etc.)
  - Scrum Poker is installed to and watching that repository
- Navigate to [https://smee.io/hcbsiedRHAM0Aka3](https://smee.io/hcbsiedRHAM0Aka3) in your web browser
- You should now see the JSON Payload for the event you are testing with all information from GH Rest API

### Clear Caches:
- If you have deleted or renamed any files:
  - This will delete old `dist` and re-compile with up-to-date `.ts` files...
```sh
# If Powershell Terminal, from root
.\scripts\build-clear.ps1

# If Bash/ZSH Terminal, from root
./scripts/bash-build-clear.sh
```
- If you want to clean out `node_modules` and reinstall them:
  - This is good if you get a blinking terminal, or a good first step in debugging weird issues in general...
```sh
# If Powershell Terminal, from root
.\scripts\packages-clear.ps1

# If Bash/ZSH Terminal, from root
./scripts/bash-packages-clear.sh
```