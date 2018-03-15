import Common from './controllers/Common';
import Player from './controllers/Player';
import Message from './controllers/Message';
import Config from './config';
import Bot from './controllers/Bot';
import AppData from './data/AppData';
import Emitter from './controllers/Emitter';

const TelegramBot = require('node-telegram-bot-api');
const qr = require('qr-image');
const fs = require('fs');
const sanitize = require('sanitize-filename');

const config = new Config();
const appData = new AppData();
const common = new Common();
const { states } = appData;


//For development
const debug = appData.debug;

const player = new Player();
let messageObj = new Message();
let returnMessage = '';

const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

//Event Handlers
Emitter.on('snack', (chatId, message) => {
  snackbot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error.error));
});

Emitter.on('snack audio', (chatId, audioMessage) => {
  snackbot.sendAudio(chatId, audioMessage);
});

//Every Message
//maybe not check for command and just handle admin/stuff that doesn't affect anything.
snackbot.on('message', (message) => {
  //io.emit('snack received', message);
  const messageObj = new Message();
  //messageObj.saveMessage(message); // Should return promise
  //New
  var bot = new Bot({ bot: 'snack', from: message.from });
  bot.handleMessage(message); //return instructions or promise? Could handle sending of messages here rather than in bot object
});

//TODO make all of these common or in messageObject
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
//TODO maybe explore recursively calling this on completed step instead of running next step in prev step
//TODO move win criteria to response object try to get rid of this switch
function completedStep() {
  const { text } = messageObj;

  //change player.state to ENUM with 'next' property
  const advance = new Promise((resolve, reject) => {
    switch(player.state) {
      case 'NEW':
        if(player.scuarbot) {
          resolve(['You shouldn\'t be talking to me (step NEW)']);
        } else {
          resolve(['You still haven\'t contacted scuar!']);
        }
        break;
      case 'START':
        if(player.scuarbot === 1) {
          resolve(['You shouldn\'t be talking to me (step START)']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 'REG':
        if(player.scuarbot) {
          resolve(['You shouldn\'t be talking to me (step REG)']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 'STORY':
        if(player.scuarbot) {
          resolve(['You shouldn\'t be talking to me (step STORY)']);
        } else {
          resolve(['You still haven\'t contacted scuar']);
        }
        break;
      case 'FACIAL':
        if(Common.imatch(text, 'send it')) {
          return snackbot.sendAudio(messageObj.chat.id, appData.audio.leave_open);
        } else if(messageObj.photo) {
          //WIN
          player.advanceState().then(() => {
            return snackbot.sendAudio(messageObj.chat.id, appData.audio.observe);
          }).then(() => {
              resolve(false);
          });
        } else {
          resolve(states.FACIAL.snack.idle);
        }
        break;
      case 'OBSERVE':
        //TODO use one response variable for everything - you only need one
        let response = messageObj.handleSpecificStep('snack', player.state, text);
        if(response) {
          resolve(response);
        } else if((parseInt(text, 10) > 3 && parseInt(text, 10) < 7)
          || Common.imatch(text, 'four')
          || Common.imatch(text, 'five')
          || Common.imatch(text, 'six')) {
          //WIN
          player.advanceState().then(() => {
            resolve(states.SNACK.snack.start);
          });
        } else {
          resolve(states.OBSERVE.snack.idle);
        }
        break;
      case 'SNACK':
        if(Common.imatch(text, 'banana')) {
          player.advanceState().then(() => {
              resolve(states.EAT.snack.start);
          });
        } else {
          console.log('did not match');
          resolve(states.SNACK.snack.idle);
        }
        break;
      case 'EAT':
        if(Common.imatch(text, 'long may he floss')) {
          player.advanceState();
          resolve(states.WIN.snack.start);
        } else {
          resolve(states.EAT.snack.idle);
        }
        break;
      case 'WIN':
        resolve(states.WIN.snack.idle);
        break;
      default:
        reject(['snack Tell me how you got here']);
    }
  }).catch(error => {
    console.error(error);
    //reject(error);
  });
  return advance;
}

/* The Following are Temporary Duplication */

//Start code, this will be fixed
/*snackbot.onText(/\/start/, (message) => {
  player.load(message.from).then(() => {
    if(!states[player.state].snack) {
      returnMessage = 'Who are you?! Who sent you!?';
    } else {
      returnMessage = 'Um... you\'ve already started. Do you need to be reoriented?';
    }
    return snackbot.sendMessage(message.chat.id, returnMessage, {
      parse_mode: 'Markdown'
    });
  }).then(() => {
    //complete
  }).catch(e => {
    console.error(e);
  });
});*/
