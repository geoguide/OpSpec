import mysql from 'mysql2';
import Config from '../config.js';
import Common from './Common';
import Emitter from './Emitter';
import AppData from '../data/AppData';
import Player from './Player';

const appData = new AppData();
const { states } = appData;
const common = new Common();
const config = new Config();
const player = new Player();

class Bot {
  constructor(props = null) {
    try {
      if(props) {
        this.bot = props.bot;
        this.from = props.from;
        this.chatId = props.from.id;
      }
      this.messageObject = {};
      this.responses = [];
    } catch (e) {
      console.error(e);
    }
    //console.log('from bot', this);
  }

  handleMessage(messageObject) {
    this.messageObject = messageObject;

    player.load(this.from).then(() => { //Set player up

      //Check for specific response for step

      //check for specific response in general

      if(this.handleCommand(messageObject)) { //Check for command
        console.log('was cmd');
      } else if(this.handleStateSpecific(messageObject)) { //handle state specific responses
        console.log('was state spec');
      } else if(this.handleSpecific(messageObject)) { //Handle specific messages in general
        console.log('was spec');
      } else if(states[player.state].bots && states[player.state].bots.includes(this.bot)) { //Any other answer
        this.checkForAnswer(messageObject, states[player.state].solution).then((result) => { //Check for right answer
          if(result) {
            console.log('was answer');
            var curState = player.state;
            var nextState = states[curState].next;
            //Do answery things
            player.advanceState().then(() => {
              var botState = states[nextState][this.bot];
              this.sendSeries(botState.start);
              if(botState.delay) {
                setTimeout(function() {
                  _this.sendSeries(botState.delay);
                }, 10000);
              } else {
                //console.log('NO DELAY', botState);
              }
            });
          } else {
            console.log('was idle');
            this.responses = this.getIdle();
            this.sendSeries(this.responses);
          }
        });

      } else {
        console.log('this state doesn\'t have this bot.');
        this.responses = this.getIdle();
        this.sendSeries(this.responses);
      }
    });
  }

  sendMessage(m) {
    let message = '';
    if(!m.type || m.type === 'text') {
      message = this.personalize(m.data || m, this.messageObject.text);
      Emitter.emit(this.bot, this.chatId, message);
    } else if(m.type === 'audio') {
      Emitter.emit(this.bot+' audio', this.chatId, m.data);
    }
  }

  sendSeries(messageArray) {
    for(let i = 0; i < messageArray.length; i++) {
      setTimeout(this.sendMessage.bind(this), i * 1000, messageArray[i]);
    }
  }

  personalize(r, messageText = null) {
    let result = r;
    if (this.from.first_name && this.from.first_name !== '') {
      result = r.replace(/PLAYERNAME/g, this.from.first_name);
    } else {
      result = r.replace(/PLAYERNAME/g, 'citizen');
    }
    if(messageText) {
        result = result.replace(/MESSAGE/g, messageText);
    }

    return result;
  }

  getIdle() {
    if(player.state !== null) {
      if(states[player.state] && states[player.state][this.bot].idle) {
        return [Common.getRandomElement(states[player.state][this.bot].idle)];
      }
      return [Common.getRandomElement(states.default[this.bot].idle)];
    }
    return [];
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
      Emitter.emit(this.bot, messageObj.chat.id, reply);
    }
    return finalized;
  }

  //TODO make a function that handles looking at the bot and from and emits properly
  handleCommand(messageObject) {
    const text = messageObject.text;
    const chatId = messageObject.chat.id;

    const command = common.commandTester.test(text);
    let commandAccepted = false;

    if(command) {
      commandAccepted = true;
      //Commands - probably put in array and do while loop TODO
      const echo = /\/echo (.+)/;
      const tell = /\/tell_user (\w+) (.+)/;
      const whoami = /^\/(whoami)/i;
      const stateCmd = /\/(state) (.+)/i;
      const reset = /^\/(reset)/i;
      const checkup = /^\/(checkup)/i;

      if(text.match(echo)) {

        const match = echo.exec(text);
        if(match) {
          Emitter.emit(this.bot, chatId, match[1]);
        }

      } else if(text.match(tell)) {

        const user = match[1];
        const message = match[2];
        Emitter.emit(this.bot, user, message);

      } else if(text.match(whoami)) {

        Emitter.emit(this.bot, chatId, this.from.id);

      } else if(text.match(stateCmd)) {

        const match = stateCmd.exec(text);
        const state = match[2];

        if (this.checkState(state)) {
          player.setState(state.toUpperCase()).then(() => {
            const stateInfo = states[player.state];
            Emitter.emit(this.bot, chatId, `your state is set to *${player.state}: ${stateInfo.title}*`)
          }).catch((error) => console.error(error));
        } else {
          console.error('bad state', state);
          Emitter.emit(this.bot, chatId, `requested state (${state}) is *INVALID*`);
        }

      } else if(text.match(reset)) {

        player.setState('START').then(() => {
          Emitter.emit(this.bot, chatId, `your state is set to *${player.state}*`);
        }).catch((error) => console.error(error));

      } else if(text.match(checkup)) {

        let message = '';
        if (this.checkState(player.state)) {
          message = `your state is set to *${player.state}: ${states[player.state].title}*`;
        } else {
          message = `bot your state is MESSED UP *${player.state}*`;
        }

        Emitter.emit(this.bot, this.chatId, message);

      } else {
        commandAccepted = false;
      }
    }
    return commandAccepted;
  }

  checkForAnswer(messageObject, solution) {
    var text = messageObject.text;
    console.log('checkin');
    const win = new Promise((resolve, reject) => {
      if(!solution || !solution.type) {
        resolve(false);
      } else if(solution.type === 'match' && Common.iincludes(text, solution.win)) { //win
        resolve(true);
      } else if(solution.type === 'pass') {
        resolve(true);
      } else if(solution.type === 'async') {
        solution.win(messageObject).then(() => {
          resolve(true);
        }).catch(() => {
          resolve(false);
        });
      } else if(solution.type === 'multi') { //Needs to get redesigned if going to be used
        console.log(solution);
        if(solution.win.includes(text)) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else if(solution.type === 'type') {
        console.log('type: ', messageObject);
        if(messageObject[solution.data]) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else if(solution.type === 'includes') {
        if(Common.iincludes(text, solution.win)) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
    return win;
  }

  handleStateSpecific(messageObject) {
    return false;
  }

  checkState(state) {
    let valid = false;
    if (states[state.toUpperCase()]) {
      valid = true;
    }
    return valid;
  }
}

export default Bot;
