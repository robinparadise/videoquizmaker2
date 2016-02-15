// PLUGIN: Media

(function ( Popcorn ) {
  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }
  var target;
  
  Popcorn.plugin( "mvideo" , {
      
    manifest: {
      about:{
        name: "Popcorn Video Plugin",
        version: "0.1",
        author: "@robin",
        website: "jquizme.googlecode.com"
      },
      options:{
        title: {
          elem: "input", 
          type: "text", 
          label: "Title",
          optional: true
        },
        name: {
          elem: "select", 
          options: ["Video1.mp4", "Video2.mp4", "Video3.mp4"],
          label: "Video",
          "default": "Video2.mp4",
          optional: true
        },
        start: {
          elem: "input", 
          type: "text", 
          label: "In"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out"
        },
        source: {
          elem: "input", 
          type: "text", 
          label: "Source"
        },
        videoStart: {
          elem: "input", 
          type: "text", 
          label: "Video Start",
          "default": 0,
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 100,
          "units": "%",
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 100,
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
          "default": 0,
          "units": "%",
          hidden: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Slide Up", "Slide Down", "Fade" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-slide-up", "popcorn-slide-down", "popcorn-fade" ],
          label: "Transition",
          "default": "popcorn-fade"
        },
        block: {
          elem: "select",
          options: ["No", "Yes"],
          label: "Block",
          "default": "No",
          hidden: true
        },
        zindex: {
          "default": 1,
          hidden: true
        },
        target: {
          hidden: true
        },
      }
    },
    /**
     * @member
     * The setup function will get all of the needed 
     * items in place before the start function is called. 
     */
    _setup : function( options ) { 
      options._target = target = Popcorn.dom.find( options.target );
      options._container = document.createElement( "div" );
      options._container.classList.add( "mvideo-container" );
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

      var video_source;
      if (options.source && options.source !== '') {
        video_source = options.source;
      } else {
        video_source = options.name;
      }

      options._video = Popcorn.smart( options._container, video_source );
      $(options._container).find("video").attr({
        'controls': 'controls',
        'data-butter': 'media'
      });
    },
    /**
     * The start function will be executed when the currentTime 
     * of the video  reaches the start time provided by the 
     * options variable
     */
    start: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "on" );
        options._container.classList.remove( "off" );
        options._container.style.display = "";
      }
      if ($(".status-button").attr("data-state") == "true") {
        options._video.currentTime(options.videoStart);
        options._video.play();
      }
    },
    /**
     * The end function will be executed when the currentTime 
     * of the video  reaches the end time provided by the 
     * options variable
     */
    end: function( event, options ) {
      // ensure that the data was actually added to the 
      // DOM before removal
      if (options._video) {
        try {
          options._video.pause();
          options._video.currentTime(options.videoStart);     
        } catch(ex) {}
      }
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
        options._container.style.display = "none";
      }
    },

    _teardown: function( options ) {
      document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
      $(options._container).parent().remove();
    }
  });

})( Popcorn );
