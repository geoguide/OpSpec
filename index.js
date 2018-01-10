import VerEx from 'verbal-expressions';
import Common from './controllers/Common';
import Player from './controllers/Player';
import Message from './controllers/Message';
import Config from './config';
import AppData from './data/AppData';


const TelegramBot = require('node-telegram-bot-api');
const qr = require('qr-image');
const fs = require('fs');
const sanitize = require('sanitize-filename');

const config = new Config();
const appData = new AppData();
const states = appData.states;

// TODO: Figure out final bots
//Telegram Bots
const scuar = new TelegramBot(config.bots.scuar.key, { polling: true });

const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

const player = new Player();
let messageObj = new Message();

const responses = {
  1: {
    start: [
      'Hello PLAYER_NAME!',
      'Welcome to the Access Initiative™, a service provided by the Syndicate on Comestibles and Underwriters for Alimentation and Refreshments (SCUAR)! We’d like to thank you for beginning the enrollment process and taking your first step on the path to food security. Welcome aboard!',
      'SCUAR is a brand new ministry called together by your government with your nutritional needs in mind. We’re here to help you understand your family’s alimentary needs and increase access to the foods you love, three times a day, every day!',
      'In this convenient ePacket, you will find all the information you need to finish becoming a part of this exciting new program and ensure that you and your loved ones never miss a SCUAR meal again!',
      'https://www.scuar.com/ePacket.pdf'
    ]
  }
};

/* Use this for later complex Regex issues */
// Create an example of how to test for correctly formed URLs
const tester = VerEx()
    .startOfLine()
    .then('http')
    .maybe('s')
    .then('://')
    .maybe('www.')
    .anythingBut(' ')
    .endOfLine();

// Create an example URL
const testMe = 'https://www.google.com';

// Use RegExp object's native test() function
if (tester.test(testMe)) {
    console.info('We have a correct URL'); // This output will fire
} else {
    console.info('The URL is incorrect');
}

//console.log(tester); // Outputs the actual expression used: /^(http)(s)?(\:\/\/)(www\.)?([^\ ]*)$/

function checkState(state) {
  let valid = false;
  if (states[state]) {
    valid = true;
  }
  return valid;
}

