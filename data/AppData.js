
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

    this.states = {
      0: {
        title: 'Step 0',
        bots: ['scuar'],
        start: [
          'Please enter your *unique id*'
        ],
        inprogress: [
          'ID Not found, please try again',
          'That isn\'t a valid ID'
        ]
      },
      1: {
        title: 'Welcome',
        bots: ['scuar'],
        start: [
          'Hello PLAYERNAME!',
          'Welcome to the Access Initiative™, a service provided by the Syndicate on Comestibles and Underwriters for Alimentation and Refreshments (SCUAR)! We’d like to thank you for beginning the enrollment process and taking your first step on the path to food security. Welcome aboard!',
          'SCUAR is a brand new ministry called together by your government with your nutritional needs in mind. We’re here to help you understand your family’s alimentary needs and increase access to the foods you love, three times a day, every day!',
          'In this convenient ePacket, you will find all the information you need to finish becoming a part of this exciting new program and ensure that you and your loved ones never miss a SCUAR meal again!',
          'https://www.scuar.com/ePacket.pdf',
          'When you have reviewed our materials, please respond by confirming the city you will be completing the program in'
        ],
        inprogress: [
          'We don\'t have a program in that city, are you sure you spelled it correctly?'
        ],
        problems: [0]
      },
      2: {
        title: 'Demographics',
        bots: ['scuar'],
        start: [
          'Oakland! Great. Go Giants!',
          'The high-tech SCUAR department runs exclusively on the newest and most advanced payment techniques.  To register with SCUAR and receive your first meal, please go to the following location: XXXX  To begin you will need $20 in cash, and to download a wallet for your SCUARcoin, which you can download for free here:  XXXXXX',
          'Once you’ve arrived at the registration point, send a text saying “Here”.'
        ],
        inprogress: [
          'We cannot confirm your location to be correct. Please let us know you have arrived at XXXX by texting us "here".'
        ],
        notes: 'after Xms send audio file'
      },
      3: {
        title: 'Bitcoin Orientation',
        bots: ['scuar', 'snack'],
        start: [
          'Welcome to the SCUAR Machine™, everyone’s favorite high-tech ATM-style futuristic gatekeeper to food security!  Take your $20, put it into the machine, and transfer the coins to your bitcoin wallet.'
        ],
        inprogress: [
          'Just send me the text address and logo for now'
        ],
        notes: 'This step there are two success criteria and the game branches'
      },
      4: {
        title: 'Initiation',
        bots: ['snack'],
        start: [
          'Password: "full facial"'
        ],
        inprogress: [
          'Have you started your retina scan for meal distribution?'
        ],
        inprogress_snack: [
          'Let me know when you have the code word'
        ],
        notes: 'Send Voice Message about the story of SCUAR',
        termination: 'Give code word to get disguise'
      },
      5: {
        title: 'Observation Mission',
        bots: ['snack'],
        start: [
          'sneak around audio'
        ]
      },
      6: {
        title: 'Snack Procurment',
        bots: ['snack'],
        start: [
          'You found all the cameras!  Or maybe you didn’t.  That’s ok.  You can go look for them later.  I’m hungry, aren’t you?  Let’s eat.  Snack Brigade is all about snacking when you feel it. Free Snacks are never truly free, but they are still delicious, and “free” means more than one thing!',
          'Let’s go in this place.  It’s Open.  Keep your disguise on.  This place is heavily surveilled.  Go up to the counter and order the “Special Snack.”  You’ll need to give them some Bitcoin, but you know all about that now.',
        ]
      },
      7: {
        title: 'Plaque',
        bots: ['snack'],
        start: [
          'Go to Snow Park and find the plaque'
        ]
      },
      8: {
        title: 'Vandalism and debriefing',
        bots: ['snack'],
        start: [
          'asdfalsdfasdfasdf'
        ]
      }
    };
  }
}

export default AppData;
