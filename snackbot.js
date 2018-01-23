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
const responseObject = appData.states;
let currentBot = '';

//For development
const debug = appData.debug;

const player = new Player();
let messageObj = new Message();

// Probably make 2 of these, one for scuar and one for SB
// then just have idle messages for scuar
// where it has a bunch of things it says as you get defiant
//For now stuffing them in one is fine
const responses = appData.states;

const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

Emitter.on('snack_say', (chatId, message) => {
  snackbot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error));
});

//Snackbot not commands
snackbot.on('message', message => {
  let response = '';
  let starting = false;
  currentBot = 'snack';
  let finalizeMessage = false;
  const command = common.commandTester.test(message.text);

  if(command) {
    console.log('snack got a command');
  }
  messageObj = new Message(message);

  //for debugging and getting file ids of uploads
  if (message.from.username === 'zeradin') {
    //Show Message Details
    if(debug) { console.info(message); }
    //Save all the images
    if(message.photo) {
      const caption = (message.caption) ? message.caption : '';
      for (let i = 0; i < message.photo.length; i++) {
        Common.saveImage(message.photo[i], caption);
      }
    } else if(message.document) {
      const caption = (message.caption) ? message.caption : message.document.file_name;
      Common.saveFile(message.document, caption);
    } else if(message.audio) {
      Common.saveAudio(message.audio);
    }
  }

  //send error messages to user
  if (starting) {
    snackbot.sendMessage(message.chat.id, 'Please enter your *unique code*.', {
      parse_mode: 'Markdown'
    })
    .catch(error => console.error(error));
  } else if(!command) {
    //load user data (will create if load fails)
    player.load(message.from).then(result => {
      if(debug) { console.log('player is', player); }
      if(result === 'new_player') {
        starting = true;
      }
      return completedStep();
      //return player.checkStepComplete();
      //Check if the user has completed the step
    }).then(advanced => {
      //check for progress?
      let progress = advanced;
      if(!responses[player.state].bots.includes('snack')) {
        progress = false;
        response = ['Who are you?! Who sent you?!'];
      } else if(progress || starting) {
        if(!starting) {
          console.info('-- Player HAS completed step');
          player.state++;
          player.save();
        }
        finalizeMessage = true;
        response = responses[player.state].start;
      } else {
        console.info('-- Player has NOT completed step');
        if(responses[player.state].inprogress_snack) {
          response = [];
          response.push(Common.getRandomElement(responses[player.state].inprogress_snack));
        } else {
          response = ['I do not know what to say (eat?)'];
        }
      }
      //Regardless of if they completed or step or not, send a message
      const msgarray = [];
      for (let i = 0; i < response.length; i++) {
        const r = personalize(response[i]);
        msgarray.push(r);
      }
      sendSeries(msgarray);
      Common.storeMessage(message, player.state, 'snackbot');
    });
  }
});

snackbot.onText(/\/tell_user (\w+) (.+)/, (msg, match) => {
  const user = match[1];
  const message = match[2];
  console.info('tell', user, 'this:', message);
  // Maybe add user contacted and wait for specific responses
	snackbot.sendMessage(user, message, { parse_mode: 'Markdown' }).catch(error => console.error(error));
});

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
  if(currentBot === 'snackbot') {
    return snackbot.sendMessage(messageObj.chat.id, m, {
      parse_mode: 'Markdown'
    }).catch(error => console.error(error));
  }
}

//This can probably be moved to Player
function completedStep() {
  const self = this;
  const playerMsg = messageObj.text;
  const advance = new Promise((resolve, reject) => {
    switch(player.state) {
      case 0:
        if(messageObj.text === 'unique id') {
          resolve(true);
        }
        break;
      case 1:
        if(playerMsg.toLowerCase().includes('oakland')) {
          resolve(true);
        }
        break;
      case 2:
        if(messageObj.text === 'here') {
          resolve(true);
        }
        break;
      case 3:
        if(messageObj.text.includes('address') && playerMsg.includes('logo')) {
          resolve(true);
        }
        break;
      case 4:
        if(messageObj.text === 'photo') {
          resolve(true);
        }
        break;
      case 5:
        if(messageObj.text === 'number of some sort') {
          resolve(true);
        }
        break;
      case 6:
        if(messageObj.text === 'banana') {
          resolve(true);
        }
        break;
      case 7:
        if(messageObj.text === 'long may he floss') {
          resolve(true);
        }
        break;
      case 8:
      resolve(true);
        break;
      default:
        resolve(true);
    }
    resolve(false);
  }).catch(error => {
    console.error(error);
    //reject(error);
  });
  return advance;
}
