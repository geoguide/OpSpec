import VerEx from 'verbal-expressions';
import AppData from '../data/AppData';
import Config from '../config.js';
import Emitter from './Emitter';

const mysql = require('mysql2');

const config = new Config();
const connection = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  database: config.mysql.database,
  password: config.mysql.password
});

const appData = new AppData();
//For development
const debug = appData.debug;

class Common {
  constructor() {
    this.commandTester = {
      test: (message) => {
        if(message && message.charAt(0) === '/') {
          return true;
        }
        return false;
      }
    };
    this.urlTester = VerEx()
        .startOfLine()
        .then('http')
        .maybe('s')
        .then('://')
        .maybe('www.')
        .anythingBut(' ')
        .endOfLine();
    //console.log(this.urlTester); //returns the resulting regex
  }

  static storeMessage(data, state, bot = 'none') {
    if(debug) { console.log('------- Common store message called -------'); }
    if(data.text && !appData.noSave.includes(data.text)) {
      try {
        connection.query('INSERT INTO messages SET ?', {
          player_id: data.from.id,
          message_id: data.message_id,
          chat_id: data.chat.id,
          message: data.text,
          telegram_id: data.from.id,
          state,
          bot
        }, (error, results) => {
          if (error) throw error;
          if(debug) { console.log('message inserted', results.insertId); }
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  static saveImage(imageData, title = null) {
    if(debug) { console.log('------- store message called -------'); }
    const { file_id, file_size, height, width, admin = 0, player_id, bot } = imageData;
    try {
      connection.query('INSERT INTO images SET ?', {
        file_id,
        file_size,
        height,
        width,
        title,
        admin,
        player_id,
        bot
      }, (error, results) => {
        if (error) throw error;
        console.log('image saved', results.insertId);
      });
    } catch (e) {
      console.error('Common.saveImage', e);
    }
  }

  static saveFile(fileData, title = null) {
    if(debug) { console.log('------- store file called -------'); }
    const { file_id, file_size, admin = 0, player_id = 0, bot } = fileData;
    try {
      connection.query('INSERT INTO files SET ?', {
        title,
        file_id,
        file_size,
        admin,
        player_id,
        bot
      }, (error, results) => {
        if (error) throw error;
        if(debug) { console.log('image saved', results.insertId); }
      });
    } catch (e) {
      console.error('Common.saveImage', e);
    }
  }

  static saveAudio(audioData) {
    if(debug) { console.log('------- store audio called -------'); }
    console.log('audio data', audioData);
    const { file_id, file_size, title = '', mime_type, duration, player_id = 0, admin = 0, bot } = audioData;
    try {
      const query = connection.query('INSERT INTO audio SET ?', {
        title,
        file_id,
        file_size,
        mime_type,
        duration,
        player_id,
        admin,
        bot
      }, (error, results) => {
        if (error) throw error;
        if(debug) { console.log('image saved', results.insertId); }
      });
    } catch (e) {
      console.error('Common.saveImage', e);
    }
  }

  static getRandomElement(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  static imatch(msg, goal) {
    if(msg) {
      return (msg.toLowerCase() === goal.toLowerCase());
    }
    return false;
  }

  static iincludes(msg, goal) {
    if(msg) {
      return msg.toLowerCase().includes(goal.toLowerCase());
    }
    return false;
  }
}


export default Common;
