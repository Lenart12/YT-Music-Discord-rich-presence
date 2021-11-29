function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TheEyeOfYoutube {
  constructor() {
    // Rate limit is 15 seconds!
    this._lastTime = {};
    this.onchange = undefined;
    this._updateWatcher = setInterval(this._checkForChanges, 2000, this);
    // this._checkForChanges(this);
  }

  _checkForChanges(self) {
    const new_value = self.getCurrentState();

    const timeDiff = new_value.startTimestamp - self._lastTime.startTimestamp;
    const isDifferentTime = isNaN(timeDiff) || Math.abs(timeDiff) > 1000;

    if (JSON.stringify(new_value) !== JSON.stringify(self._lastTime) && isDifferentTime) {
      console.log('Current state is', new_value);
      self._lastTime = new_value;

      if(self.onchange !== undefined) {
        self.onchange(new_value);
      }
    }
  }

  getCurrentState() {
    const hasPlayer = document.getElementsByClassName("byline style-scope ytmusic-player-bar").length !== 0;

    if (hasPlayer) {
      const title = document.getElementsByClassName("title style-scope ytmusic-player-bar")[0].innerText;
      const byline = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].innerText;
      const time = document.getElementsByClassName("time-info style-scope ytmusic-player-bar")[0].innerText;
      const isPaused = document.getElementsByClassName('paused-mode').length === 1;
      let nowDate = Date.now();
      nowDate -= nowDate % 1000;
      const startTime = nowDate - time.split(' / ')[0].split(':').map(t => parseInt(t)).reverse().map((t, i) => t * Math.pow(60, i)).reduce((a,b) => a+b) * 1000;

      return {
        state: byline,
        details: title,
        startTimestamp: isPaused ? undefined : startTime,
        largeImageKey: 'yt',
        smallImageKey: isPaused ? 'pause' : undefined,
        smallImageText: isPaused ? `Paused (${time})` : undefined,
        instance: true,
      };
    } else {
      return {
        state: 'Not listening to anything',
        details: undefined,
        startTimestamp: undefined,
        largeImageKey: 'yt',
        instance: true,       
      }
    }
  }

  stop() {
    clearInterval(this._updateWatcher);
  }
}

let hasWarnedConnection = false;

// Extension entry point
async function main() {
  
  try {
    // Start new connection
    const ws = new WebSocket('ws://127.0.0.1:6462');
    
    // Define helper function
    ws.sendJS = (obj) => {
      ws.send(JSON.stringify(obj));
    };
    ws.lastPong = 0;
    
    // On succesfull connection
    ws.addEventListener('open', function (ev) {
      console.log('Got connection with RPC server')
      
      // Message from server handler
      ws.addEventListener('message', (ev) => {
        if (ev.data === "pong") {
          ws.lastPong = Date.now();
        }
      });
      
      // Error handler
      ws.addEventListener('error', (ev) => {
        console.log('Error', ev)
        clearInterval(ws.pingInterval);
        clearInterval(ws.updateInterval);
        ws.eye.stop();
        ws.close();
        main();
      });
      
      // Send ping command every 5 seconds
      ws.pingInterval = setInterval(() => {
        ws.sendJS({cmd: "ping"});
      }, 5000);
      
      ws.eye = new TheEyeOfYoutube();
      ws.eye.onchange = (data) => {
        ws.sendJS({
          cmd: "set",
          activity: data
        });
      };
    });
    
    // Retry connection if not established after 2 seconds
    setTimeout(() => {
      if(ws.readyState !== 1) {
        if(!hasWarnedConnection) {
          console.warn('Can\'t connect to RPC proxy')
          hasWarnedConnection = true;
        }
        ws.close();
        main();
      }
    }, 2000);
  } catch (error) {
    // Catch any errors
    console.error(error);
    await sleep(10000);
    main();
  }
}

console.log("Started Youtube Music Discord Rich Presence");
main();