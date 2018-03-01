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
const { responseObject, states } = appData;


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
    .catch(error => console.error(error));
});

//Every Message
//maybe not check for command and just handle admin/stuff that doesn't affect anything.
snackbot.on('message', (message) => {
  const command = common.commandTester.test(message.text);
  messageObj = new Message(message);
  messageObj.toBot = 'snack';
  //send error messages to user
  if(!command && !messageObj.handleSpecific(messageObj)) {
    //load user data (will create if load fails)
    player.load(message.from).then(() => {
      if(debug) { console.log('player is', player); }
      //we can use emits for this stuff so we don't have to rewrite them
      //otherwise they should just be handled in objects
      messageObj.handleMediaMessage(message, player.admin, 'snack');
      //emit('bot contacted', 'scuarbot');
      if(player.snackbot === 0) {
        player.setContactedBot('snackbot');
      }
      Common.storeMessage(message, player.state, 'Snackbot');
      //has the player completed the step?
      return completedStep();
    }).then(responseArray => {
      if(responseArray) {
        const msgarray = [];
        for (let i = 0; i < responseArray.length; i++) {
          const r = personalize(responseArray[i]);
          msgarray.push(r);
        }
        sendSeries(msgarray);
      }
    }).catch(error => {
      sendMessage('Somehow you got past our code. We don\'t know how to answer you');
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
          resolve(responseObject.FACIAL.snack.idle);
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
            resolve(responseObject.SNACK.snack.start);
          });
        } else {
          resolve(responseObject.OBSERVE.snack.idle);
        }
        break;
      case 'SNACK':
        if(Common.imatch(text, 'banana')) {
          player.advanceState().then(() => {
              resolve(responseObject.EAT.snack.start);
          });
        } else {
          console.log('did not match');
          resolve(responseObject.SNACK.snack.idle);
        }
        break;
      case 'EAT':
        if(Common.imatch(text, 'long may he floss')) {
          player.advanceState();
          resolve(responseObject.WIN.snack.start);
        } else {
          resolve(responseObject.EAT.snack.idle);
        }
        break;
      case 'WIN':
        resolve(responseObject.WIN.snack.idle);
        break;
      default:
        reject(['Tell me how you got here']);
    }
  }).catch(error => {
    console.error(error);
    //reject(error);
  });
  return advance;
}

/* The Following are Temporary Duplication */
function checkState(state) {
  let valid = false;
  if (responseObject[state]) {
    valid = true;
  }
  return valid;
}

//Start code, this will be fixed
snackbot.onText(/\/start/, (message) => {
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
});

snackbot.onText(/^\/(checkup)/i, (msg) => {
  if(debug) { console.log('------- checking player ------'); }
  player.load(msg.from).then(() => {
    if (checkState(player.state)) {
      returnMessage = `your state is set to *${player.state}:
        ${responseObject[player.state].title}*`;
    } else {
      returnMessage = `your state is MESSED UP *${player.state}*`;
    }

    snackbot.sendMessage(msg.chat.id, returnMessage, {
      parse_mode: 'Markdown'
    });
  }).catch((error) => console.error(error));
});

snackbot.onText(/^\/(state) (.+)/i, (msg, match) => {
  console.log('------- snack set state ------');
  const state = match[2];
  if (checkState(state)) {
    player.load(msg.from).then(() => {
      return player.setState(state);
    }).then(() => {
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
