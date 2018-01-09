
class Config {
  constructor() {
    this.bots = {
      snackbot: {
        key: 'xxxxxxx:keyfromtelegrambotfather1'
      },
      scuar_old: {
        key: 'xxxxxxx:keyfromtelegrambotfather2'
      },
      scuar: {
        key: 'xxxxxxx:keyfromtelegrambotfather3'
      }
    };
    this.mysql = {
      host: 'localhost',
      user: 'root',
      database: 'snack_brigade',
      password: ''
    };
  }
}

export default Config;
