const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'snack_brigade'
});

class Common {
  static storeMessage(data, state, bot = 'none') {
    console.log('------- store message called -------');
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
}


export default Common;
