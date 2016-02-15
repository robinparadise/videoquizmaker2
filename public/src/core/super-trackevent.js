/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/eventmanager" ],
  function( EventManager ) {

  return function( superTrackEvent, options ) {

    var _id = superTrackEvent.id,
        _superTrackEvent = superTrackEvent,
        _isSuperTrackEvent = false,
        _isSubTrackEvent = false,
        _this = this,
        _subTrackEvents = {},
        _allBackground = [
          "cornflowerblue",
          "darkslategrey",
          "darkseagreen",
          "yellowgreen",
          "steelblue",
          "indianred",
          "chocolate",
          "darkcyan",
          "seagreen",
          "brown"
        ],
        _element,
        _parent,
        _background,
        _options = options,
        _subTrackEventsOptions,
        _media = Butter.app;

    Object.defineProperties( this, {
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },
      isSuperTrackEvent: {
        enumerable: true,
        get: function() {
          return _isSuperTrackEvent;
        },
        set: function(val) {
          _isSuperTrackEvent = val;
          if (val === true) {
            _this.setSubTrackEvent(false);
            _this.setBackgroundColor();
          }
          _this.removeAllSubTrackEvents();
          // setPopcornTrackEvent
          _superTrackEvent.update({
            isSuperTrackEvent: val,
            subTrackEvents: [],
          });
        }
      },
      isSubTrackEvent: {
        enumerable: true,
        get: function() {
          return _isSubTrackEvent;
        },
        set: function(val) {
          _isSubTrackEvent = val;
          if (val === true) {
            _this.setSuperTrackEvent(false);
          } else {
            _parent = null;
          }
        }
      },
      parent: {
        enumerable: true,
        get: function() {
          return _parent;
        }
      },
      background: {
        enumerable: true,
        get: function() {
          return _background;
        }
      },
      subTrackEvents: {
        enumerable: true,
        get: function(){
          return _subTrackEvents;
        }
      },
      selectAll: {
        enumerable: true,
        get: function(){
          return _subTrackEvents;
        },
        set: function( val ){
          _selected = val;
        }
      }
    });

    this.setBackgroundColor = function() {
      _background = _allBackground[Math.floor(Math.random()*_allBackground.length)];
    };
    this.setAttrElement = function(trackEvent, attrClass) {
      trackEvent.view.element.setAttribute("super-track-event", _background);
      trackEvent.view.element.classList.add(attrClass);
    };
    this.removeAttrElement = function(trackEvent, attrClass) {
      trackEvent.view.element.removeAttribute("super-track-event");
      trackEvent.view.element.classList.remove("super-track-event");
      trackEvent.view.element.classList.remove("sub-track-event");
    };

    /* SubTrackEvent */
    this.setSubTrackEvent = function( val, parent ) {
      _this.isSubTrackEvent = val;
      if (val && parent) {
        _parent = parent;
        _background = _parent.superTrackEvent.background;
        _this.setAttrElement(_superTrackEvent, "sub-track-event");
      } else {
        _this.removeAttrElement(_superTrackEvent, "sub-track-event");
      }
      // setPopcornTrackEvent
      _superTrackEvent.update({
        isSubTrackEvent: val,
        superParent: _parent? _parent.id : undefined
      });
    };
    this.isSubTrackEventOf = function(parent) {
      if (!_parent) {
        return false
      }
      return _parent.id === parent.id;
    };

    /* SuperTrackEvent */
    this.setSuperTrackEvent = function( val ) {
      _this.isSuperTrackEvent = val;
      if (val === true) {
        _this.setAttrElement(_superTrackEvent, "super-track-event");
      } else {
        _this.removeAttrElement(_superTrackEvent, "super-track-event");
      }
    }

    this.addSubTrackEvent = function( trackEvent ) {
      if (!_subTrackEvents[trackEvent]) {
        _subTrackEvents[trackEvent.id] = trackEvent;
        _this.setAttrElement(trackEvent);
        // set popcornOptions
        _superTrackEvent.update({
          subTrackEvents: Object.keys(_subTrackEvents)
        });
      }
    }
    this.removeSubTrackEvent = function( trackEvent ) {
      trackEvent.superTrackEvent.setSubTrackEvent(false);
      delete _subTrackEvents[ trackEvent.id ];

      // If there're no subTracksEvents, then is a normal TrackEvent
      if (Object.keys(_subTrackEvents).length < 1) {
        _this.setSuperTrackEvent(false);
      }
      else { // update popcornOptions
        _superTrackEvent.update({
          subTrackEvents: Object.keys(_subTrackEvents),
        });
      }
    }

    this.removeAllSubTrackEvents = function() {
      Object.keys(_subTrackEvents).forEach(function(id) {
        _this.removeSubTrackEvent(_subTrackEvents[id]);
      });
    }

    // We need to verify if this is a child of the parent
    this.belongTo = function(trackEvent) {
      if (_isSubTrackEvent) {
        if (_parent.id === trackEvent.id) {
          return true;
        }
      } else if (_isSuperTrackEvent) {
        if (!!_subTrackEvents[trackEvent.id]) {
          return true;
        }
      }
      return false;
    }

    // when the trackevent is dropped somewhere else we need to verify
    // if this still belongs to the SuperTrackEvent.
    this.stillBelongsToParent = function() {
      if (_parent) { // is subTrackEvent
        //var distanceTracks = Math.abs( _superTrackEvent.track.order - _parent.track.order );
        // Is the subTrackEvent belong to the same space of time of the parent and
        // the track-id is close to the parent-track-id (distance is least one track)
        if (_superTrackEvent.popcornOptions.start <= _parent.popcornOptions.end   &&
            _superTrackEvent.popcornOptions.end   >= _parent.popcornOptions.start /*&&
            distanceTracks <= 2*/) {
          return true; // The subTrackEvent is close to the parent
        }
        // Remove from the superTrackEvent: removeTrackEvent
        // Call the function "removeSubTrackEvent" of the parent
        _parent.superTrackEvent.removeSubTrackEvent(_superTrackEvent);
      }
      return false;
    }

    // when the trackevent is dropped somewhere else we need to verify
    // if the childs still belongs to their parent
    this.stillChildsBelongsToParent = function() {
      if (_isSuperTrackEvent) {
        Object.keys(_subTrackEvents).forEach(function(id) {
          _subTrackEvents[id].superTrackEvent.stillBelongsToParent();
        });
      }
    }

    this.getTrackEvent = function(id) {
      return _media.getTrackEvents("id", id)[0];
    }

    _this.onReadySetSuperTrackEvent = function() {
      _this.setSuperTrackEvent(true); // set superTrackEvent
      var subTrackEvent;
      _subTrackEventsOptions.forEach(function(id) {
        subTrackEvent = _this.getTrackEvent(id);
        if (subTrackEvent) {
          subTrackEvent.superTrackEvent.setSubTrackEvent(true, _superTrackEvent); // set subTrackEvent
          _this.addSubTrackEvent(subTrackEvent); // add subTrackEvent
        }
      });
      //_media.dispatch( "trackeventupdated", _superTrackEvent );
    }

    if (!!_options && _options.isSuperTrackEvent && _options.subTrackEvents) {
      _subTrackEventsOptions = _options.subTrackEvents.slice();
      // We need to wait 'til all trackEvent are loaded successfully
      _media.media[0].listen("mediaready", _this.onReadySetSuperTrackEvent);
    }

  }; //SuperTrackEvent
});
