import TelegramBot from 'node-telegram-bot-api';
import qr from 'qr-image';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import Web3 from 'web3';
//Custom modules
import Common from './controllers/Common';
import Player from './controllers/Player';
import Message from './controllers/Message';
import RegistrationCode from './controllers/RegistrationCode';
import Config from './config';
import AppData from './data/AppData';
import Emitter from './controllers/Emitter';

const config = new Config();
const appData = new AppData();
const common = new Common();
const { states, responseObject } = appData;
const io = require('socket.io')(8080);

//TODO for idle messages make it so that you can send more than one idle

//For development
const debug = config.debug;

//our objects
const player = new Player();
let messageObj = new Message();

// TODO: Figure out final bots vs development bots
const scuar = new TelegramBot(config.bots.scuar.key, {
  polling: true
});

//Ethereum
const web3 = new Web3();

//Every Message
//maybe not check for command and just handle admin/stuff that doesn't affect anything.
scuar.on('message', (message) => {
  io.emit('scuar received', message);
  const command = common.commandTester.test(message.text);
  messageObj = new Message(message);
  messageObj.toBot = 'scuar';
  //send error messages to user
  if(!command && !messageObj.handleSpecific(messageObj)) {
    //load user data (will create if load fails)
    player.load(message.from).then(() => {
      if(debug) { console.log('player is', player); }
      //we can use emits for this stuff so we don't have to rewrite them
      //otherwise they should just be handled in objects
      messageObj.handleMediaMessage(message, player.admin, 'scuar');
      //emit('bot contacted', 'scuarbot');
      if(player.scuarbot === 0) {
        player.setContactedBot('scuarbot');
      }
      Common.storeMessage(message, player.state, 'SCUARBot');
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
      console.error(error);
    });
  }
});

scuar.onText(/\/tell_user (\w+) (.+)/, (msg, match) => {
  const user = match[1];
  const message = match[2];
  console.info('tell', user, 'this:', message);
  // Maybe add user contacted and wait for specific responses
	scuar.sendMessage(user, message, { parse_mode: 'Markdown' })
  .catch(error => console.error(error));
});

function checkState(state) {
  let valid = false;
  if (responseObject[state]) {
    valid = true;
  }
  return valid;
}

//React to event elsewhere telling bot to say something
//TODO add more, and more interesting events
Emitter.on('scuar', (chatId, message) => {
  scuar.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error.error));
});

