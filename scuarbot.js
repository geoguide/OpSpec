import TelegramBot from 'node-telegram-bot-api';
import qr from 'qr-image';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import Web3 from 'web3';

//Custom modules
import Common from './controllers/Common';
import Player from './controllers/Player';
import Message from './controllers/Message';
import Bot from './controllers/Bot';
import Config from './config';
import AppData from './data/AppData';
import Emitter from './controllers/Emitter';

const config = new Config();
const appData = new AppData();
const common = new Common();
const { states } = appData;
const io = require('socket.io')(8080);

//TODO for idle messages make it so that you can send more than one idle

//For development
const debug = config.debug;

// TODO: Figure out final bots vs development bots
const scuar = new TelegramBot(config.bots.scuar.key, {
  polling: true
});

//Ethereum
const web3 = new Web3();

//try passing in bot object OR passing in something to make bot object in message and switch on it

//Every Message
//maybe not check for command and just handle admin/stuff that doesn't affect anything.
scuar.on('message', (message) => {
  io.emit('scuar received', message);
  const messageObj = new Message();
  //messageObj.saveMessage(message); // Should return promise
  //New
  var bot = new Bot({ bot: 'scuar', from: message.from });
  bot.handleMessage(message); //return instructions or promise? Could handle sending of messages here rather than in bot object
});

//Emission handler

//React to event elsewhere telling bot to say something
//TODO add more, and more interesting events
Emitter.on('scuar', (chatId, message) => {
  scuar.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error.error));
});

Emitter.on('scuar audio', (chatId, audioMessage) => {
  scuar.sendAudio(chatId, audioMessage);
});

/* The following is depreciated */

//Steps, eliminate this and move to object effectively and messageHandler

/* Depreciated step method for reference
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
          resolve(states.NEW.scuar.start);
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
              resolve(states.START.scuar.start);
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
            resolve(states.REG.scuar.start);
            //TODO nooo go back and make the send series take objects
            // objects should have a messaage type, delay, etc
            setTimeout(function(){
              scuar.sendAudio(messageObj.chat.id, appData.audio.logo);
            }, 10000);
          });
        } else {
          resolve(getIdleResponses(player.state));
        }
        break;
      case 'REG':
        if(text === 'here') {
          //Win
          player.advanceState().then(() => {
            resolve(states.STORY.scuar.start);
            const m = 'Re̢m͘e͡m̡be͟r̕: f̷oĺlow SC̀UA͟Rbot’s ͝ins̶t̢ru̶c̨tío̧n̢s un̸t͟il ̧t̵hè l҉as̀t͘ ̕possibl̀e ͝mome̡nt͘-̢-d͠òn̶’t̴ give̡ th͞e̡m̶ ̕y͘o̷úr͝ ̀$2̵0̨! Lo͏o͜k f̡o̸r t̀h҉e͡ ̧S̡na͟c̴k B͡ri͜gad̡e͡ l̛ogo̶ ón t͢h́e s͟i̛d͝e͢ ͞o̧f̴ ̛th̴e SC͏U̷AR M͞a̕c͜hi҉ne™͝, t͜a̛k͢e͡ a pic̨tu͞re̕ ́o̧f̧ ́it̨, an̛d ͘s͢ȩnd ̨i̧t t́o̴ th͞e S͢CU̴A͢R̛b̨ot.͞ ̢ ';
            Emitter.emit('snack', { id: messageObj.chat.id, type: 'text', data: m } );
          });
        } else {
          let response = messageObj.handleSpecificStep('scuar', 'REG', text);
          if(!response) {
            response = getIdleResponses(player.state);
          }
          resolve(response);
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
            resolve(states.STORY.scuar.substates[player.substate]);
          }).catch(error => console.error(error));
        } else if(substate === 1) {
          //They have previous sent address
          if(messageObj.photo) {
            //Win
            player.substate = 0;
            player.advanceState().then(() => {
              resolve(states.FACIAL.scuar.start);
            });
          } else {
            resolve(states.STORY.scuar.substates[substate]);
          }
        } else if(substate === 2) {
            //Has send photo
            if(web3.isAddress(text)) {
              //Win
              player.substate = 0;
              player.advanceState().then(() => {
                return scuar.sendMessage(messageObj.chat.id,
                  states.FACIAL.scuar.start);
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
              resolve(states.STORY.scuar.substates[substate]);
            }
        }
        break;
      case 'FACIAL':
        resolve(states.FACIAL.scuar.idle);
        break;
      case 'OBSERVE':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR (OBSERVE)']);
        } else {
          resolve(['You still haven\'t contacted snackbot (OBSERVE)']);
        }
        break;
      case 'SNACK':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR (SNACK)']);
        } else {
          resolve(['You still haven\'t contacted snackbot (SNACK)']);
        }
        break;
      case 'EAT':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR (EAT)']);
        } else {
          resolve(['You still haven\'t contacted snackbot (EAT)']);
        }
        break;
      case 'WIN':
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR (WIN)']);
        } else {
          resolve(['You still haven\'t contacted snackbot (WIN)']);
        }
        break;
      case 8:
        if(player.snackbot) {
          resolve(['You shouldn\'t be talking to SCUAR STEP 8!? (8)']);
        } else {
          resolve(['You still haven\'t contacted snackbot STEP 8!? (8)']);
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
*/

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
