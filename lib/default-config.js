// This is the default configuration for the Popcorn Maker server
// You shouldn't edit this file. Instead, look at the README for
// various configuration options

module.exports = {
  // hostname must match the address in your browser's URL bar
  // If it does not, then Persona sign-in will not work
  // Don't add any trailing slashes, just protocol://hostname[:port]
  // "hostname": "http://videoquizmaker.herokuapp.com",
  "hostname": "http://localhost:8000",

  // PORT is the port that the server will bind to
  // PORT is all caps because all the PaaS providers do it this way
  "PORT": 8000,
  
  // API Keys for Media Sync
  "SYNC_SOUNDCLOUD": "d2idm12domodo12mdo12mdo2d12d",
  "SYNC_FLICKR": "b939e5bd8aa696db965888a31b2f1964",
  // Public API Key
  "SYNC_GIPHY": "dc6zaTOxFJmzC",
  "SYNC_LIMIT": 20,

  // NODE_ENV is the environment you're running the server in
  // It determines whether to apply optimizations or not
  // Any string is an acceptable value, but most node modules care
  // whether it's set to "development" or "production"
  // "NODE_ENV": "production",
  "NODE_ENV": "development",
  "NEW_RELIC_HOME": false,

  "logger" : {
    "format" : "dev"
  },
  "session" : {
    "secret": "thisisareallyreallylongsecrettoencryptcookies",
    "cookie": {
      "maxAge": 2419200000,
      "httpOnly": true,
    },
    "proxy": true
  },
  "staticMiddleware": {
    "maxAge": "0"
  },
  "dirs": {
    "wwwRoot": "public",
    "templates": "public/templates"
  },
  "publishStore": {
    "type": "local",
    "options": {
      "root": "./user_published",
      "namePrefix": "v",
      "nameSuffix": ".html"
    }
  },
  "feedbackStore": {
    "type": "local",
    "options": {
      "root": "./user_published",
      "namePrefix": "feedback",
      "nameSuffix": ".json"
    }
  },
  "crashStore": {
    "type": "local",
    "options": {
      "root": "./user_published",
      "namePrefix": "crash",
      "nameSuffix": ".json"
    }
  },
  "imageStore": {
    "type": "s3",
    "key": "AKIAJVQAK3LCQ7EUV6AA",
    "hostname": "https://s3-us-west-2.amazonaws.com/vmimage350072",
    "secret": "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",
    "bucket": "vmimage350072",
    "namePrefix": "images",
    "options": {
      "key": "AKIAJVQAK3LCQ7EUV6AA",
      "secret": "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",
      "bucket": "vmimage350072",
      "hostname": "https://s3-us-west-2.amazonaws.com/vmimage350072",
      "namePrefix": "images"
    }
  },
  "templates": {
    "basic": "{{templateBase}}basic/config.json",
    "test": "{{templateBase}}basic/config.json"
  },
  // "database": {
  //   "hostname": "ec2-54-243-50-213.compute-1.amazonaws.com",
  //   "database": "d7j70kglnhaq1s",
  //   "username": "baszzhnpozwjab",
  //   "password": "eMfAtJBz9MTb4JjzB6PIkrSS_a",
  //   "port": 5432,
  //   "options": {
  //     "logging": console.log,
  //     "host": "ec2-54-243-50-213.compute-1.amazonaws.com",
  //     "user": "baszzhnpozwjab",
  //     "password": "eMfAtJBz9MTb4JjzB6PIkrSS_a",
  //     "port": 5432,
  //     "dialect": "postgres",
  //     "storage": "popcorn.postgresql",
  //     "native": true,
  //     "define": {
  //       "charset": "utf8",
  //       "collate": "utf8_general_ci"
  //     }
  //   }
  // }
  "database": {
    "database": "popcorn",
    "username": null,
    "password": null,
    "options": {
      "logging": console.log,
      "dialect": "sqlite",
      "storage": "popcorn.sqlite",
      "native": true,
      "define": {
        "charset": "utf8",
        "collate": "utf8_general_ci"
      }
    }
  }
};
