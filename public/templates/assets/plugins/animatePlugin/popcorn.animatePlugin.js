// PLUGIN: Media

(function ( Popcorn ) {

  if (!sheetList) {
    var sheetList = {};
  }

  var createSheet = (function() {
    // Create the <style> tag
    var style = document.createElement("style");
    // Add a media (and/or media query) here if you'd like!
    // style.setAttribute("media", "screen")
    // style.setAttribute("media", "@media only screen and (max-width : 1024px)")
    // WebKit hack :(
    style.type = "text/css";
    style.appendChild(document.createTextNode(""));
    style.innerHTML = "";

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style;
  });

  function createTextNode(text) {
    return document.createTextNode(text);
  }
  function addCSSRule(id, textNode) {
    if (!sheetList[id]) {
      return;
    }
    sheetList[id].appendChild(textNode);
  }
  function removeSheet(id) {
    if (sheetList[id]) {
      try {
        document.head.removeChild(sheetList[id]);
        delete sheetList[id];
      } catch(Ex) {}
    }
  }
  function restartSheet(id) {
    if (sheetList[id]) {
      removeSheet(id);
    }
    if (sheetList) {
      sheetList[id] = createSheet();
    }
  }

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" || isNaN(value) === false ) {
      return value;
    }
    return fallback;
  }
  var getUniqueID = function(instance, parent) {
    return ("animate-" + instance.id+"-"+parent.id).toLowerCase();
  }

  var updateRules = function( instance, options ) {
    var id = "."+options.idType,
        width = "width:"+validateDimension( options.width, "100" ) + "% !important;",
        height = "height:"+validateDimension( options.height, "100" ) + "% !important;",
        top = "top:"+validateDimension( options.top, "0" ) + "% !important;",
        left = "left:"+validateDimension( options.left, "0" ) + "%!important;",
        listNodes = [];

    if (options.rotate) {
      var rotate = validateDimension(options.rotate, "0")
      listNodes = [
        "transform:rotate("+rotate+"deg) !important;",
        "-ms-transform:rotate("+rotate+"deg) !important;",
        "-moz-transform:rotate("+rotate+"deg) !important;",
        "-webkit-transform:rotate("+rotate+"deg) !important;"
      ];
    }
    options.width  && listNodes.push(width);
    options.height && listNodes.push(height);
    options.top    && listNodes.push(top);
    options.left   && listNodes.push(left);

    if (options.animation && options.animation !== "nothing") {
      var duration = validateDimension( options.duration, 1 ),
          iterationCount = validateDimension( options.iterationCount, 1 );
      if (!iterationCount || iterationCount === 0 || iterationCount === "0") {
        iterationCount = "infinite";
      }

      listNodes.push("-webkit-animation-duration: "+duration+"s;");
      listNodes.push("animation-duration: "+duration+"s;");
      listNodes.push("-webkit-animation-fill-mode: both;");
      listNodes.push("animation-fill-mode: both;");
      listNodes.push("-webkit-animation-name: "+options.animation+";");
      listNodes.push("animation-name: "+options.animation+";");
      listNodes.push("-webkit-animation-iteration-count: "+iterationCount+";");
      listNodes.push("animation-iteration-count: "+iterationCount+";)");
    }

    if (listNodes.length > 0) {
      restartSheet(options.id);
      var textNode = id+"{"+listNodes.join("")+"}";
      textNode = createTextNode(textNode);
      addCSSRule(options.id, textNode);
    }
  }
  
  Popcorn.plugin( "animatePlugin" , {
      
    manifest: {
      about:{
        name: "Popcorn Animate Plugin",
        version: "0.1",
        author: "@robin"
      },
      defaultName: "Animate",
      options:{
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
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "units": "%"
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "units": "%"
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "units": "%",
          optional: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "units": "%",
          optional: true
        },
        rotate: {
          elem: "input",
          type: "number",
          label: "Rotate",
          "units": "deg",
          optional: true
        },
        animation: {
          elem: "select",
          values: [],
          label: "Animation",
          "default": "nothing",
          hidden: true
        },
        duration: {
          elem: "input",
          type: "number",
          label: "Duration",
          "units": "s",
          "default": 1,
          group: "advanced"
        },
        iterationCount: {
          elem: "input",
          type: "number",
          label: "Iteration Count (0 = infinite)",
          "units": "s",
          "default": 1,
          group: "advanced"
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Slide Up", "Slide Down", "Fade" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-slide-up", "popcorn-slide-down", "popcorn-fade" ],
          label: "Transition",
          "default": "None",
          hidden: true
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
      var superParent = this.animate(options);
      if (superParent && superParent._container) {
        options.idType = getUniqueID(options, superParent);
        updateRules(superParent, options);
        superParent._container.classList.add(options.idType);

        if (options._running) {
          superParent._container.style.display = "none";
          setTimeout(function(){
            superParent._container.style.display = "block";
          }, 1);
        }
      }
    },
    /**
     * The start function will be executed when the currentTime 
     * of the video  reaches the start time provided by the 
     * options variable
     */
    start: function( event, options ) {
      // this.function();
      var superParent = this.animate(options);
      if (superParent && superParent._container) {
        if (!options.idType) {
          options.idType = getUniqueID(options, superParent);
        }
        if (superParent._container) {
          superParent._container.classList.add(options.idType);
        }
        updateRules(superParent, options);
      }
      
    },
    /**
     * The end function will be executed when the currentTime 
     * of the video  reaches the end time provided by the 
     * options variable
     */
    end: function( event, options ) {
      var superParent = this.animate(options);
      if (superParent && superParent._container) {
        superParent._container.classList.remove(options.idType);
        removeSheet(options.id);
      }
    },
    _teardown: function( options ) {
      var superParent = this.animate(options);
      if (superParent && superParent._container) {
        superParent._container.classList.remove(options.idType);
        removeSheet(options.id);
      }
    }
  });

})( Popcorn );
