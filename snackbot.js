import Common from './controllers/Common';
import Player from './controllers/Player';
import Message from './controllers/Message';
import Config from './config';
import AppData from './data/AppData';
import Emitter from './controllers/Emitter';


const TelegramBot = require('node-telegram-bot-api');
const qr = require('qr-image');
const fs = require('fs');
const sanitize = require('sanitize-filename');

const config = new Config();
const appData = new AppData();
const common = new Common();
const { responseObject } = appData;

//For development
const debug = appData.debug;

const player = new Player();
let messageObj = new Message();

const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

//Event Handlers
Emitter.on('snack_say', (chatId, message) => {
  snackbot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error));
});

//Every Message
//maybe not check for command and just handle admin/stuff that doesn't affect anything.
snackbot.on('message', (message) => {
  const command = common.commandTester.test(message.text);
  messageObj = new Message(message);

  //send error messages to user
  if(!command) {
    //load user data (will create if load fails)
    player.load(message.from).then(() => {
      if(debug) { console.log('player is', player); }
      //we can use emits for this stuff so we don't have to rewrite them
      //otherwise they should just be handled in objects
      if(player.admin === 1) {
        messageObj.handleAdminMessage(message);
      }
      //emit('bot contacted', 'scuarbot');
      if(player.snackbot === 0) {
        player.setContactedBot('snackbot');
      }
      Common.storeMessage(message, player.state, 'SCUARBot');
      //has the player completed the step?
      return completedStep();
    }).then(responseArray => {
      console.log('ra', responseArray);
      if(responseArray) {
        const msgarray = [];
        for (let i = 0; i < responseArray.length; i++) {
          const r = personalize(responseArray[i]);
          msgarray.push(r);
        }
        sendSeries(msgarray);
      }
    }).catch(error => {
      console.error(error);
    });
  }
});

snackbot.onText(/\/tell_user (\w+) (.+)/, (msg, match) => {
  const user = match[1];
  const message = match[2];
  console.info('tell', user, 'this:', message);
  // Maybe add user contacted and wait for specific responses
	snackbot.sendMessage(user, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error));
});

//TODO make all of these common
function personalize(r) {
  let result = r;
  if (messageObj.from.first_name && messageObj.from.first_name !== '') {
    result = r.replace(/PLAYERNAME/g, messageObj.from.first_name);
  } else {
    result = r.replace(/PLAYERNAME/g, 'citizen');
  }
  return result;
}

function sendSeries(messageArray) {
  for(let i = 0; i < messageArray.length; i++) {
    setTimeout(sendMessage, i * 1000, messageArray[i]);
  }
}

function sendMessage(m) {
  return snackbot.sendMessage(messageObj.chat.id, m, {
    parse_mode: 'Markdown'
  }).catch(error => console.error(error));
}

//This can probably be moved to Player
function completedStep() {
  const { text } = messageObj;
  const { state, substate } = player;
  console.log('state is', state);
  const advance = new Promise((resolve, reject) => {
    switch(player.state) {
      case 0:
        if(player.scuar) {
          resolve(['You shouldn\'t be talking to me']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 1:
        if(player.scuar) {
          resolve(['You shouldn\'t be talking to me']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 2:
        if(player.scuar) {
          resolve(['You shouldn\'t be talking to me']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 3:
        if(player.scuar) {
          resolve(['You shouldn\'t be talking to me']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 4:
        if(messageObj.photo) {
          console.log('you won and now doing things...');
          //WIN
          player.state += 1;
          player.save().then(() => {
            return snackbot.sendAudio(messageObj.chat.id, 'CQADAQADGQAD1dFARzUvN20cggnUAg');
          }).then(() => {
              resolve(false);
          });
        } else {
          resolve(responseObject[4].snack.idle);
        }
        break;
      case 5:
        if((parseInt(text, 10) > 3 && parseInt(text, 10) < 7)
          || imatch(text, 'four')
          || imatch(text, 'five')
          || imatch(text, 'six')) {
          //WIN
          player.state += 1;
          player.save();
          resolve(responseObject[6].snack.start);
        } else {
          resolve(responseObject[5].snack.idle);
        }
        break;
      case 6:
        console.log('state 6');
        if(imatch(text, 'banana')) {
          player.state += 1;
          player.save();
          console.log('sending', responseObject[7].snack.start);
          resolve(responseObject[7].snack.start);
          console.log('did we get past this somehow');
        } else {
          console.log('did not match');
          resolve(responseObject[6].snack.idle);
        }
        break;
      case 7:
        if(imatch(text, 'long may he floss')) {
          player.state += 1;
          player.save();
          resolve(responseObject[8].snack.start);
        } else {
          resolve(responseObject[7].snack.idle);
        }
        break;
      case 8:
        resolve(responseObject[8].snack.idle);
        break;
      default:
        resolve(['what in the fuck']);
    }
    resolve(false);
  }).catch(error => {
    console.error(error);
    //reject(error);
  });
  return advance;
}


/* The Following is Temporary Duplication */
function checkState(state) {
  let valid = false;
  if (responseObject[state]) {
    valid = true;
  }
  return valid;
}

snackbot.onText(/^\/(checkup)/i, (msg) => {
  if(debug) { console.log('------- checking player ------'); }
  player.load(msg.from).then(() => {
    let message = '';
    if (checkState(player.state)) {
      message = `your state is set to *${player.state}: ${responseObject[player.state].title}*`;
    } else {
      message = `your state is MESSED UP *${player.state}*`;
    }

    snackbot.sendMessage(msg.chat.id, message, {
      parse_mode: 'Markdown'
    });
  }).catch((error) => console.error(error));
});

snackbot.onText(/^\/(state) (.+)/i, (msg, match) => {
  console.log('------- snack set state ------');
  const state = parseInt(match[2], 10);
  if (checkState(state)) {
    player.setState(state).then(() => {
      const stateInfo = responseObject[player.state];
      snackbot.sendMessage(msg.chat.id,
        `your state is set to *${player.state}: ${stateInfo.title}*`, {
          parse_mode: 'Markdown'
      });
      //console.log('state player', player);
    }).catch((error) => console.error(error));
  } else {
    snackbot.sendMessage(msg.chat.id, `requested state (${state}) is *INVALID*`, {
      parse_mode: 'Markdown'
    });
  }
});

function imatch(msg, goal) {
  return (msg.toLowerCase() === goal.toLowerCase());
}

function iincludes(msg, goal) {
  return msg.toLowerCase().includes(goal.toLowerCase());
}
