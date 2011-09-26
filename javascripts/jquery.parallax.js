/*

  jQuery Parallax v0.1.20110919
  Full-page takeover alternative to jQuery UI's Dialog and/or various Lightbox-style plugins

  Licensed under the MIT license
  Copyright 2011 Luis Buenaventura (@helloluis)

  - project started 2011-09-19
  - plugin pattern pilfered from @desandro's Masonry
  - uses the plugin 'ba-throttle-debounce', courtesy of respective author

*/

(function( window, $, undefined ){
  
 /*!
  * jQuery throttle / debounce - v1.1 - 3/7/2010
  * http://benalman.com/projects/jquery-throttle-debounce-plugin/
  * 
  * Copyright (c) 2010 "Cowboy" Ben Alman
  * Dual licensed under the MIT and GPL licenses.
  * http://benalman.com/about/license/
  */
  
  var $ = window.jQuery || window.Cowboy || ( window.Cowboy = {} ),
    jq_throttle;
  
  $.throttle = jq_throttle = function( delay, no_trailing, callback, debounce_mode ) {

    var timeout_id,
      last_exec = 0;
    
    if ( typeof no_trailing !== 'boolean' ) {
      debounce_mode = callback;
      callback = no_trailing;
      no_trailing = undefined;
    }
    
    function wrapper() {
      var that = this,
        elapsed = +new Date() - last_exec,
        args = arguments;
      
      function exec() {
        last_exec = +new Date();
        callback.apply( that, args );
      };
      
      function clear() {
        timeout_id = undefined;
      };
      
      if ( debounce_mode && !timeout_id ) {
        exec();
      }
      
      timeout_id && clearTimeout( timeout_id );
      
      if ( debounce_mode === undefined && elapsed > delay ) {
        exec();
        
      } else if ( no_trailing !== true ) {
        timeout_id = setTimeout( debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay );
      }
    };
    
    if ( $.guid ) {
      wrapper.guid = callback.guid = callback.guid || $.guid++;
    }
    
    return wrapper;
  };
  
  $.debounce = function( delay, at_begin, callback ) {
    return callback === undefined
      ? jq_throttle( delay, at_begin, false )
      : jq_throttle( delay, callback, at_begin !== false );
  };



  /*
   *
   * Main Parallax plugin starts here
   *
   */

  // our "Widget" object constructor
  $.Parallax = function( options, element ){
    this.element = $( element );
    this._create( options );
    // this._init();
  };
  
  
  $.Parallax.settings = {
    orientation          : "vertical",
    ignore_hashes        : false,
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
        para._resize_bg();
      };

      resizeBg();

      para.element.height( para.max_height );

      // console.log("z-index min & max", para.min_z, para.max_z);

      // record each target's respective coordinates and add a parallax modifier which 
      // we'll use to figure out how to position it
      $.each(para.targets, function(idx, target){
        $(target).each(function(){
          
          var tgt    = $(this),
              t      = tgt.css("background-position"),
              tt     = t.split(" "),
              top    = tt[1],
              left   = tt[0],
              zindex = parseInt(tgt.css("z-index")),
              mod    = para._calculate_modifier(zindex);
          
          para.target_data.push([ top, left, mod, zindex ]);

          tgt.css("background-attachment","fixed");

        });
      });

      //console.log(this.target_data);

      var manualScroll = function(){
        para._move_all($(this));
      };

      
      // both the throttled manualScroll and the (debounced) smartresize do similarly limited actions
      // manualScroll only fires every 50ms, while resizeBg fires after 100ms has passed
      // this is to ensure that the browser doesn't go nuts triggering scroll() and resize() events
      // over and over again with very little actual effect on the layout
      $(window).scroll( $.throttle(41, manualScroll) ).resize( $.debounce(100, resizeBg) );      

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

    // iterates through all our targets and moves them by a specific amount,
    // dependent on their respective stored modifiers
    _move_all : function( win ) {

      var para     = this,
          win_top  = win.scrollTop(),
          win_left = win.scrollLeft();

      for (var i=0; i < para.targets.length; i+=1) {
        para._move_by( i, para.targets[i], win_top, win_left );
      }

    },

    // the higher a modifier is, the more pronounced the parallax effect is.
    // the parallax effect is achieved by "slowing down" an element's movement
    // across the screen as the window is scrolled. very distant objects 
    // (with the greatest amount of parallax) will take a very long time to disappear,
    // while the closest object (with the lowest parallax modifier of "1") 
    // will be scrolled off-screen as normal.
    _move_by : function( idx, el, win_top, win_left, css_attrib ) {

      var orig_top  = this.target_data[idx][0],
          orig_left = this.target_data[idx][1],
          mod       = this.target_data[idx][2],
          z         = this.target_data[idx][3],
          max_z     = this.highest_z ? this.highest_z : this.max_z;
      
      if (this.orientation=='horizontal') {

        el.css("background-position", (parseInt(orig_left) - (win_left * (mod/max_z))) + "px " + orig_top );

      } else if (this.orientation=='vertical') {

        var new_top = parseInt(orig_top) - (win_top * (z/max_z));
        el.css("background-position", orig_left + " " + new_top + "px");

      }
      
    },

    //
    // we can call this externally in order to programatically scroll the page
    // to a particular item.
    //
    scroll_to : function( target, add_hash ){
      
      var para     = this;

      if (target!==undefined) {
        para.scroll_target = target;
      }      

      if (!para.is_valid_target( para.scroll_target )) {
        return false;
      }

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

    resize : function( new_h ) {
      
      this.options.force_height = new_h;
      this.element.height( new_h );
      this._resize_bg();

    },

    _resize_bg : function() {

      var para = this;
            
      if (!para.options.force_width) {
        para.max_width  = $('body').width() > $(window).width() ? $('body').width() : $(window).width();  
      } else {
        para.max_width = para.options.force_width;
      }

      if (!para.options.force_height) {
        para.max_height = $('body').height() > $(window).height() ? $('body').height() : $(window).height();  
      } else {
        para.max_height = para.options.force_height;
      }

      $.each(para.targets, function(idx, target){
        $(this).width( para.max_width ).height( para.max_height );
      });
        
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
          console.log( "cannot call methods on Parallax prior to initialization; " +
            "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          console.log( "no such method '" + options + "' for Parallax instance" );
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