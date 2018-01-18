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
let currentBot = '';

//For development
const debug = appData.debug;

// TODO: Figure out final bots
//Telegram Bots
const scuar = new TelegramBot(config.bots.scuar.key, { polling: true });

const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

const player = new Player();
let messageObj = new Message();
let finalizeMessage = false;

// Probably make 2 of these, one for scuar and one for SB
// then just have idle messages for scuar
// where it has a bunch of things it says as you get defiant
//For now stuffing them in one is fine
const responses = {
  0: {
    title: 'Step 0',
    bots: ['scuar'],
    start: [
      'Please enter your *unique id*'
    ],
    inprogress: [
      'ID Not found, please try again',
      'That isn\'t a valid ID'
    ]
  },
  1: {
    title: 'Welcome',
    bots: ['scuar'],
    start: [
      'Hello PLAYERNAME!',
      'Welcome to the Access Initiative™, a service provided by the Syndicate on Comestibles and Underwriters for Alimentation and Refreshments (SCUAR)! We’d like to thank you for beginning the enrollment process and taking your first step on the path to food security. Welcome aboard!',
      'SCUAR is a brand new ministry called together by your government with your nutritional needs in mind. We’re here to help you understand your family’s alimentary needs and increase access to the foods you love, three times a day, every day!',
      'In this convenient ePacket, you will find all the information you need to finish becoming a part of this exciting new program and ensure that you and your loved ones never miss a SCUAR meal again!',
      'https://www.scuar.com/ePacket.pdf',
      'When you have reviewed our materials, please respond by confirming the city you will be completing the program in'
    ],
    inprogress: [
      'We don\'t have a program in that city, are you sure you spelled it correctly?'
    ],
    problems: [0]
  },
  2: {
    title: 'Demographics',
    bots: ['scuar'],
    start: [
      'Oakland! Great. Go Giants!',
      'The high-tech SCUAR department runs exclusively on the newest and most advanced payment techniques.  To register with SCUAR and receive your first meal, please go to the following location: XXXX  To begin you will need $20 in cash, and to download a wallet for your SCUARcoin, which you can download for free here:  XXXXXX',
      'Once you’ve arrived at the registration point, send a text saying “Here”.'
    ],
    inprogress: [
      'We cannot confirm your location to be correct. Please let us know you have arrived at XXXX by texting us "here".'
    ],
    notes: 'after Xms send audio file'
  },
  3: {
    title: 'Bitcoin Orientation',
    bots: ['scuar', 'snack'],
    start: [
      'Welcome to the SCUAR Machine™, everyone’s favorite high-tech ATM-style futuristic gatekeeper to food security!  Take your $20, put it into the machine, and transfer the coins to your bitcoin wallet.'
    ],
    inprogress: [
      'Just send me the text address and logo for now'
    ],
    notes: 'This step there are two success criteria and the game branches'
  },
  4: {
    title: 'Initiation',
    bots: ['snack'],
    start: [
      'Password: "full facial"'
    ],
    inprogress: [
      'Have you started your retina scan for meal distribution?'
    ],
    inprogress_snack: [
      'Let me know when you have the code word'
    ],
    notes: 'Send Voice Message about the story of SCUAR',
    termination: 'Give code word to get disguise'
  },
  5: {
    title: 'Observation Mission',
    bots: ['snack'],
    start: [
      'sneak around audio'
    ]
  },
  6: {
    title: 'Snack Procurment',
    bots: ['snack'],
    start: [
      'You found all the cameras!  Or maybe you didn’t.  That’s ok.  You can go look for them later.  I’m hungry, aren’t you?  Let’s eat.  Snack Brigade is all about snacking when you feel it. Free Snacks are never truly free, but they are still delicious, and “free” means more than one thing!',
      'Let’s go in this place.  It’s Open.  Keep your disguise on.  This place is heavily surveilled.  Go up to the counter and order the “Special Snack.”  You’ll need to give them some Bitcoin, but you know all about that now.',
    ]
  },
  7: {
    title: 'Plaque',
    bots: ['snack'],
    start: [
      'Go to Snow Park and find the plaque'
    ]
  },
  8: {
    title: 'Vandalism and debriefing',
    bots: ['snack'],
    start: [
      'asdfalsdfasdfasdf'
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

const commandTester = VerEx()
  .startOfLine()
  .then('/')
  .anything()
  .endOfLine();

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
  currentBot = 'scuar';
  const command = commandTester.test(message.text);

  if(command) {
    console.log('t was totally a command');
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

  // Should probably make this a class
  // - with variables like (starting, comm complete etc)
  // - card with qr code but also start code
  // - completed communication
  // - - then start off with check starting
  // - - - then conditionally send to check completed then send to
  // - - - make function that we can message bot to send players messages
  // - - - and also send everyone at a certain state a message

  //What if they aren't a player?!

  //if just starting

  //have they completed current step?

  //handle specific messages

  //does this step have anything to say to what they've said?
  // - do where do i go?

  //handle random messages

  //send error messages to user
  if (starting) {
    scuar.sendMessage(message.chat.id, 'Please enter your *unique code*.', {
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
      if(!responses[player.state].bots.includes('scuar')) {
        snackbot.sendMessage(message.chat.id, 'Hey! Don\'t send them that information!')
          .catch((error) => {
            console.error(error);
        });
        advanced = false;
      }
      if(advanced || starting) {
        if(!starting) {
          console.info('-- Player HAS completed step');
          player.state++;
          player.save();
        }
        finalizeMessage = true;
        response = responses[player.state].start;
      } else {
        console.info('-- Player has NOT completed step');
        if(responses[player.state].inprogress) {
          response = [];
          response.push(getRandomElement(responses[player.state].inprogress));
        } else {
          response = ['I do not know what to say'];
        }
      }
      //Regardless of if they completed or step or not, send a message
      const msgarray = [];
      for (let i = 0; i < response.length; i++) {
        const r = personalize(response[i]);
        msgarray.push(r);
      }
      sendSeries(msgarray);
      Common.storeMessage(message, player.state, 'SCUARBot');
    });
  }
});

snackbot.on('message', message => {
  let response = '';
  let starting = false;
  currentBot = 'snack';
  const command = commandTester.test(message.text);

  if(command) {
    console.log('t was totally a command');
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
      if(!responses[player.state].bots.includes('snack')) {
        advanced = false;
        response = [ 'Who are you?! Who sent you?!' ];
      } else if(advanced || starting) {
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
          response.push(getRandomElement(responses[player.state].inprogress_snack));
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
      Common.storeMessage(message, player.state, 'SCUARBot');
    });
  }
});

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
  if(currentBot == 'scuar') {
    return scuar.sendMessage(messageObj.chat.id, m, {
      parse_mode: 'Markdown'
    }).catch(error => console.error(error));
  }
  return snackbot.sendMessage(messageObj.chat.id, m, {
    parse_mode: 'Markdown'
  }).catch(error => console.error(error));
}

function getRandomElement(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/* Not actually series but accounts for telegram's random delays */
function sendSeries(messageArray) {
  for(let i = 0; i < messageArray.length; i++) {
    setTimeout(sendMessage, i * 1000, messageArray[i]);
  }
}

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
  console.log('------- scuar set state ------');
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
  player.setState(0).then((result) => {
    scuar.sendMessage(msg.chat.id, `your state is set to *${player.state}*`, {
      parse_mode: 'Markdown'
    });
    console.log('reset player', player);
  }).catch((error) => console.error(error));
});

/*scuar.onText(/^\/(eat)/i, (msg, match) => {
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
});*/

scuar.onText(/^\/(checkup)/i, (msg, match) => {
  if(debug) { console.log('------- checking player ------'); }
  player.load(msg.from).then(() => {
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
