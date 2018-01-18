
class AppData {
  constructor() {
    this.states = {
      0: {
        title: 'Welcome'
      },
      1: {
        title: 'Registration'
      },
      2: {
        title: 'Story'
      },
      3: {
        title: 'Disguise'
      },
      4: {
        title: 'Observation Mission'
      },
      5: {
        title: 'Buy a snack'
      },
      6: {
        title: 'Eat a snack'
      }
    };

    this.audio = {
      snack1: 'CQADAQADRwADDEG5RikV-VdpKkD9Ag'
    };

    this.debug = false;
  }
}

export default AppData;
