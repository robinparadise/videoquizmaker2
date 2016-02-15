/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/eventmanager" ],
  function( EventManager ) {

  return function( trackEventObj, options ) {

    var _id = trackEventObj.id,
        _trackEvent = trackEventObj,
        _this = this,
        _type = _trackEvent.type,
        _lines = {},
        _rules = {};

    Object.defineProperties( this, {
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },
      allLines: {
        enumerable: true,
        get: function() {
          return _lines;
        }
      },
      allRules: {
        enumerable: true,
        get: function() {
          return _rules;
        }
      }
    });

    this.createPopupRule = function() {
      if (_trackEvent.type === "quizme") { // Rule for plugin quizme
        return {
          time: {},
          pass: "true",
          score: {
            condition: "more-equal",
            value: 50
          },
          questions: {
            name: _trackEvent.popcornOptions.name, // name Quiz
            assured: "correct answer", // default assured by answered correctly
            userAnswer: "true"
          },
          keyrule: 'score' // by Default
        }
      } else { // others plugins
        return {
          pass: "true",
          keyrule: 'pass', // by Default
        }
      }
    }

    this.addLine = function( trackEvent, options ) {
      if ( !_lines[trackEvent.id] || this.isDeletedLine(trackEvent.id) ) { // New Line
        var popupRule = _this.createPopupRule();
        popupRule.backward = options.backward;
        popupRule.manual = options.manual;
        _lines[trackEvent.id] = {
          line: options.line,
          manual: options.manual,
          backward: options.backward,
          startInstance: _trackEvent,
          endInstance: trackEvent,
          rule: popupRule,
        }
        // New Popup Rule
        _rules[trackEvent.id] = popupRule;
        _trackEvent.update({rules: _rules});
      }
      else {
        this.setLine(trackEvent.id, options);
      }
    }

    this.setLine = function(trackEventID, options, preventUpdate) {
      if ( !!_lines[trackEventID] ) {
        if (options.backward !== undefined) {
          _lines[trackEventID].backward = options.backward;
          _rules[trackEventID].backward = options.backward;
          if (_lines[trackEventID].line) {
            _lines[trackEventID].line.backward = options.backward;
          }
        }
        if (options.manual !== undefined) {
          _lines[trackEventID].manual = options.manual;
          _rules[trackEventID].manual = options.manual;
          if (_lines[trackEventID].line) {
            _lines[trackEventID].line.manual = options.manual;
          }
        }
        if (options.line) {
          _lines[trackEventID].line = options.line;
        }
        if (options.endInstance) {
          _lines[trackEventID].endInstance = options.endInstance;
        }
        if (!preventUpdate) {
          _trackEvent.update({rules: _rules});
        }
      }
    }
    this.setRule = function(trackEventID, options) {
      if ( !!_rules[trackEventID] ) {
        if (options.left)  _rules[trackEventID].left = options.left;
        if (options.top)   _rules[trackEventID].top  = options.top;
        _trackEvent.update({rules: _rules});
      }
    }

    this.removeLine = function(trackEventID, preventUpdate) {
      if ( !!_lines[trackEventID] ) {
        delete _lines[trackEventID];
        delete _rules[trackEventID];
      }
      if (!preventUpdate) {
        _trackEvent.update({rules: _rules});
      }
    }

    this.setDeletedLine = function(trackEventID, preventUpdate) {
      if ( !!_lines[trackEventID] ) {
        _lines[trackEventID] = {deleted: true};
        _rules[trackEventID] = {deleted: true};
        if (!preventUpdate) {
          _trackEvent.update({rules: _rules});
        }
      }
    }

    this.isLine = function(trackEventID) {
      if (!!_lines[trackEventID]) {
        return _lines[trackEventID].line instanceof Kinetic.Line;
      }
      return false;
    }

    this.isDeletedLine = function(trackEventID) {
      if (!!_lines[trackEventID]) {
        if (!!_lines[trackEventID].deleted) {
          return true;
        }
      }
      return false;
    }

    this.update = function(teID) {
      if (teID && !_lines[teID].manual) {
        _this.setLine(teID, {manual: true}); // and update itself
      } else {
        _trackEvent.update({rules: _rules});
      } 
    }

    this.isLeafNode = function() {
      return Object.keys(_lines).length < 1;
    }

    this.addRefLine = function( trackEventID, options ) {
      if ( !_lines[trackEventID] ) { // New Line
        _lines[trackEventID] = {
          manual: options.manual,
          backward: options.backward,
          startInstance: _trackEvent,
          endInstance: trackEventID,
          rule: options.rule,
        }
        // New Popup Rule
        _rules[trackEventID] = options.rule;
      }
    }

    // When the line in not create yet (is undefined because is a project imported)
    // but a line must be exist then is a Reference Line ;)
    // So, we look if the endInstance is a "string", this string references to the instance
    this.isRefLine = function(trackEventID) {
      if ( !!_lines[trackEventID] ) {
        return typeof(_lines[trackEventID].endInstance) === "string";
      }
      return false;
    }

    // When a Found backup or project (options is not undefined), then create the references lines
    if (!!options && options.rules) {
      var opt = {};
      Object.keys(options.rules).forEach(function(id) {
        if (options.rules[id].deleted) {
          _lines[id] = {deleted: true};
          _rules[id] = _lines[id];
        }
        else {
          opt.backward = options.rules[id].backward;
          opt.manual = options.rules[id].manual;
          opt.rule = $.extend({}, options.rules[id]);
          _this.addRefLine(id, opt);
        }
      });
    }

  }; //Lines
});
