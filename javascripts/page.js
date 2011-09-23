function SpaceScroller () {
  
  this.scrolling   = false;
 
  this.initialize  = function(nav, targets) {
 
    this.nav       = $(nav);
    this.targets   = $(targets);
    this.scroller  = ($.browser.mozilla || $.browser.msie) ? $('html') : $('body');
    this.handle    = $("#scrollbar-handle");
    this.track     = $("#scrollbar-track");
    this.hotspots  = [];
    this.anchors   = $("a", nav);
    this.target_h  = this.calculate_targetable_height();
    this.track_h   = this.track.height();
    this.track_t   = this.track.position().top;
    this.handle_h  = this.handle.height();
    this.win_h     = $(window).height();
    this.body_h    = $('body').height();
    this.current   = 0;
    this.automated = false;

    var scr = this;
    
    scr.calculate_hotspots();

    var track_scrolling = function(){
      if (scr.automated===false) {
        var win = $(this),
          win_s = win.scrollTop();
      
        var adjusted  = ((win_s * (scr.track_h/scr.target_h)) - scr.handle_h) + scr.track_t;
        if (adjusted < 0) { 
          adjusted = 0; 
        } else if (adjusted > scr.track_h) {
          adjusted = scr.track_h;
        }

        scr.handle.css({ top : adjusted });

        var i = scr.is_on_hotspot( adjusted );

        if ( i!==false ) {
          scr.anchors.removeClass("selected");
          $(scr.anchors.get(i)).addClass("selected");
        } else {
          scr.anchors.removeClass("selected");
        }
      }
    };

    $(window).scroll( $.throttle(200, track_scrolling) );

  };

  this.scroll_to = function( elem ) {
    
    var scr     = this,
        elem    = $("#"+(elem.replace("#",""))),
        elem_id = elem.attr("id"),
        anchor  = $("a[data-target='" + elem_id + "']", this.nav);
    
    scr.automated = true;

    $(this.scroller).animate({ scrollTop : elem.offset().top - 50 },500,'easeInOutExpo',function(){
      document.location.hash = "/" + elem_id;
      scr.anchors.removeClass("selected");
      anchor.addClass("selected");
      scr.move_to( anchor );
    });

  };

  this.is_on_hotspot = function( pos ) {
    
    var scr = this;
    pos = (pos + scr.handle_h) - scr.track_t;
    
    for (var i=0; i<this.hotspots.length; i++) {
      if (pos >= (this.hotspots[i].at - scr.handle_h) && pos <= this.hotspots[i].at + this.hotspots[i].ah) {
        return i;
        break;
      }
    }

    return false;

  };

  this.move_to = function( a ) {
    
    var scr = this,    
          t = a.position().top - scr.handle_h + scr.track_t;

    if (t < 0) { t = 0; }
    //console.log(t);
    scr.handle.animate({ top : t }, 200, function(){
      scr.automated = false;
    });

  };

  this.calculate_hotspots = function() {
    
    var scr = this;

    scr.anchors.each(function(idx){

      var tt = $(scr.targets.get(idx)).offset().top;
      if (tt > Math.abs(scr.body_h - scr.win_h)) {
        tt  = scr.win_h;
      }

      var a = $(this),
         t  = a.attr("data-target"),
         at = a.position().top, 
         ah = a.height(),
         tt = tt > 0 ? tt : 0,
         th = $(scr.targets.get(idx)).height();

      scr.hotspots.push({ t : t, at : at, ah : ah, tt : tt, th : th });

    });

  };

  this.calculate_targetable_height = function() {
    
    var slide = $(".main_slide", this.target), 
      targetable_h = (slide.outerHeight()+parseInt(slide.css('margin-bottom'))) * slide.length - ($(window).height());
    return targetable_h;

  };
};