//Every Message Game Changes - This should be used just to catch specific things
//- like if at this step and says solution
//- maybe if it's something similar but wrong also
//We should have different handlers for generic responses in the middle of the game
scuar.on('message', (message) => {
  let response = '';
  let starting = false;
  messageObj = new Message(message);
  if (message.text === '/start') {
    starting = true;
  }

  if (message.from.username === 'zeradin') {
    //console.info(message);
  }

  if (starting) {
    scuar.sendMessage(message.chat.id, 'This should be the first thing I say to you.')
    .catch(error => console.error(error));
  } else {
    //console.log('top level message handling', message);
    //load user data (will create if load fails)
    player.load(message.from).then((result) => {
      //console.log('---RESULT HERE', result);
      if (result === 'new_player' || message.from.username === 'zeradin') {
        const msgarray = [];
        for (let i = 0; i < responses[1].start.length; i++) {
          let r = responses[1].start[i];
          if (message.from.first_name && message.from.first_name !== '') {
              r = r.replace(/PLAYER_NAME/g, message.from.first_name);
          } else {
            r = r.replace(/PLAYER_NAME/g, 'citizen');
          }
          msgarray.push(r);
          //setTimeout(() => { scuar.sendMessage(message.chat.id, r); }, i * 1000);
        }
        sendSeries(msgarray);
      } else {
        response = 'I mean I hear you... I just ain\'t got nothin to say right now';
      }
      //console.log('after initial load', player);
      //Always store message - move to after we know what step the user is on
      Common.storeMessage(message, player.state, 'SCUARBot');
      //Do some default thing for now
      console.log('------- On all text ------');
      if(response !== '') {
        scuar.sendMessage(message.chat.id, response).catch((error) => {
          console.error(error.code);
          // => 'ETELEGRAM'
          console.error(error.response.body);
          // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        });
      }

    }).catch((error) => {
      console.error('error in catch', error);
    });
  }
});

function sendMessage(m) {
  console.log('called for ', m);
  return scuar.sendMessage(messageObj.chat.id, m);
}

/* Not actually series but accounts for telegram's random delays */
function sendSeries(messageArray) {
  for(let i = 0; i < messageArray.length; i++) {
    setTimeout(sendMessage, i * 1000, messageArray[i]);
  }
}

snackbot.on('message', (message) => {
  //load user data (will create if load fails)
  player.load(message.from).then((result) => {
    //console.log('after initial load', player, 'result was', result);
    //Always store message
    Common.storeMessage(message, player.state, 'Snackbot');
  }).catch((error) => {
    console.error('error in catch', error);
  });

  //Do some default thing for now
  console.log('------- On all text ------');
	snackbot.sendMessage(message.chat.id, 'I am SnackBot').catch((error) => {
		console.trace(error.code);
      // => 'ETELEGRAM'
		console.trace(error.response.body);
      // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
	});
});

//dumbest thing
scuar.onText(/\/echo (.+)/, (msg, match) => {
	scuar.sendMessage(msg.chat.id, match[2]);
});

scuar.onText(/\/snack (.+)/, (msg, match) => {
  //console.log('msg was ', msg);
  //console.log('id was: ', msg.from.id);
	snackbot.sendMessage(msg.from.id, 'yoyo').catch(error => console.error(error));
});

scuar.onText(/^\/(state) (.+)/i, (msg, match) => {
  console.log('------- set state ------');
  const state = parseInt(match[2],10);
  if (checkState(state)) {
    player.setState(state).then((result) => {
      const stateInfo = states[player.state];
      scuar.sendMessage(msg.chat.id, `your state is set to *${player.state}: ${stateInfo.title}*`, {
        parse_mode: 'Markdown'
      });
      //console.log('state player', player);
    }).catch((error) => console.error(error));
  } else {
    scuar.sendMessage(msg.chat.id, `requested state (${state}) is *INVALID*`, {
      parse_mode: 'Markdown'
    });
  }
});

scuar.onText(/^\/(reset)/i, (msg, match) => {
  console.log('------- reset state ------');
  const state = parseInt(match[2],10);
  player.setState(0).then((result) => {
    scuar.sendMessage(msg.chat.id, `your state is set to *${player.state}*`, {
      parse_mode: 'Markdown'
    });
    console.log('reset player', player);
  }).catch((error) => console.error(error));
});

scuar.onText(/^\/(eat)/i, (msg, match) => {
  console.log('------- eating ------');
  console.log('state is currently', player.state);
  let newState = 0;
  player.load(msg.from).then((result) => {
    newState = player.state + 1;
    console.log('new state will be', newState);
    if (!checkState(newState)) {
      console.log('we didnt find that');
      newState = 0;
    } else {
      console.log('we found state: ', player.state);
    }
    return player.setState(newState);
  }).then((result) => {
    let message = '';
    if (newState > 0) {
      message = `your state is set to *${player.state}*:${states[player.state].title}`;
    } else {
      message = `YOU WON! state had to be reset to *${player.state}*:${states[player.state].title}`;
    }
    scuar.sendMessage(msg.chat.id, message, {
      parse_mode: 'Markdown'
    });
  }).catch((error) => console.error(error));
});

scuar.onText(/^\/(checkup)/i, (msg, match) => {
  console.log('------- checking player ------');
  player.load(msg.from).then((result) => {
    let message = '';
    if (checkState(player.state)) {
      message = `your state is set to *${player.state}: ${states[player.state].title}*`;
    } else {
      message = `your state is MESSED UP *${player.state}*`;
    }

    scuar.sendMessage(msg.chat.id, message, {
      parse_mode: 'Markdown'
    });
    console.log('checkup player', player);
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
	/*connection.query(
    'SELECT * FROM `players`',
    (err, results, fields) => {
      console.log(results); // results contains rows returned by server
      scuar.sendMessage(msg.chat.id, results[0].username).catch(error => console.error(error));
      //console.log(fields); // fields contains extra meta data about results, if available
    }
	);*/
});

scuar.onText(/^(surprise) (.+)/i, (msg, match) => {
	console.log('surprise match', match[2]);
	scuar.sendMessage(msg.chat.id, `...and dont call me a *${match[2]}*`, {
		parse_mode: 'Markdown'
	});
});

scuar.on('inline_query', (query) => {
	scuar.answerInlineQuery(query.id, [
		{
      type: 'article',
        id: 'testarticle',
        title: 'Hello world',
        input_message_content: {
          message_text: 'Hello, world! This was sent from my super cool inline bot.'
        }
		}
	]);
});

/*
  awesome idea would be allow people to tell other players things by telling the bot to do so,
  will require storing names/codenames for people and their chat ids
*/
