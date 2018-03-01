
class AppData {
  constructor() {
    this.states = {
      'NEW': {
        title: 'Newb',
        next: 'START',
        snack: false,
        scuar: true
      },
      'START': {
        title: 'Welcome',
        next: 'REG',
        snack: false,
        scuar: true
      },
      'REG': {
        title: 'Registration',
        next: 'STORY',
        snack: false,
        scuar: true
      },
      'STORY': {
        title: 'Story',
        next: 'FACIAL',
        snack: false,
        scuar: true
      },
      'FACIAL': {
        title: 'Disguise',
        next: 'OBSERVE',
        snack: true,
        scuar: false
      },
      'OBSERVE': {
        title: 'Observation Mission',
        next: 'SNACK',
        snack: true,
        scuar: false
      },
      'SNACK': {
        title: 'Buy a snack',
        next: 'EAT',
        snack: true,
        scuar: false
      },
      'EAT': {
        title: 'Eat a snack',
        next: 'WIN',
        snack: true,
        scuar: false
      },
      'WIN': {
        title: 'Vandalism and debriefing',
        next: null,
        snack: true,
        scuar: false
      }
    };

    this.audio = {
      snack1: 'CQADAQADRwADDEG5RikV-VdpKkD9Ag',
      logo: 'http://www.snackbrigade.com/assets/snack-brigade-1-audio/010-look-for-logo.mp3',
      leave_open: 'http://www.snackbrigade.com/assets/snack-brigade-1-audio/030-leave-open.mp3',
      observe: 'http://www.snackbrigade.com/assets/snack-brigade-1-audio/040-observation-mission.mp3',
      debriefing: 'http://www.snackbrigade.com/assets/snack-brigade-1-audio/060-long-may-he-floss.mp3'
    };

    this.noSave = [
      'hi',
      'hello',
      'meow',
      'asdf'
    ];

    this.debug = false;
    //TODO break out into a state object with alimentary
    // and into two different response objects so we can do:
    //const { responseObject } = appData.snack;
    //OR Combine with other object
    this.responseObject = {
      initial: {
        scuar: [
          'Thank you for contacting SCUAR. Your time is important to us'
        ],
        snack: [
          'Welcome to the snack resistance'
        ]
      },
      NEW: {
        title: 'Step 0',
        scuar: {
          start: [
            'Please enter your *unique ID*'
          ],
          idle: [
            'ID not found, please try again',
            'That isn\'t a valid ID'
          ]
        },
        snack: {
          start: [
            'Who are you? Who sent you?!'
          ],
          idle: [
            'HWat!?'
          ]
        }
      },
      START: {
        title: 'Welcome',
        bots: ['scuar'],
        scuar: {
          start: [
            'Hello PLAYERNAME!',
            'Welcome to the Access Initiative™, a service provided by the Syndicate on Comestibles and Underwriters for Alimentation and Refreshments (SCUAR)! We’d like to thank you for beginning the enrollment process and taking your first step on the path to food security. Welcome aboard!',
            'In this convenient [ePacket](http://www.scuar.agency/resources/epacket.pdf), you will find all the information you need to finish becoming a part of this exciting new program and ensure that you and your loved ones never miss a SCUAR meal again! For more information, go to: http://www.scuar.agency',
            'Once you’ve reviewed these materials, please respond with the name of the city in which you will be enrolling in our program.'
          ],
          idle: [
            'We don\'t have a program in that city. Are you sure you spelled it correctly?',
            '"MESSAGE" - that is not Oakland: Sorry. SCUAR has not set up an outpost in your city yet. Try again in 2019 or enter a different city. '
          ]
        },
        snack: {
          start: [
            'Who are you? Who sent you?!'
          ],
          idle: [
            'HWat!?'
          ]
        }
      },
      REG: {
        title: 'Demographics',
        bots: ['scuar'],
        scuar: {
          start: [
            'Oakland! Great! Go Giants!',
            'SCUAR uses only the newest and most advanced payment techniques to keep your payments secure. To register with SCUAR, please go to the following location: https://goo.gl/maps/ZEoWuVLkNKL2',
            'To begin, you will need $20 in cash, and a digital wallet for your SCUARcoin, which you can download for free here: https://freewallet.org/currency/eth. Once you have downloaded your wallet, send us your ETH address or whatever address.',
            'Do not proceed to the Registration Point until you have downloaded your ETH wallet. Once you have downloaded your ETH wallet and arrived at the registration point, send a text saying, “here” (all lower case).'
          ],
          idle: [
            'We cannot confirm your location to be correct. Please let us know you have arrived at XXXX by texting us "here".'
          ]
        },
        snack: {
          start: [
            'Who are you? Who sent you?!'
          ],
          idle: [
            'HWat!?'
          ]
        }
      },
      STORY: {
        title: 'Bitcoin Orientation',
        bots: ['scuar', 'snack'],
        scuar: {
          start: [
          'Welcome to the SCUAR Machine™, everyone’s favorite high-tech, ATM-style futuristic gatekeeper to Ultimate Food Security! Don’t forget to send us your ETH address so we can exchange your $20 US Dollars for ETH. Or, buy this snack and get your complimentary ETH. Here’s how you send your ETH address and some info on what a QR code is: [link to QR code info and instructions on sending ETH address, and why it’s okay to send a public address.]'
          ],
          idle: [
            'Please send us your ETH address. It’s a QR code, which looks like a square. We love squares.'
          ],
          substates: {
            0: ['Send something'],
            1: ['Send Virus'],
            2: ['Send Address']
          }
        },
        snack: { //TODO substates might not be needed here, maybe eth address is objective and photo just triggers a separate type of event that is not win state
          start: [
            'Who are you? Who sent you?!'
          ],
          idle: [
            'HWat!?'
          ],
          substates: {
            0: ['Send something'],
            1: ['Send Virus'],
            2: ['Send Address']
          }
        }
      },
      'FACIAL': {
        title: 'Initiation',
        bots: ['snack'],
        scuar: {
          start: [
            'S̷͇̱͘ő̴̝m̴͉̗̕ė̸̜̻t̷͔͕̚͝h̵̛̬̠́i̴̻̩̽͗n̷̥͍͑g̸̥̦̈́́ ̸̭̉s̸͉̙̄ê̵̱͒e̴̙͌̃͜m̶̧̄̍s̶̳̔̎ ̴̬͐͛t̵̢̐͘o̷̩͆ ̸͓̕͝h̶̝̟̓̋a̵̻͝v̸̦̐̊e̴̲̟̍̈́ ̴̧͍̍͐g̸̰͛͛ǒ̷̱͖́n̶̗̅͐ē̵̞̙̍ ̶̲̜̏w̷̖͋͝ŗ̷̝̂̍ö̴̢̪n̸͖̽g̷̨͌'
          ],
          idle: [
            'Have you started your facial scan for meal distribution?'
          ]
        },
        snack: {
          start: [
            'Yes! Welcome to the Snack Brigade! We’re glad you’re here! You probably want to know what’s going on. Start walking toward _____location and play the audio file we’re about to send you. When you’re ready to receive the file, text “send it” to Snackbrigadebot. Don’t worry--it might take a moment to arrive, but it’s coming!'
          ],
          idle: [
            'That\'s not your face!'
          ]
        },
        idle_snack: [
          'Let me know when you have the code word'
        ],
        notes: 'Send Voice Message about the story of SCUAR',
        termination: 'Give code word to get disguise'
      },
      OBSERVE: {
        title: 'Observation Mission',
        bots: ['snack'],
        scuar: {
          start: [
            'I\'m broken'
          ],
          idle: [
            'I\'m broken!'
          ]
        },
        snack: {
          start: [
            'sneak around audio'
          ],
          idle: [
            'How many cameras did you see?'
          ]
        }
      },
      SNACK: {
        title: 'Snack Procurment',
        bots: ['snack'],
        scuar: {
          start: [
            'I\'m broken'
          ],
          idle: [
            'I\'m broken!'
          ]
        },
        snack: {
          start: [
            'You found all the cameras!  Or maybe you didn’t.  That’s ok.  You can go look for them later.  I’m hungry, aren’t you?  Let’s eat.  Snack Brigade is all about snacking when you feel it. Free Snacks are never truly free, but they are still delicious, and “free” means more than one thing!',
            'Let’s go in this place.  It’s Open.  Keep your disguise on.  This place is heavily surveilled.  Go up to the counter and order the “Special Snack.”  You’ll need to give them some Bitcoin, but you know all about that now.',
          ],
          idle: [
            'snack idle 6'
          ]
        }
      },
      EAT: {
        title: 'Plaque',
        bots: ['snack'],
        scuar: {
          start: [
            'I\'m broken'
          ],
          idle: [
            'I\'m broken!'
          ]
        },
        snack: {
          start: [
            'You made it! Nearby, you should see a commemorative plaque. Do you see it? Once you find it, text us the final four words on the plaque. Remember the case sensitive thing.'
          ],
          idle: [
            'Whaaaat is the plaque'
          ]
        }
      },
      WIN: {
        title: 'Vandalism and debriefing',
        bots: ['snack'],
        scuar: {
          start: [
            'Audio File'
          ],
          idle: [
            'I\'m broken!'
          ]
        },
        snack: {
          start: [
            'You won?'
          ],
          idle: [
            'You already won. Go tell a friend'
          ]
        }
      },
      default: {
        title: 'Default Information',
        bots: ['scuar', 'snack'],
        scuar: {
          start: [],
          idle: [
            'There were not idle options'
          ]
        },
        snack: {
          start: [],
          idle: [
            'There are idle options, but it\'s up to you to figure them out.'
          ]
        }
      }
    };
  }
}

export default AppData;
