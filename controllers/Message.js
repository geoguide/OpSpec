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
    try {
      connection.query('INSERT INTO messages SET ?', [{
        player_id: data.from.id,
        message_id: data.message_id,
        chat_id: data.chat.id,
        message: data.text,
        telegram_id: data.from.id,
        state,
        bot
      }], (error, results) => {
        if (error) throw error;
        if(debug) { console.log('message inserted', results.insertId); }
      });
    } catch (e) {
      console.error(e);
    }
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
    if(reply){
      Emitter.emit(this.toBot, messageObj.chat.id, reply);
    }
    return finalized;
  }
}

export default Message;