function AnimatedScroller() {

  this.target_class = ".animated_scroll_target";
  this.targets = [];
  this.current_scroll_t = 0;
  this.scrolling = false;
  this.scrolling_downwards = false;

  this.initialize = function(){
    
    var as = this;

    this.targets = $.map( $(this.target_class), function(el, idx){
      var elem = $(el);
      return [ [ 
          elem, 
          elem.attr("data-type"),
          elem.attr("data-current") ? parseInt(elem.attr("data-current")) : 0,
          elem.attr("data-min") ? parseInt(elem.attr("data-min")) : 0,
          elem.attr("data-max") ? parseInt(elem.attr("data-max")) : 100,
          elem.attr("data-step") ? parseInt(elem.attr("data-step")) : 1
        ] ];
    });

    console.log(this.targets);

    $(this.target_class).each(function(idx, el){

      $(el).bind('inview', function(e, isInView, visiblePartX, visiblePartY) { 
        if (isInView) {
          if ($(this).attr("data-type")=='number') {
            $(this).everyTime(50,'animation',function(){
              as.animate_numbers( idx );
            });

          } else if ($(this).attr("data-type")=='graphic') {
            as.animate_graphics( idx );

          } else if ($(this).attr("data-type")=='line_graph') {
            as.animate_line_graph();

          }

        } else {

          if ($(this).attr("data-type")=='number') {
            as.reset_numbers( idx );
            $(this).stopTime('animation');

          } else if ($(this).attr("data-type")=='graphic') {
            as.reset_graphics( idx );

          } else if ($(this).attr("data-type")=='line_graph') {
            as.reset_line_graph( idx );
          }

        }
      });

    });

    this.initialize_line_graph();

  };

  this.animate_numbers = function( idx ) {
    
    var el      = this.targets[idx][0],
        current = this.targets[idx][2],
        min     = this.targets[idx][3],
        max     = this.targets[idx][4],
        step    = this.targets[idx][5],
        new_num = (step+current<max ? (step+current) : max);
    
    el.text( new_num );

    this.targets[idx][2] = new_num;
    
  };

  this.reset_numbers = function( idx ) {
    
    this.targets[idx][2] = 0;

  };

  this.animate_graphics = function( idx ) {
    
    var el      = this.targets[idx][0];

  };

  this.reset_graphics = function( idx ) {
    
  };

  this.initialize_line_graph = function( ) {
    
    var as   = this,
        cont = $("#line_graph").svg();
    
    as.line_graph_points = [];
    as.line_graph_lines = [];
    as.line_graph = cont;
    as.line_graph_svg = cont.svg('get');

    for (var i=0; i<5; i++) {
      var ln = as.line_graph_svg.line(145*i, cont.height(), 145*(i+1), cont.height(), { stroke : "#f90", strokeWidth : 2 }); 
      as.line_graph_lines.push( ln );
    }

    for (var i=0; i<5; i++) {
      var c = as.line_graph_svg.circle(145*(i+1), cont.height(), 3, { fill : "#fff", stroke : "#000", strokeWidth : 2});
      as.line_graph_points.push( c );
    }

  };

  this.animate_line_graph = function( ) {
    var as  = this,
        l_h = as.line_graph.height(),
        rands = [];

    for (var i=0; i<5; i++) {
      rands.push( l_h - (2 + Math.floor((i*(l_h/5))+(Math.random()*(l_h/5)))) );
    }

    for (var i=0; i<5; i++) {
      var speed = 500+(i*100);
      $(as.line_graph_points[i]).animate({ svgCy : rands[i] }, speed);
      $(as.line_graph_lines[i]).animate({ svgY1 : (i > 0 ? rands[i-1] : l_h), svgY2 : rands[i] }, speed);
    }
  };

  this.reset_line_graph = function( ) {

    var as  = this,
        l_h = as.line_graph.height();

    for (var i=0; i<5; i++) {
      $(as.line_graph_points[i]).animate({ svgCy : l_h }, 100);
      $(as.line_graph_lines[i]).animate({ svgY1 : l_h, svgY2 : l_h }, 100);
    }

  };
    
};



$(function(){
	
  var slides 	     = $(".main_slide"), 
  	slides_list    = $(".main_slides"),
  	parallax_cont  = $("body"),
  	anchors        = $(".bttn"),
    scroller       = new SpaceScroller,
    ani_scroller   = new AnimatedScroller;
  
  parallax_cont.parallax({ 
    targets    : ".parallax_target", 
    highest_z  : 99, 
    lowest_z   : 1, 
    force_height : 3500 
  });

  scroller.initialize("#nav", ".main_slide");
  
  ani_scroller.initialize();

  anchors.click(function(){
    scroller.scroll_to( $(this).attr("href").replace(/[\/]+/gi,"") );
    return false;
  });

  if (document.location.hash.length>1) {
    $(".bttn_" + document.location.hash.replace(/[\/\#]+/gi,"")).click();
  }

  var positionSlidesAndNav = function() {

    var slides    = $(".main_slides"), 
         nav      = $("#sidebar"), 
         win_w    = $(window).width(), 
         slides_w = slides.outerWidth(), 
         nav_w    = nav.outerWidth(),
         footer   = $("#footer");

    if (win_w > slides_w + nav_w) {
      var left = (win_w - (slides_w+nav_w+50))/2;
      slides.css("left", left);
      footer.css("left", left);
      nav.css("left", left + slides_w + 50);
    } else {
      slides.css("left", "0px");
      nav.css("left", slides_w + 50);
    }

  }

  //asteroid_field.initialize( $("#asteroids") );

  positionSlidesAndNav();

  if ($.browser.firefox) {
    $(window).resize( positionSlidesAndNav );
  } else {
    $(window).smartresize( positionSlidesAndNav );
  }
  


});
