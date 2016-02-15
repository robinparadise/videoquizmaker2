/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  Butter.Editor.register( "animatePlugin", "load!{{baseDir}}templates/assets/editors/animatePlugin/animatePlugin-editor.html",
    function( rootElement, butter ) {

    var _rootElement = rootElement,
        _trackEvent,
        _manifestOptions,
        _butter,
        _this = this,
        _popcornOptions;

    /**
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ) {
      _trackEvent = trackEvent,
      _manifestOptions = _trackEvent.manifest.options;
      _popcornOptions = _trackEvent.popcornOptions;

      var container = _rootElement.querySelector( ".editor-options" ),
          advancedContainer = _rootElement.querySelector( ".advanced-options" ),
          pluginOptions = {},
          ignoreKeys = ["start", "end", "animation"],
          startEndElement;


      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = {
          element: element,
          trackEvent: trackEvent,
          elementType: elementType
        };
      }

      function attachHandlers() {
        var key,
            option,
            _animationType = advancedContainer.querySelector( ".animation-select" );

        _animationType.addEventListener( "change", function onChange( e ) {
          trackEvent.selected && trackEvent.update({
            animation: e.target.value
          });
        }, false );

        for ( key in pluginOptions ) {
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];
            if ( option.elementType === "input" ) {
              if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key );
              }
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
          }
        }
      }

      startEndElement = _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe );
      container.insertBefore( startEndElement, container.firstChild );
        

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: container,
        advancedContainer: advancedContainer,
        ignoreManifestKeys: ignoreKeys
      });

      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

    }

    function onTrackEventUpdated( e ) {
      _this.updatePropertiesFromManifest( e.target );
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        setup( trackEvent );
      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  }, true);
}( window.Butter ));
