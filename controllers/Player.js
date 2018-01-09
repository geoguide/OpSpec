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


class Player {
  load(playerObj) {
    const self = this;
    const load = new Promise((resolve, reject) => {
      try {
        connection.query(
          'SELECT * FROM `players` WHERE id = ?',
          [playerObj.id],
          (error, results) => {
            if (error) throw error;
            if (results.length > 0) {
              console.log('- Player found, loading');
              const result = results[0];
              self.id = result.id;
              self.telegram_id = result.id;
              self.username = result.username;
              self.first_name = result.first_name;
              self.last_name = result.last_name;
              self.state = result.state;
              resolve(true);
            } else {
              console.log('- Player not found, creating');
              self.create(playerObj).then(() => resolve('new_player'));
            }
          }
        );
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
    return load;
  }

  create(playerObj) {
    const self = this;
    const create = new Promise((resolve, reject) => {
      try {
        const { id, first_name, last_name, username } = playerObj;
        connection.query('INSERT INTO players SET ?', {
          id, first_name, last_name, username
        }, (error, results, fields) => {
          if (error) throw error;
          self.id = playerObj.id;
          self.telegram_id = playerObj.id;
          self.username = playerObj.username;
          self.first_name = playerObj.first_name;
          self.last_name = playerObj.last_name;
          self.state = playerObj.state;
          resolve(results.insertId);
        });
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
    return create;
  }

  setState(state) {
    const self = this;
    const load = new Promise((resolve, reject) => {
      try {
        connection.query(
          'UPDATE `players` SET `state` = ? WHERE id = ?',
          [state, self.id],
          (error, results, fields) => {
            if (error) throw error;
            self.state = state;
            resolve(true);
          }
        );
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
    return load;
  }
}

export default Player;
