/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "text!dialog/dialogs/unauthorized.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "unauthorized", LAYOUT_SRC, function( dialog, data ) {
    var message = dialog.rootElement.querySelector( ".message" );
    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );
    dialog.assignEnterKey( "default-ok" );
  });
});