//This can probably be moved to Player
function completedStep() {
  //TODO move imatch and iinclude to Message
  const { text } = messageObj;
  const { state, substate } = player;
  const advance = new Promise((resolve, reject) => {
    switch(state) {
      case 'NEW':
        console.log('got into the right step');
        if(text === '/start') {
          //Newb
          resolve(responseObject.NEW.scuar.start);
        } else {
          RegistrationCode.checkCode(text).then(check => {
            if(check) {
              return RegistrationCode.useCode({ code: text, player_id: messageObj.from.id });
            }
            return false;
          }).then(ok => {

            if(ok) {
              //win
              player.advanceState();
              resolve(responseObject.START.scuar.start);
            } else {
              resolve(['This is ID is already used']);
            }
          }).catch(error => {
            console.log(error);
            console.error('someone tried using an invalid id:', text);
            resolve([error]);
          });
        }
        break;
      case 'START':
        if(Common.iincludes(text, 'oakland')) {
          //win
          player.advanceState().then(() => {
            resolve(responseObject.REG.scuar.start);
          });
        } else {
          resolve(getIdleResponses(player.state));
        }
        break;
      case 'REG':
        if(text === 'here') {
          //Win
          player.advanceState().then(() => {
            console.log('ro', responseObject.STORY.scuar.start);
            resolve(responseObject.STORY.scuar.start);
            Emitter.emit('snack', 'Re̢m͘e͡m̡be͟r̕: f̷oĺlow SC̀UA͟Rbot’s ͝ins̶t̢ru̶c̨tío̧n̢s un̸t͟il ̧t̵hè l҉as̀t͘ ̕possibl̀e ͝mome̡nt͘-̢-d͠òn̶’t̴ give̡ th͞e̡m̶ ̕y͘o̷úr͝ ̀$2̵0̨! Lo͏o͜k f̡o̸r t̀h҉e͡ ̧S̡na͟c̴k B͡ri͜gad̡e͡ l̛ogo̶ ón t͢h́e s͟i̛d͝e͢ ͞o̧f̴ ̛th̴e SC͏U̷AR M͞a̕c͜hi҉ne™͝, t͜a̛k͢e͡ a pic̨tu͞re̕ ́o̧f̧ ́it̨, an̛d ͘s͢ȩnd ̨i̧t t́o̴ th͞e S͢CU̴A͢R̛b̨ot.͞ ̢ ');
          });
        } else if(Common.imatch(text, 'here')){
          console.log('case sensitive shit');
          //This would be a good place to implement handleMessage for specific steps
          const hereplease = [
            'SCUAR runs on only the most modern case-sensitive technology. Try that again, but all lower-case.'
          ];
          resolve(hereplease);
        } else {
          resolve(getIdleResponses(player.state));
        }
        break;
      case 'STORY':
        //TODO figure out a better way of doing this
        // -- i just have to pee right now and want to get something working
        // Can check if player has contacted snackbot yet too and trigger glitch
        // 0 == neither solved
        // 1 == address sent
        // 2 == virus sent
        if(substate === 0) {
          //Did they send a correct address or correct photo?
          if(web3.isAddress(text)) {
            player.substate = 1;
          } else if(messageObj.photo) {
            player.substate = 2;
          }
          player.save().then(() => {
            resolve(responseObject.STORY.scuar.substates[player.substate]);
          }).catch(error => console.error(error));
        } else if(substate === 1) {
          //They have previous sent address
          if(messageObj.photo) {
            //Win
            player.substate = 0;
            player.advanceState().then(() => {
              resolve(responseObject.FACIAL.scuar.start);
            });
          } else {
            resolve(responseObject.STORY.scuar.substates[substate]);
          }
        } else if(substate === 2) {
            //Has send photo
            if(web3.isAddress(text)) {
              //Win
              player.substate = 0;
              player.advanceState().then(() => {
                return scuar.sendMessage(messageObj.chat.id,
                  'S̷͇̱͘ő̴̝m̴͉̗̕ė̸̜̻t̷͔͕̚͝h̵̛̬̠́i̴̻̩̽͗n̷̥͍͑g̸̥̦̈́́ ̸̭̉s̸͉̙̄ê̵̱͒e̴̙͌̃͜m̶̧̄̍s̶̳̔̎ ̴̬͐͛t̵̢̐͘o̷̩͆ ̸͓̕͝h̶̝̟̓̋a̵̻͝v̸̦̐̊e̴̲̟̍̈́ ̴̧͍̍͐g̸̰͛͛ǒ̷̱͖́n̶̗̅͐ē̵̞̙̍ ̶̲̜̏w̷̖͋͝ŗ̷̝̂̍ö̴̢̪n̸͖̽g̷̨͌');
              }).then(() => scuar.sendAudio(messageObj.chat.id, 'CQADAQADKwADhVW5Rnr9XdgDY4yUAg'))
              .then(() => {
                return Emitter.emit('snack',
                  messageObj.chat.id,
                  'Nice! You crashed SCUARBot and bought us some time!');
              })
            .then(() => resolve(false))
              .catch(error => {
                console.error(error);
              });
            } else {
              resolve(responseObject.STORY.scuar.substates[substate]);
            }
        }
        break;
      case 'OBSERVE':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR']);
        } else {
          resolve(['You still haven\'t contacted snackbot']);
        }
        break;
      case 'SNACK':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR']);
        } else {
          resolve(['You still haven\'t contacted snackbot']);
        }
        break;
      case 'EAT':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR']);
        } else {
          resolve(['You still haven\'t contacted snackbot']);
        }
        break;
      case 'WIN':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR']);
        } else {
          resolve(['You still haven\'t contacted snackbot']);
        }
        break;
      case 8:
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR STEP 8!?']);
        } else {
          resolve(['You still haven\'t contacted snackbot STEP 8!?']);
        }
        break;
      default:
        reject(getIdleResponses(player.state));
    }
  }).catch(error => {
    console.error(error);
    //reject(error);
  });
  return advance;
}

