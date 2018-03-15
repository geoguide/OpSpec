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


class RegistrationCode {
  constructor(props = null) {
    try {
      if(props) {
        this.code = props.code;
      }
    } catch (e) {
      console.error(e);
    }
  }

  static checkCode(code) {
    const check = new Promise((resolve, reject) => {
      try {
        const query = connection.query('SELECT * FROM registration_codes WHERE ?', {
          code
        }, (error, results) => {
          if (error) throw error;
          if(results.length === 0) {
            reject('id not found');
          } else if(results[0].used === 1 && results[0].sticky === 0) {
            console.log('should be false');
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
    return check;
  }

  static applyCode(messageObject) {
    const { text, from } = messageObject;
    return RegistrationCode.checkCode(text).then((result) => {
      console.log('ok usingggg', text);
      return RegistrationCode.useCode({ player_id:from.id, code: text });
    });
  }

  static useCode(codeInfo) {
    console.log('use code', codeInfo);
    const use = new Promise((resolve, reject) => {
      try {
        const sql = 'UPDATE registration_codes SET used = 1, ' +
          'player_id = ?, date_used = now() WHERE code = ? AND sticky = 0';
        const query = connection.query(sql,
          [codeInfo.player_id, codeInfo.code]
        , (error, results) => {
          if (error) throw error;
            resolve(true);
        });
        //console.log('!important', query);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
    return use;
  }
}

export default RegistrationCode;
