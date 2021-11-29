# Youtube Music Discord rich presence

Adds Discord rich presnece for Youtube music

![Example](https://i.imgur.com/AkJ3brS.png)

###

## Installing

After cloning (or downloading) this repo installing is done in two parts.

### 1. Extension

#### Firefox

Go to `about:debugging#/runtime/this-firefox` on your browser and add *temporary* extension. Select manifest.json from the repo.

#### Chrome

Go to `chrome://extensions/` on your browser and enable developer mode, then add unpacked and select the cloned repo.

### 2. Rich presence service

**Make sure you run `npm install`** first

#### Windows

Run this command
`npm install -g qckwinsvc`
then run command `qckwinsvc`.

When prompted put:
* For service name put `ytmdrp` (or anything else)
* Put a description of your choosing
* For script put `ytmdrp.js`

#### Linux

Create a autostart of `ytmdrp.js` using whatever service manager you have (Systemd service)
