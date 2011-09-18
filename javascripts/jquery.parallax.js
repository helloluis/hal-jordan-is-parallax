/*

  jQuery Parallax v0.1.20110903
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
    increment       : 1,
    canvas_area     : [1024, 768],
    targets         : []
  };
  
  $.Parallax.prototype = {

    _init : function() {
      
    },
    
    _create : function( options ) {
      
      this.options     = $.extend( true, {}, $.Parallax.settings, options );
      
      if (this.options.targets.length===0) {
        this.targets   = this.element.children();
      } else {
        this.targets   = this.options.targets;  
      }
 
      // store the current scrollTop or scrollLeft, depending on which orientation the user chose
      this.scrollTop   = 0;
      this.scrollLeft  = 0;

      // store the current direction the user is scrolling. if downwards, then downwards=true
      this.downwards   = null;
      this.rightwards  = null;

      this.increment   = $("body").height() / this.element.height()
      
      this.max_width   = 0;
      this.max_height  = 0;

      var para         = this, 
        targets        = this.targets,
        orientation    = this.options.orientation,
        increment      = this.options.increment,
        canvas         = this.options.canvas_area;
      
      // figure out max width and height of body
      $("body > *").each(function(idx, el){
        if ($(el).css("position")=="absolute") {
          var x = parseInt($(el).css("left"))+parseInt($(el).width()),
              y = parseInt($(el).css("top"))+parseInt($(el).height());
          if (x > para.max_width)  { para.max_width = x;  }
          if (y > para.max_height) { para.max_height = y; }
        }
      });


      // figure out highest z-index
      para.max_z = 0;
      $.each(para.targets, function(idx, target){
        if ($(target).css("z-index") >= para.max_z) {
          para.max_z = $(target).css("z-index");
        }
      });

      console.log(para.max_z);

      // record each target's respective coordinates and add a parallax modifier which 
      // we'll use to figure out how to position it
      $.each(para.targets, function(idx, target){
        console.log( target );
        $(target).each(function(){
          $(this).data({
            "parallax-orig-top"  : $(this).position().top,
            "parallax-orig-left" : $(this).position().left,
            "parallax-modifier"  : para.calculate_modifier(parseInt($(this).css("z-index")))
          });
          console.log( $(this).data("parallax-modifier") );
        });
      });

      console.log("w&h", this.max_width, this.max_height);

      $(window).scroll(function(){
        if (orientation=='horizontal') {
          newScrollLeft = $(this).scrollLeft();
          para.rightwards = (newScrollLeft > para.scrollLeft);
          para.scrollLeft = newScrollLeft;
          //para.element.css({left : (para.rightwards===true ? "-" : "") + newScrollLeft + "px"});
          console.log( para.scrollLeft, para.rightwards );

        } else if (orientation=='vertical') {
          newScrollTop = $(this).scrollTop();
          para.downwards = (newScrollTop > para.scrollTop);
          para.scrollTop = newScrollTop;
          //para.element.css({top : (para.downwards===true ? "" : "-") + newScrollTop + "px"});

          console.log( para.scrollTop, para.downwards );

        }
        
        para.scroll_with_parallax();

      });
      
    },

    calculate_modifier : function( zindex ) {
      
      return (zindex/this.max_z > 0.1 ? zindex/this.max_z : 0.1);

    },

    scroll_with_parallax : function() {
      
      var para = this;

      para.move_by(this.element);

      $.each(this.targets, function(idx, el){
        para.move_by( $(el) );
      });

    },

    move_by : function(el) {

      if (this.options.orientation=='horizontal') {

        var left = el.data("parallax-orig-left") * el.data("parallax-modifier"), 
            dir  = (this.rightwards===true ? "" : "-");

        el.css({ left : dir + "=" + left + "px" });

      } else if (this.options.orientation=='vertical') {

        var top = el.data("parallax-orig-top") * el.data("parallax-modifier"), 
            dir = (this.downwards===true ? "" : "-");

        el.css({ top : dir + "=" + top + "px" }); 

      }
      
    },

    _destroy : function() {
      

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