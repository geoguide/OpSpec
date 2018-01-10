import mysql from 'mysql2';
import Config from '../config.js';

const config = new Config();

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
    //console.log('constructor got', props);
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
        this.date = props.chat.date;
        this.text = props.chat.text;
        //console.log('Message.js says', JSON.stringify(this, 2));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export default Message;
