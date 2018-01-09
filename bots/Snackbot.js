import VerEx from 'verbal-expressions';
import TelegramBot from 'node-telegram-bot-api';

import Common from '../controllers/Common';
import Player from '../controllers/Player';
import Config from '../config';

const config = new Config();

// TODO: Figure out final bots
//Telegram Bots
const snackbot = new TelegramBot(
  config.bots.snackbot.key,
  { polling: true }
);

const player = new Player();

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

console.log(tester); // Outputs the actual expression used: /^(http)(s)?(\:\/\/)(www\.)?([^\ ]*)$/

function checkState(state) {
  let valid = false;
  if (states[state]) {
    valid = true;
  }
  return valid;
}

const states = {
  0: {
    title: 'Welcome'
  },
  1: {
    title: 'Registration'
  },
  2: {
    title: 'Story'
  },
  3: {
    title: 'Disguise'
  },
  4: {
    title: 'Observation Mission'
  },
  5: {
    title: 'Buy a snack'
  },
  6: {
    title: 'Eat a snack'
  }
};

//Every Message
snackbot.on('text', (message) => {
  //load user data (will create if load fails)
  player.load(message.from).then(() => {
    console.log('after initial load', player);
  }).catch((error) => {
    console.error('error in catch', error);
  });

  //Do some default thing for now
  console.log('------- On all text ------');
	snackbot.sendMessage(message.chat.id, 'I am snackbot').catch((error) => {
		console.trace(error.code);
      // => 'ETELEGRAM'
		console.trace(error.response.body);
      // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
	});

  //Always store message
	Common.storeMessage(message, 'SnackBot');
});