function getIdleResponses(state) {
  if(state !== null) {
    if(responseObject[state] && responseObject[state].scuar.idle) {
      return [Common.getRandomElement(responseObject[state].scuar.idle)];
    }
    return [Common.getRandomElement(responseObject.default.scuar.idle)];
  }
  return [];
}

function personalize(r) {
  let result = r;
  if (messageObj.from.first_name && messageObj.from.first_name !== '') {
    result = r.replace(/PLAYERNAME/g, messageObj.from.first_name);
  } else {
    result = r.replace(/PLAYERNAME/g, 'citizen');
  }
  return result;
}

function sendMessage(m) {
  return scuar.sendMessage(messageObj.chat.id, m, {
    parse_mode: 'Markdown'
  }).catch(error => console.error(error));
}

/* Not actually series but accounts for telegram's random delays */
function sendSeries(messageArray) {
  for(let i = 0; i < messageArray.length; i++) {
    setTimeout(sendMessage, i * 1000, messageArray[i]);
  }
}

/* Commands! */
//Say something back
scuar.onText(/\/echo (.+)/, (message, match) => {
  const chatId = message.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  scuar.sendMessage(chatId, resp);
});

//Start code, this will be fixed
scuar.onText(/\/start/, (message) => {
  scuar.sendMessage(message.chat.id, 'Please enter your *unique code*.', {
    parse_mode: 'Markdown'
  });
});

//tell snackbot to say something
scuar.onText(/\/snack (.+)/, (msg, match) => {
  Emitter.emit('snack', msg.from.id, `yoyo eat the ${match}`);
});

//set your own state manually
scuar.onText(/\/(state) (.+)/i, (msg, match) => {
  const state = match[2];
  console.log('state received for setting is', state);
  if (checkState(state)) {
    player.load(msg.from).then(() => {
     return player.setState(state);
   }).then(() => {
      const stateInfo = responseObject[player.state];
      scuar.sendMessage(msg.chat.id, `your state is set to *${player.state}: ${stateInfo.title}*`, {
        parse_mode: 'Markdown'
      });
    }).catch((error) => console.error(error));
  } else {
    console.error('bad state', state);
    scuar.sendMessage(msg.chat.id, `requested state (${state}) is *INVALID*`, {
      parse_mode: 'Markdown'
    });
  }
});

//reset to state 0
scuar.onText(/^\/(reset)/i, (msg) => {
  console.log('------- reset state ------');
  player.load(msg.from).then(() => {
   return player.setState('START');
  }).then(() => {
    scuar.sendMessage(msg.chat.id, `your state is set to *${player.state}*`, {
      parse_mode: 'Markdown'
    });
  }).catch((error) => console.error(error));
});

//Check on your current state
scuar.onText(/^\/(checkup)/i, (msg) => {
  if(debug) { console.log('------- checking player ------'); }
  player.load(msg.from).then(() => {
    let message = '';
    if (checkState(player.state)) {
      message = `your state is set to *${player.state}: ${responseObject[player.state].title}*`;
    } else {
      message = `your state is MESSED UP *${player.state}*`;
    }

    scuar.sendMessage(msg.chat.id, message, {
      parse_mode: 'Markdown'
    });
  }).catch((error) => console.error(error));
});

/* Old stuff for reference */

scuar.onText(/^\/(uploadsvg) (.+)/i, (msg, match) => {
  console.log(`make an svg of ${match[2]}`);
	const qrSvg = qr.image(match[2], { type: 'png' });
	qrSvg.pipe(fs.createWriteStream(`/tmp/${sanitize(match[2])}.png`));

	scuar.sendPhoto(msg.chat.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png').catch((error) => {
		console.log(error.code); // => 'ETELEGRAM'
		console.log(error.response.body);
    // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
	});
});
