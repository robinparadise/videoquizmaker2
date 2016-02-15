(function ( Popcorn ) {
  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  var STATS = STATS || {};

  var Tutorial = { "multiList": [
    {
      "ques": "Can you get this question wrong?",
      "ansSel": ["Nope", "No way", "Of course not"],
      "ans": "No"
    },
    {
      "ques": "What is the anwser to the Life, Universe and Everything?",
      "ansSel": ["<m>42</m>"],
      "ans": "42"
    },
    {
      "ques": "Why did the chicken cross the road?",
      "ansSel": ["Because she want to", "What is a chicken?",
        "The chicken would probably not be aware that he was crossing a road as chickens have limited congnitive abilities"],
      "ans": "To get to the other side"
    },
    {
      "ques": "Get it?",
      "ansSel": ["Try again", "Go back", "End tutorial"],
      "ans": "So clear!"
    }
  ]};
  var defaultQuizName = "Tutorial";

  var optDefault = {
      title: "Simple statements",
      disableRestart: true,
      disableDelete: false,
      allRandom: false,
      random: false,
      fxSpeed: "fast",
      hoverClass: "q-ol-hover",
      showFeedback: false,
      numOfQuizQues: 0,
      showHTML: false
  };
  var target, gettingQuizzes, _Butter;

  // We are on Editor
  if (typeof Butter !== "undefined") {
    _Butter = Butter;
  }

  var errorNotifier = function (options, plus) {
    var error = [
      "<div class='error-quiz'>",
      !!plus? plus + " >> " : "",
      "jQuizme Error: Quiz '",
      options.name,
      "' has no questions</div>"
    ].join("");
  }

  var updateManifestName = function(manifest, option) {
    if (manifest && manifest.name && manifest.name.options) {
      if ($.inArray(option, manifest.name.options) === -1) {
        manifest.name.options.push(option);
      }
    }
  }

  var changeQuizCSS = function($elem, options) {
    if (options.color && options.color !== $elem.attr("color-quiz")) {
      $elem.attr("color-quiz", options.color);
      if (options.color === "custom") {
        $elem.css({
          'border-color': options.customColor,   // Change Header Background Color
          'background': options.customBodyColor, // change Body Background Color
          'color': options.customBodyFontColor   // change Body Font Color
        });
        $elem.find(".q-header-main").css({
          'background': options.customColor,     // Change Header Background Color
          'color': options.customHeaderFontColor // change Header Font Color
        });
      }
    }
    if (options.customFontSize) {
      $elem.css({'font-size': options.customFontSize + "px"});   // change Quiz Font Size
    }
    if (options.hideHeader) {
      $elem.find(".q-header-main").css({
        display: "none"
      });
    }
    else {
      $elem.find(".q-header-main").css({
        display: "block"
      });
    }
  }

  var spliceQuestions = function(options) {
    var questionsArray = [];
    var quizName = Object.keys(options.quizJSON)[0];
    var quiz = options.quizJSON[quizName];
    Object.keys(quiz).forEach(function(tQuiz) {
      var typeQuiz = tQuiz;
      var questions = quiz[typeQuiz].slice(0);
      Object.keys(questions).forEach(function(i) {
        questionsArray[questionsArray.length] = {};
        questionsArray[questionsArray.length-1][typeQuiz] = [questions[Number(i)]];
      });
    });
    var index = Number(options.indexQuestion);
    return questionsArray.slice(index-1, index)[0];
  }

  var createQuiz = function(options) {
    if (!!options.quizJSON) {
      options.$container.find(".error-quiz, .quiz-el").remove();

      var quizClone;
      if (Number(options.indexQuestion) > 0) {
        quizClone = spliceQuestions(options);
      } else {
        quizClone = $.extend({}, options.quizJSON[options.name]);
      }
      if ($.isEmptyObject( STATS[options.name]) ) {
        STATS[options.name] = {};
      }
      try{
        options.$container.jQuizMe(quizClone, options.optQuiz, options.callback, STATS);
      }catch(ex){}
      // Change Quiz Appearence
      changeQuizCSS(options.$container.find(".quiz-el"), options);
    }
  }

  var getQuiz = function(that, options, manifest) {
    if (typeof Butter !== "undefined") {
      _Butter = Butter;
    }

    // if we are in butter then look for new quizzes in QuizOptions
    if (!!_Butter) {
      if (!!_Butter.QuizOptions && !!_Butter.QuizOptions[options.name]) {
        options.quizJSON = {};
        options.quizJSON[options.name] = $.extend({}, _Butter.QuizOptions[options.name]);
        createQuiz(options);
        // Update manifest
        manifest.name.options = Object.keys(_Butter.QuizOptions);
      }
      else { // Use Popcorn.xhr to get Quizzes
        gettingQuizzes = true;

        that.getQuizzes(function(data) {

          if (data.json && data.json.error === "unauthorized") {
            errorNotifier(options, "unauthorized");
            updateManifestName(manifest, defaultQuizName);
            if (options.name === defaultQuizName ) { // Default quiz
              options.quizJSON = {};
              options.quizJSON[defaultQuizName] = Tutorial;
              createQuiz(options);
            }
            gettingQuizzes = false;
            return;
          }

          _Butter.QuizOptions = {};
          for(var n in data.json.all) { // Get all quizzes
            _Butter.QuizOptions[data.json.all[n].name] = JSON.parse(data.json.all[n].data);
          }
          options.quizJSON = {};
          options.quizJSON[options.name] = $.extend({}, _Butter.QuizOptions[options.name]);

          if (options.quizJSON && options.quizJSON[options.name]) {
            createQuiz(options);
            // updateManifestName
            manifest.name.options = Object.keys(_Butter.QuizOptions);
          }
          else {
            errorNotifier(options);
            updateManifestName(manifest, defaultQuizName);
          }
          gettingQuizzes = false;
        });
      }
    }
    // we are not in butter
    else {

      if (!!options.quizJSON && !!options.quizJSON[options.name]) {
        createQuiz(options);
        updateManifestName(manifest, options.name);
      }
      // Default quiz
      else if (options.name === defaultQuizName ) {
        options.quizJSON = {};
        options.quizJSON[defaultQuizName] = Tutorial;
        createQuiz(options);
        // update manifest
        updateManifestName(manifest, options.name);
      }
    }
  }

  Popcorn.plugin( "quizme", {

    manifest: {
      about:{
        name: "Popcorn jQuizme Plugin",
        version: "0.1",
        author: "@robin",
        website: "jquizme.googlecode.com",
        keyname: "quizme"
      },
      options:{
        title: {
          elem: "input", 
          type: "text", 
          label: "Title",
          optional: true,
          "default": "Simple statements"
        },
        name: {
          elem: "select", 
          options: ["Tutorial"], 
          label: "Quiz",
          "default": "Tutorial"
        },
        review: {
          elem: "input",
          type: "checkbox",
          label: "Review",
          "default": false,
          optional: true
        },
        random: {
          elem: "input",
          type: "checkbox",
          label: "Random",
          "default": false,
          optional: true
        },
        hideDetails: {
          elem: "input",
          type: "checkbox",
          label: "Hide final details",
          "default": false,
          optional: true
        },
        customFontSize: {
          elem: "input",
          type: "number",
          label: "Font Size",
          units: "px",
          "default": "19",
          group: "style"
        },
        hideHeader: {
          elem: "input",
          type: "checkbox",
          label: "Hide Header",
          "default": false,
          optional: true,
          group: "style"
        },
        color: {
          elem: "select", 
          options: [
            "dark",
            "white",
            "red",
            "yellow",
            "gold",
            "green",
            "blue",
            "darkGrey",
            "transparent",
            "custom"
          ], 
          label: "Color Quiz",
          "default": "custom",
          group: "style"
        },
        customColor: {
          elem: "input",
          type: "color",
          optional: true,
          label: "Custom Color Quiz",
          "default": "#052938",
          group: "style"
        },
        customHeaderFontColor: {
          elem: "input",
          type: "color",
          optional: true,
          label: "Custom Header Font Color",
          "default": "#ffffff",
          group: "style"
        },
        customBodyColor: {
          elem: "input",
          type: "color",
          optional: true,
          label: "Custom Body Background Color",
          "default": "#ffffff",
          group: "style"
        },
        customBodyFontColor: {
          elem: "input",
          type: "color",
          optional: true,
          label: "Custom Body Font Color",
          "default": "#000000",
          group: "style"
        },
        help: {
          elem: "input", 
          type: "text", 
          label: "Help",
          optional: true,
          "default": "You do not need help.",
          group: "advanced"
        },
        intro: {
          elem: "textarea",
          label: "Introduction",
          optional: true,
          group: "advanced"
        },
        numOfQuizQues: {
          elem: "input", 
          type: "text", 
          label: "Number of the Questions (0 = all)",
          optional: true,
          "default": 0,
          group: "advanced"
        },
        indexQuestion: {
          elem: "input", 
          type: "text", 
          label: "Index of the Question (0 = all)",
          optional: true,
          "default": 0,
          group: "advanced"
        },
        showHTML: {
          elem: "input",
          type: "checkbox",
          label: "Show HTML",
          "default": false,
          optional: true,
          group: "advanced"
        },
        nonblock: {
          elem: "input",
          type: "checkbox",
          label: "Don't Pause",
          "default": false,
          optional: true,
          group: "advanced"
        },
        allStats: {
          elem: "input",
          type: "checkbox",
          label: "Show All Statistics",
          "default": false,
          optional: true,
          group: "advanced"
        },
        start: {
          elem: "input",
          type: "text",
          label: "In",
          "units": "seconds"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          "units": "seconds"
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 60,
          "units": "%",
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 90,
          "units": "%",
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 0,
          "units": "%",
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 10,
          "units": "%",
          hidden: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Slide Up", "Slide Down", "Fade" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-slide-up", "popcorn-slide-down", "popcorn-fade" ],
          label: "Transition",
          "default": "popcorn-fade",
          hidden: true
        },
        zindex: {
          "default": 1,
          hidden: true
        },
        quizJSON: {
          elem: "textarea",
          label: "quiz",
          optional: true,
          hidden: true
        },
        target: {
          hidden: true
        },
      }
    },

    _setup: function( options, event ) {
      options._target = target = Popcorn.dom.find( options.target );
      options._container = document.createElement( "div" );
      options._container.classList.add( "jquizme-container" );
      options._container.style.width = validateDimension( options.width, "100" ) + "%";
      options._container.style.height = validateDimension( options.height, "100" ) + "%";
      options._container.style.top = validateDimension( options.top, "0" ) + "%";
      options._container.style.left = validateDimension( options.left, "0" ) + "%";
      options._container.style.zIndex = +options.zindex;
      options._container.classList.add( options.transition );
      options._container.classList.add( "off" );

      options._container.style.display = "none";
      if ( !target && Popcorn.plugin.debug ) {
        throw new Error( "target container doesn't exist" );
      }
      target && target.appendChild( options._container );

      var manifest = options._natives.manifest.options;

      // Default Values
      if (!options.title) {
        options.title = manifest.title.default;
      }
      if (!options.help) {
        options.help = manifest.help.default;
      }

      // jQuizme options
      options.optQuiz = $.extend({}, optDefault);
      options.optQuiz.title = options.title;
      options.optQuiz.review = options.review;
      options.optQuiz.help = options.help;
      options.optQuiz.allRandom = options.random;
      options.optQuiz.intro = options.intro;
      options.optQuiz.numOfQuizQues = options.numOfQuizQues>0? options.numOfQuizQues:undefined;
      options.optQuiz.hideDetails = options.hideDetails;
      options.optQuiz.showHTML = options.showHTML;
      options.optQuiz.allStats = options.allStats;
      options.optQuiz.name = options.name;

      // Object Callback with functions that jquizme execute when finish
      options.callback = {
        popcorn: this,
        continueFlow: this.continueFlow,
        quizResult: function(info) { // Continue with the next Flow
          this.popcorn.continueFlow(options, info); 
        }
      }
      options.$container = $(options._container);

      if (!options.name) {
        options.name = defaultQuizName;
      }
      getQuiz(this, options, manifest);
    },

    start: function( event, options ) {
      if (!options.$container.children().hasClass("quiz-el") && !gettingQuizzes) {
        var manifest = Popcorn.manifest.quizme.options;
        getQuiz(this, options, manifest);
      }
      if ( options._container ) {
        options._container.classList.add( "on" );
        options._container.classList.remove( "off" );
        options._container.style.display = "";
      }
      if (options.nonblock !== true) {
        this.pause();
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
        options._container.style.display = "none";
        options.$container.find(".quiz-el").remove();
      }
    },

    _teardown: function( options ){
      target && target.removeChild( options._container );
    },
  });
}( window.Popcorn ));
