const mysql = require('mysql2');
import AppData from '../data/AppData';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'snack_brigade'
});

const appData = new AppData();
//For development
const debug = appData.debug;

class Common {
  static storeMessage(data, state, bot = 'none') {
    if(debug) { console.log('------- store message called -------'); }
    try {
      connection.query('INSERT INTO messages SET ?', {
        player_id: data.from.id,
        message_id: data.message_id,
        message: data.text,
        telegram_id: data.from.id,
        state,
        bot
      }, (error, results) => {
        if (error) throw error;
        console.log('message inserted', results.insertId);
      });
    } catch (e) {
      console.error(e);
    }
  }

  static saveImage(imageData, title = null) {
    if(debug) { console.log('------- store message called -------'); }
    const { file_id, file_size, height, width } = imageData;
    try {
      connection.query('INSERT INTO images SET ?', {
        file_id,
        file_size,
        height,
        width,
        title
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
    const { file_id, file_size } = fileData;
    try {
      connection.query('INSERT INTO files SET ?', {
        title,
        file_id,
        file_size
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
    const { file_id, file_size, title = null, mime_type, duration } = audioData;
    try {
      connection.query('INSERT INTO audio SET ?', {
        title,
        file_id,
        file_size,
        mime_type,
        duration
      }, (error, results) => {
        if (error) throw error;
        if(debug) { console.log('image saved', results.insertId); }
      });
    } catch (e) {
      console.error('Common.saveImage', e);
    }
  }
}


export default Common;
