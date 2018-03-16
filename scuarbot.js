import TelegramBot from 'node-telegram-bot-api';
import qr from 'qr-image';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import Web3 from 'web3';

//Custom modules
import Bot from './controllers/Bot';
import Config from './config';
import AppData from './data/AppData';
import Emitter from './controllers/Emitter';

const config = new Config();
const appData = new AppData();
const io = require('socket.io')(8080); //save for admin app

//For development - for future logging
const debug = config.debug;

// TODO: Figure out final bots vs development bots
const scuar = new TelegramBot(config.bots.scuar.key, {
  polling: true
});

//Ethereum - for later
const web3 = new Web3();

//Every Message
scuar.on('message', (message) => {
  //New
  var bot = new Bot({ bot: 'scuar', from: message.from });
  bot.handleMessage(message); //return instructions or promise? Could handle sending of messages here rather than in bot object
});

//Event handlers
Emitter.on('scuar', (chatId, message) => {
  scuar.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error('scuar emitter', error.error));
});

Emitter.on('scuar audio', (chatId, audioMessage) => {
  scuar.sendAudio(chatId, audioMessage);
});

/* The following is depreciated */

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
