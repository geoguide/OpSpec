import mysql from 'mysql2';
import Config from '../config.js';
import AppData from '../data/AppData';

const appData = new AppData();
const { states } = appData;
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
              self.admin = result.admin;
              self.scuarbot = result.scuarbot;
              self.snackbot = result.snackbot;
              self.telegram_id = result.id;
              self.username = result.username;
              self.first_name = result.first_name;
              self.last_name = result.last_name;
              self.state = result.state;
              self.substate = result.substate;
              resolve(true);
            } else {
              console.log('- Player not found, creating');
              self.create(playerObj)
                .then(() => self.load(playerObj))
                .then(() => resolve('new_player'))
                .catch(createchainerror => console.error(createchainerror));
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
          self.substate = playerObj.substate;
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
          'UPDATE `players` SET '
          + '`first_name` = ?, `last_name` = ?, `state` = ?, substate = ? WHERE id = ?',
          [self.first_name, self.last_name, self.state, self.substate, self.id],
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

  advanceState() {
    const self = this;
    self.state = states[self.state].next;
    return self.save();
  }

  delete() {
    const self = this;
    const del = new Promise((resolve, reject) => {
      try {
        connection.query(
          'DELETE FROM `players` WHERE id = ?', [self.id],
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

  setContactedBot(bot) {
    const self = this;
    let sql = '';

    const update = new Promise((resolve, reject) => {
      try {
        if(bot === 'snackbot') {
          sql = 'UPDATE `players` SET `snackbot` = 1 WHERE id = ?';
        } else if(bot === 'scuarbot') {
          sql = 'UPDATE `players` SET `scuarbot` = 1 WHERE id = ?';
        } else {
          throw Error('setContactedBot: invalid bot!');
        }
        connection.query(
          sql,
          [self.id],
          (error) => {
            if (error) throw error;
            resolve(true);
          }
        );
      } catch (e) {
        console.error('Player.setContactedBot', e);
        reject(e);
      }
    });
    return update;
  }

  setState(state) {
    const self = this;
    self.state = state;
    const load = new Promise((resolve, reject) => {
      try {
        const query = connection.query(
          'UPDATE `players` SET `state` = ?, substate = 0 WHERE id = ?',
          [state, self.id],
          (error) => {
            if (error) throw error;
            self.state = state;
            resolve(true);
          }
        );
        //console.log(query.sql);
      } catch (e) {
        console.error('Player.setState', e);
        reject(e);
      }
    });
    return load;
  }

  //meh
  setSubState(substate) {
    const self = this;
    self.substate = substate;
    const load = new Promise((resolve, reject) => {
      try {
        connection.query(
          'UPDATE `players` SET `substate` = ? WHERE id = ?',
          [substate, self.id],
          (error) => {
            if (error) throw error;
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

  /* More programmatically advantageous system for v2 */
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
