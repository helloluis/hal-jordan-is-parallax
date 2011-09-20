/*

  jQuery Parallax v0.1.20110919
  Full-page takeover alternative to jQuery UI's Dialog and/or various Lightbox-style plugins

  Licensed under the MIT license
  Copyright 2011 Luis Buenaventura (@helloluis)

  - project started 2011-09-03
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
  $.Parallax = function( options, element ){
    this.element = $( element );
    this._create( options );
    // this._init();
  };
  
  
  $.Parallax.settings = {
    orientation     : "vertical",
    ignore_hashes   : false,
    targets         : []
  };
  
  $.Parallax.prototype = {

    _init : function() {
      
    },
    
    _create : function( options ) {
      

      this.options     = $.extend( true, {}, $.Parallax.settings, options );

      var para         = this;
      this.orientation = this.options.orientation;
      this.target_data   = [];

      if (this.options.targets.length===0) {
        this.targets   = this.element.children();
      } else {
        var t = [];
        $(this.options.targets).each(function(){
          t.push( $(this) );
        });
        this.targets   = t;
      }
 
      // store the current scrollTop or scrollLeft, depending on which orientation the user chose
      this.scrollTop    = 0;
      this.scrollLeft   = 0;

      // store the current direction the user is scrolling. if downwards, then downwards=true
      this.downwards    = null;
      this.rightwards   = null;
       
      this.max_width    = 0;
      this.max_height   = 0;

      // this is the slowest an element will move in response to a window.scroll(), i.e., 1/100th of a pixel
      this.min_modifier = 1;
      this.max_modifier = 999;

      this.scrolling    = false;

      // figure out highest and lowest z-index
      para.max_z = 0;
      $(para.targets).each(function(idx, target){        
        var z = parseInt($(this).css("z-index"));
        if (z >= para.max_z) { para.max_z = z; }  
      });

      para.min_z = para.max_z;
      $(para.targets).each(function(idx, target){
        var z = parseInt($(this).css("z-index"));        
        if (z <= para.min_z) { para.min_z = z; }
      });

      console.log("z-index min & max", para.min_z, para.max_z);

      // calculate the height of the element, based on the height of the nearest, tallest target
      this._calculate_element_height();

      // record each target's respective coordinates and add a parallax modifier which 
      // we'll use to figure out how to position it
      $.each(para.targets, function(idx, target){
        $(target).each(function(){
          
          var top    = $(this).position().top,
              left   = $(this).position().left,
              zindex = parseInt($(this).css("z-index")),
              mod    = para._calculate_modifier(zindex);
          
          para.target_data.push([ top, left, mod, zindex ]);

          $(this).data({
            "parallax-orig-top"  : top,
            "parallax-orig-left" : left,
            "parallax-modifier"  : mod,
            "parallax-zindex"    : zindex
          });

          if (mod==para.max_z) { $(this).css("position","fixed") }

        });
      });

      $(window).scroll(function(){
        console.profile('moveby');
        var win   = $(this),
          winTop  = win.scrollTop(),
          winLeft = win.scrollLeft();

        $.each(para.targets, function(idx, target){
          para._move_by( idx, target, winTop, winLeft );
        });
        console.profileEnd('moveby');

      });
      
    },

    // the lower the z-index value, the higher the modifier
    _calculate_modifier : function( zindex ) {
      
      if (typeof(zindex)!=="number") { zindex=1; }
      if (zindex > this.min_z) {
        if (zindex < this.max_z) {
          return this.max_z - zindex;
        } else {
          return this.min_z;
        }
      } else {
        return this.max_z;
      }

    },

    _calculate_element_height : function( ) {
      var tallest = 0;
      for (var i=0; i < this.targets.length; i++) {
        if (this.targets[i].css("z-index")==this.max_z) {
          var h = this.targets[i].offset().top + this.targets[i].outerHeight();
          if (tallest < h) {
            tallest = h;
          }
        }
      }
      this.element.height( tallest );
      return tallest;
    },

    // the higher a modifier is, the more pronounced the parallax effect is.
    // the parallax effect is achieved by "slowing down" an element's movement
    // across the screen as the window is scrolled. very distant objects 
    // (with the greatest amount of parallax) will take a very long time to disappear,
    // while the closest object (with the lowest parallax modifier of "1") 
    // will be scrolled off-screen as normal.
    _move_by : function( idx, el, winTop, winLeft ) {

      var orig_top  = this.target_data[idx][0],
          orig_left = this.target_data[idx][1],
          mod       = this.target_data[idx][2],
          zindex    = this.target_data[idx][3];

      //console.log('scrolling');
      
      if (this.orientation=='horizontal') {

        // TODO 
        el.css({ left : style });

      } else if (this.orientation=='vertical') {

        if (mod > 1 && el.css("position")!="fixed") {

          var scrollBy = winTop * (mod/this.max_z),
            newTop     = orig_top + scrollBy,
            dist       = Math.abs(el.position().top - newTop);
          
          el.stop(true,false);

          if ( dist > 100 ) {
            //console.log('animating');
            el.animate({ top : newTop }, { duration: 100, easing : "linear", queue : false });
          } else {
            el.css({ top : newTop });  
          }

        }

      }
      
    },

    // the lowest z-index will require a scroll_to value of exactly what the window.scrollTop() would be
    // the highest z-index will require half of what the window.scrollTop() would be
    // so to compute everything in between those two, we just do a bit of algebra
    scroll_to : function( target, add_hash ){
      
      var para     = this;

      if (target!==undefined) {
        para.scroll_target = target;
      }

      if (!para.is_valid_target( para.scroll_target )) {
        return false;
      }

      console.log("scrolling to " + para.scroll_target);

      var scroller = $("body"),
          el       = $(para.scroll_target),
          mod      = el.data("parallax-modifier"),
          top      = el.data("parallax-orig-top"),
          left     = el.data("parallax-orig-left");
      
      //if (document.location.hash!=para.scroll_target) {
        if (para.orientation=='horizontal') {
          scroller.animate({ 'scrollLeft' : left },{ 
            duration : 500, 
            complete : function(){
              document.location.hash = para.scroll_target;
            } 
          });
          
        } else if (para.orientation=='vertical') {
          scroller.animate({ 'scrollTop' : top },{ 
            duration : 500, 
            complete : function(){
              document.location.hash = para.scroll_target;
            }  
          });

        }
      //}
    },

    is_valid_target : function( el ) {

      if ($(el).data("parallax-modifier")) {
        return true;
      } else {
        return false;
      }

    },

    _reset_to_orig : function() {
     
      $.each(this.targets, function(idx, el){
        $(el).animate({
          top : $(el).data("parallax-orig-top"),
          left : $(el).data("parallax-orig-left")
        },100);
      });

    },

    _destroy : function() {
      
      $.each(this.targets, function(idx, el){
        var elem = $(el);
        elem.css({
          top : elem.data("parallax-orig-top"),
          left : elem.data("parallax-orig-left")
        }).removeData("parallax-orig-top").
        removeData("parallax-orig-left").
        removeData("parallax-modifier");
      });

    },

    option : function(key, value) {
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
      }
    }
  };
  
  
  // =======================  Plugin bridge  ===============================
  // leverages data method to either create or return $.Parallax constructor
  // pilfered from @desandro's Masonry
  
  $.fn.parallax = function( options ) {
    if ( typeof options === 'string' ) {
      // call method
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'Parallax' );
        if ( !instance ) {
          logError( "cannot call methods on Parallax prior to initialization; " +
            "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for Parallax instance" );
          return;
        }
        // apply method
        instance[ options ].apply( instance, args );
      });
    } else {
      this.each(function() {
        var instance = $.data( this, 'Parallax' );
        if ( instance ) {
          // apply options & init
          instance.option( options || {} );
          instance._init();
        } else {
          // initialize new instance
          $.data( this, 'Parallax', new $.Parallax( options, this ) );
        }
      });
    }
    return this;
  };
  
})( window, jQuery );