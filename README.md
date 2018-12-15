# CommuJukeBox
The Community Jukebox


## Description
Build a community video playlist. Currently set up to be integrated with Slack; however, for other messaging platform,
an endpoint `/api/{platform}` needs to be implemented with proper validation and pass the video link to play and a way to uniquely
identify the user who requested it.

Using a messenging platform like Slack, a user can send a video link to the backend service which will be routed to a central consumer
for broadcasting on a larger screen.


## Features
- [x] Slack Integration
- [x] User Request Throttling (5 minutes)
- [x] Administrative Queueing Endpoint to bypass Throttling
- [x] Validate Youtube videos


## Setup
1. Clone the repo: `git clone {}`
2. Change into the repo directory: `cd commujukebox`
3. Install dependencies: `yarn install` or `npm install`
4. Create Slack workspace or use an existing one
5. Create a Slack [app](https://api.slack.com/apps)
6. Create .env file with values filled out:
```
NODE_ENV=production  # state of deployment
HOST=localhost  # host of api server
SERVER_PORT=8080  # port of api server
PRIVILEDGED_USER=changeme   # just a specific username for the administrative user
PRIVILEDGED_TOKEN=changeme  # secret used to authenticate administrative endpoint

SLACK_VERSION=v0  # slack schema version used to verify requests
SLACK_VERIFICATION_SECRET=changeme  # slack verification secret used to verify requests

REACT_APP_IO_HOST=localhost  # socket.io host for frontend to connect to
REACT_APP_IO_PORT=8081  # socket.io port for frontend to connext to
```
7. Build frontend: `yarn build`
8. Start server: `yarn serve`
9. Install [ngrok](https://ngrok.com/)
10. Start ngrok in separate terminal window: `ngrok http {SERVER_PORT}` (SERVER_PORT from .env)
11. Create a Slack `Slash commands` and point it to the provided ngrok tunnel endpoint and append `/api/slack`
12. In a different tab or window, go to `localhost:{SERVER_PORT}` and you should see a simplistic frontend
13. Return to Slack and type the Slash command you created with a Youtube link: `/play youtube.com/watch?v={videoId}`
14. A video should start playing `localhost:{SERVER_PORT}`
