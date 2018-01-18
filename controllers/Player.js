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
  //Load Player from database
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
        console.error('Player.load', e);
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
        }, (error, results) => {
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
        console.error('player.create', e);
        reject(e);
      }
    });
    return create;
  }

  save() {
    const self = this;
    const save = new Promise((resolve, reject) => {
      try {
        connection.query(
          'UPDATE `players` SET `first_name` = ?, `last_name` = ?, `state` = ? WHERE id = ?',
          [self.first_name, self.last_name, self.state, self.id],
          (error) => {
            if (error) throw error;
            resolve(true);
          }
        );
      } catch (e) {
        console.error('Player.save', e);
        reject(e);
      }
    });
    return save;
  }

  setState(state) {
    const self = this;
    const load = new Promise((resolve, reject) => {
      try {
        connection.query(
          'UPDATE `players` SET `state` = ? WHERE id = ?',
          [state, self.id],
          (error) => {
            if (error) throw error;
            self.state = state;
            resolve(true);
          }
        );
      } catch (e) {
        console.error('Player.setState', e);
        reject(e);
      }
    });
    return load;
  }

  /* More programmatically advantageous system for v1 */
  getSuccessCriteria() {
    const self = this;
    const save = new Promise((resolve, reject) => {
      try {
        connection.query(
          'SELECT * FROM success_criteria WHERE state = ?',
          [self.state],
          (error, results) => {
            if (error) throw error;
            resolve(results);
          }
        );
      } catch (e) {
        console.error('Player.save', e);
        reject(e);
      }
    });
    return save;
  }

  checkStepComplete() {
    const self = this;
    let success = false;
    if(self.state !== null) {
      success = new Promise((resolve, reject) => {
        self.getSuccessCriteria().then(result => {
          return self.checkCriteriaComplete(result);
        }).then(result => {
          resolve(result);
        }).catch(error => {
          console.error(error);
          reject(error);
        });
      });
      return success;
    }
    return false;
  }

  checkCriteriaComplete(results) {
    const self = this;
    let playerSuccess = 0;
    const complete = new Promise((resolve, reject) => {
      try {
        connection.query(
          'SELECT * FROM player_success_criteria WHERE player_id = ? AND criteria_id IN (?)',
          [self.id, results.map(a => a.id)],
          (error, result) => {
            if(error) { reject(error); }
            if(result && results.length === result.length) {
              console.log('you had all of them');
              resolve('you had all of them!');
            } else {
              if(!result) { playerSuccess = 0; } else {
                playerSuccess = result.length;
              }
              console.log('you had', playerSuccess, 'of', results.length);
              resolve('you had', playerSuccess, 'of', results.length);
            }
          }
        );
      } catch(e) {
        console.error(e);
        reject(e);
      }
    });
    return complete;
  }
}

export default Player;
