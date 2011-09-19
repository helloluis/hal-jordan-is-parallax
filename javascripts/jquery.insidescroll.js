/*

  jQuery InsideScroll v0.1.20110919

  Licensed under the MIT license
  Copyright 2011 Luis Buenaventura (@helloluis)

  - project started 2011-09-19
  - plugin pattern pilfered from @desandro's Masonry
  - uses the mini-plugin 'smartresize', courtesy of respective author

*/

(function( window, $, undefined ){
  
  /*
   * smartresize: debounced resize event for jQuery
   *
   * latest version and complete README available on Github:
   * https://github.com/louisremi/jquery.smartresize.js
   *
   * Copyright 2011 @louis_remi
   * Licensed under the MIT license.
   */

  var $event = $.event,
      resizeTimeout;

  $event.special.smartresize = {
    setup: function() {
      $(this).bind( "resize", $event.special.smartresize.handler );
    },
    teardown: function() {
      $(this).unbind( "resize", $event.special.smartresize.handler );
    },
    handler: function( event, execAsap ) {
      // Save the context
      var context = this,
          args = arguments;

      // set correct event type
      event.type = "smartresize";

      if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
      resizeTimeout = setTimeout(function() {
        jQuery.event.handle.apply( context, args );
      }, execAsap === "execAsap"? 0 : 100 );
    }
  };

  $.fn.smartresize = function( fn ) {
    return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
  };

  
  // our "Widget" object constructor
  $.InsideScroll = function( options, element ){
    this.element = $( element );
    this._create( options );
  };
  
  
  $.InsideScroll.settings = {};
  
  $.InsideScroll.prototype = {

    _init : function() {
      
    },
    
    _create : function( options ) {
      

      this.options     = $.extend( true, {}, $.InsideScroll.settings, options );

      
    },

    

    check_address_bar : function() {
      
      var hash = document.location.hash.replace("#","");
      if (hash.length>0) {
        if (this.is_valid_target("#"+hash)) {
          return "#"+hash;
        }
      }
      return false;

    },

    _destroy : function() {
      
      $.each(this.targets, function(idx, el){
        var elem = $(el);
        elem.css({
          top : elem.data("InsideScroll-orig-top"),
          left : elem.data("InsideScroll-orig-left")
        }).removeData("InsideScroll-orig-top").
        removeData("InsideScroll-orig-left").
        removeData("InsideScroll-modifier");
      });

    },

    option : function(key, value) {
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
      }
    }
  };
  
  
  // =======================  Plugin bridge  ===============================
  // leverages data method to either create or return $.InsideScroll constructor
  // pilfered from @desandro's Masonry
  
  $.fn.InsideScroll = function( options ) {
    if ( typeof options === 'string' ) {
      // call method
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'InsideScroll' );
        if ( !instance ) {
          logError( "cannot call methods on InsideScroll prior to initialization; " +
            "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for InsideScroll instance" );
          return;
        }
        // apply method
        instance[ options ].apply( instance, args );
      });
    } else {
      this.each(function() {
        var instance = $.data( this, 'InsideScroll' );
        if ( instance ) {
          // apply options & init
          instance.option( options || {} );
          instance._init();
        } else {
          // initialize new instance
          $.data( this, 'InsideScroll', new $.InsideScroll( options, this ) );
        }
      });
    }
    return this;
  };
  
})( window, jQuery );