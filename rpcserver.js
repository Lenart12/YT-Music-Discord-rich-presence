const WebSocket = require('ws');

async function main() {
  console.log("Started Youtube Music Discord Rich Presence");
  
  const wss = new WebSocket.Server({ port: 6462 });
  let client = undefined;

  wss.on('connection', function connection(ws, req) {
    console.log('Connection from ', ws);
    ws.isAlive = true;
    ws.exit = () => {
      console.log('Exiting connection');
      if (ws.pingChecker) clearInterval(ws.pingChecker);
      if (client) {
        let clientInUse = false;
        for(const socket of wss.clients) {
          if (socket.isAlive) {
            clientInUse = true;
            break;
          }
        }
        
        if(!clientInUse) {
          client.disconnect();
          client = undefined;
        }
      }
      if(ws.readyState <= 1)
      ws.close();
    }

    ws.on('message', function message(data) {
      if(!client) {
        client = require('discord-rich-presence')('914498048174997554');
        client.on('error', (error) => {
          console.error(error)
        });
      }

      const msg = JSON.parse(data.toString());

      switch(msg.cmd) {
        case "ping": ws.send("pong"); ws.isAlive = true; break;
        case "set":{
          try {
            client.updatePresence(msg.activity);
            console.log('Set new activity', msg.activity);
          } catch (error) {
            console.log(error)
          }
          break;
        }
        default: console.log('received: %s', msg); break;
      }
    });

    ws.on('error', (error) => {
      console.error(error);
      ws.exit();
    });
  
    ws.pingChecker = setInterval(() => {
      if(ws.readyState == 1 &&  ws.isAlive) {
        ws.isAlive = false;
      } else {
        ws.exit();
      }
    }, 10000);
  });
  
  wss.on('error', console.error);
}

main();
