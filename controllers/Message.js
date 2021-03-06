import mysql from 'mysql2';
import Config from '../config.js';
import Common from './Common';
import Emitter from './Emitter';

const config = new Config();
const debug = config.debug;

// create the connection to database
// TODO: move to own file and add environment variables
const connection = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  database: config.mysql.database,
  password: config.mysql.password
});


class Message {
  constructor(props = null) {
    try {
      if(props) {
        this.message_id = props.message_id;
        this.from = {
          id: props.from.id,
          is_bot: props.from.is_bot,
          first_name: props.from.first_name,
          last_name: props.from.last_name,
          username: props.from.username,
          language_code: props.from.language_code
        };
        this.chat = {
          id: props.chat.id,
          first_name: props.chat.first_name,
          last_name: props.chat.last_name,
          username: props.chat.username,
          type: props.chat.type
        };
        this.date = props.date;
        this.text = props.text;
        this.photo = (props.photo) ? props.photo : null;
        this.toBot = '';
      }
    } catch (e) {
      console.error(e);
    }
  }

  /* TODO figure out how to make this work best */
  // -- this could use self properties
  saveMessage(data, state, bot = 'none') {
      const save = connection.query('INSERT INTO messages SET ?', [{
        player_id: data.from.id,
        message_id: data.message_id,
        chat_id: data.chat.id,
        message: data.text,
        telegram_id: data.from.id,
        state: state || 'none',
        bot
      }], (error, results) => {
        if (error) { console.log(error); console.log('sql is', save.sql); throw error };
        if(debug) { console.log('message inserted', results.insertId); }
      });
    return save;
  }

  delete() {
    const self = this;
    const del = new Promise((resolve, reject) => {
      try {
        connection.query(
          'DELETE FROM `messages` WHERE message_id = ?', [self.message_id],
          (error) => {
            if (error) throw error;
            resolve(true);
          }
        );
      } catch (e) {
        console.error('Player.delete', e);
        reject(e);
      }
    });
    return del;
  }

  handleMediaMessage(message, admin, bot) {
    //Show Message Details
    if(debug) { console.info(message); }
    const modMsg = message;
    //Save all the images
    if(message.photo) {
      const caption = (message.caption) ? message.caption : '';
      for (let i = 0; i < modMsg.photo.length; i++) {
        modMsg.photo[i].admin = admin;
        modMsg.photo[i].player_id = message.from.id;
        modMsg.photo[i].bot = bot;
        Common.saveImage(modMsg.photo[i], caption);
      }
    } else if(message.document) {
      const caption = (message.caption) ? message.caption : message.document.file_name;
      modMsg.document.player_id = modMsg.from.id;
      modMsg.document.bot = bot;
      Common.saveFile(message.document, caption);
    } else if(message.audio || message.voice) {
      const audioSave = message.audio || message.voice;
      audioSave.title = message.caption || 'voice';
      audioSave.player_id = message.from.id;
      audioSave.bot = bot;
      Common.saveAudio(audioSave);
    }
  }

  handleSpecific(messageObj) {
    let finalized = false;
    let reply = '';
    switch(messageObj.text) {
      case 'meow':
        finalized = true;
        reply = 'meow';
        break;
      default:
        finalized = false;
    }
    if(reply) {
      Emitter.emit(this.toBot, messageObj.chat.id, reply);
    }
    return finalized;
  }

  handleSpecificStep(bot, step, text) {
    if(bot === 'scuar') {
      switch(step) {
        case 'REG':
          if(Common.imatch(text, 'here')) {
            return [ 'SCUAR runs on only the most modern case-sensitive technology. Try that again, but all lower-case.' ]
          }
          return false;
          break;
        default:
          return false;
      }
    } else if(bot === 'snack') {
      switch(step) {
        case 'OBSERVE':
          if(text.match(/^(zero|none|one|two|three|0|1|2|3|)$/)) { //less than expected
            return [
              'Hmmm. You missed some. If you want, go back and count again. If not, keep going and know that you’re at high risk of detection! At least you’re disguised. If you’re over that mission, answer this: did you reach the location?'
            ]
          } else if(text.match(/^(eight|nine|ten|eleven|8|9|10|11|12|0|1|2|3|)$/)) { //more
            return [
              'Paranoid much? That’s too many cameras! Better safe than sorry, though. Did you reach the location? Type yes or no.'
            ]
          }
          return false;
          break;
        default:
          return false;
      }
    } else {
      return false;
    }
  }
}

export default Message;
