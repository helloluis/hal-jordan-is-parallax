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
    orientation          : "vertical",
    ignore_hashes        : false,
    background_position  : false,
    lowest_z             : false,
    highest_z            : false,
    force_width          : false,
    force_height         : false,
    targets              : []
  };
  
  $.Parallax.prototype = {

    _init : function() {
      
    },
    
    _create : function( options ) {
      
      this.options      = $.extend( true, {}, $.Parallax.settings, options );

      var para          = this;

      this.scrolled     = false;
      this.blocking     = false;
      
      this.background_position = this.options.background_position;
      // boolean
      // there are two techniques that we can use to achieve parallax. the first is to just have a bunch of absolutely-positioned
      // elements all over the place, with varying z-indexes. we move these elements in varying speeds to achieve parallax.
      // the other technique, is to use background-position. (to activate this, we set the background_position option to true.)
      // using this strategy, all parallaxed elements are stretched so that they cover the entirety of the body/window (whichever
      // happens to be larger), and the parallax visual effect is achieved by adjusting the background-position-x/y attribute of
      // each element as the user scrolls.

      this.orientation  = this.options.orientation;
      // 'vertical' or 'horizontal'
      
      this.highest_z    = this.options.highest_z;
      this.lowest_z     = this.options.lowest_z;
      // integer
      // the difference between min_z/max_z and lowest_z/highest_z is that the former is the largest z-index that we can find amongst
      // our possible target elements, whereas the latter is a user-defined, purely arbitrary value. highest_z is useful
      // for defining extreme differences in depth between the parallaxed elements and the foreground. so for example,
      // if all your parallaxed elements had z-indexes in the range of 5-10, and you set a highest_z of 99, there would be
      // a very pronounced difference in speed between your background elements and your foreground. without a highest_z value,
      // the speed variance would be pretty shallow, because the max_z would only be 10, in this case.

      this.target_data  = [];

      if (this.options.targets.length===0) {
        this.targets    = this.element.children();
      } else {
        var t = [];
        $(this.options.targets).each(function(){
          t.push( $(this) );
        });
        this.targets    = t;
      }
 
      // store the current scrollTop or scrollLeft, depending on which orientation the user chose
      this.scrollTop    = 0;
      this.scrollLeft   = 0;

      // store the current direction the user is scrolling. if downwards, then downwards=true
      this.downwards    = null;
      this.rightwards   = null;
      
      this.max_width    = 0;
      this.max_height   = 0; 
      this.force_width  = this.options.force_width;
      this.force_height = this.options.force_height;

      // this is the slowest an element will move in response to a window.scroll(), i.e., 1/100th of a pixel
      this.min_modifier = 1;
      this.max_modifier = 999;

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

      
      var resizeBg = function() {
        if (!para.force_width) {
          para.max_width  = $('body').width() > $(window).width() ? $('body').width() : $(window).width();  
        } else {
          para.max_width = para.force_width;
        }

        if (!para.force_height) {
          para.max_height = $('body').height() > $(window).height() ? $('body').height() : $(window).height();  
        } else {
          para.max_height = para.force_height;
        }

        if (para.options.background_position===true) {
          $.each(para.targets, function(idx, target){
            $(this).width( para.max_width ).height( para.max_height );
          });
        }
      };

      resizeBg();

      para.element.height( para.max_height );

      // console.log(this.target_data);
      // console.log("z-index min & max", para.min_z, para.max_z);

      // record each target's respective coordinates and add a parallax modifier which 
      // we'll use to figure out how to position it
      $.each(para.targets, function(idx, target){
        $(target).each(function(){
          var tgt    = $(this),
              top    = para.background_position===false ? tgt.position().top  : parseInt(tgt.css("background-position-y")),
              left   = para.background_position===false ? tgt.position().left : parseInt(tgt.css("background-position-x")),
              zindex = parseInt(tgt.css("z-index")),
              mod    = para._calculate_modifier(zindex),
              width  = tgt.outerWidth(),
              height = tgt.outerHeight();
          
          para.target_data.push([ top, left, mod, zindex, width, height ]);

          tgt.data({
            "parallax-orig-top"  : top,
            "parallax-orig-left" : left,
            "parallax-modifier"  : mod,
            "parallax-zindex"    : zindex
          });

          if (mod==para.max_z) { tgt.css("position","fixed") }

        });
      });

      var manualScroll = function(){
        para._move_all($(this));
      };

      // ($.browser.mozilla || $.browser.msie) ? $('html') : $('body');
      // $.Window.bind('scroll', function(e){});

      // both the throttled manualScroll and the (debounced) smartresize do similarly limited actions
      // manualScroll only fires every 50ms, while resizeBg fires after 100ms has passed
      // this is to ensure that the browser doesn't go nuts triggering scroll() and resize() events
      // over and over again with very little actual effect on the layout
      $(window).bind('scroll', manualScroll); // .smartresize( resizeBg );
      // TODO: try doing this without the jquery object, and see if we can do things any faster
    },

    // the lower the z-index value, the higher the modifier
    _calculate_modifier : function( zindex ) {
      
      if (typeof(zindex)!=="number") { zindex=1; }
      
      var min = (this.lowest_z ? this.lowest_z : this.min_z);
      var max = (this.highest_z ? this.highest_z : this.max_z);

      if (zindex > min) {
        if (zindex < max) {
          return max - zindex;
        } else {
          return min;
        }
      } else {
        return max;
      }

    },

    _calculate_element_height : function( ) {

      var tallest = 0;
      // for (var i=0; i < this.targets.length; i++) {
      //   if (this.targets[i].css("z-index")==this.max_z) {
      //     var h = this.targets[i].offset().top + this.targets[i].outerHeight();
      //     if (tallest < h) {
      //       tallest = h;
      //     }
      //   }
      // }
      this.element.height( tallest );
      this.max_y = tallest;
      return tallest;
    },

    // iterates through all our targets and moves them by a specific amount,
    // dependent on their respective stored modifiers
    _move_all : function( win ) {

      var para    = this,
          winTop  = win.scrollTop(),
          winLeft = win.scrollLeft(),
          css_attrib = this.orientation == 'horizontal' ? 
            (this.background_position===true ? 'background-position-x' : 'left') :
            (this.background_position===true ? 'background-position-y' : 'top');

      $.each(para.targets, function(idx, target){
        para._move_by( idx, target, winTop, winLeft, css_attrib );
      });

    },

    // the higher a modifier is, the more pronounced the parallax effect is.
    // the parallax effect is achieved by "slowing down" an element's movement
    // across the screen as the window is scrolled. very distant objects 
    // (with the greatest amount of parallax) will take a very long time to disappear,
    // while the closest object (with the lowest parallax modifier of "1") 
    // will be scrolled off-screen as normal.
    _move_by : function( idx, el, winTop, winLeft, css_attrib ) {

      var orig_top  = this.target_data[idx][0],
          orig_left = this.target_data[idx][1],
          mod       = this.target_data[idx][2],
          max_z     = this.highest_z ? this.highest_z : this.max_z;
      
      if (this.orientation=='horizontal') {

        if (mod != max_z) {
          el.css(css_attrib, orig_left + (winLeft * (mod/max_z)));
        }

      } else if (this.orientation=='vertical') {

        if (mod != max_z) {
          el.css(css_attrib, orig_top + (winTop * (mod/max_z)));
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

      //console.log("scrolling to " + para.scroll_target);

      var scroller = $("body"),
          el       = $(para.scroll_target),
          mod      = el.data("parallax-modifier"),
          top      = el.data("parallax-orig-top"),
          left     = el.data("parallax-orig-left");
      
      if (para.orientation=='horizontal') {
        scroller.animate({ 'scrollLeft' : left },{ 
          duration : 500,
          easing   : "swing", 
          complete : function(){
            document.location.hash = "/" + para.scroll_target.replace("#","");
          } 
        });
        
      } else if (para.orientation=='vertical') {
        scroller.animate({ 'scrollTop' : top },{ 
          duration : 500, 
          easing   : "swing",
          complete : function(){
            document.location.hash = "/" + para.scroll_target.replace("#","");
          }  
        });

        //console.log('firing automatic scroll');

      }
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