function Scroller () {
  
  this.scrolling  = false;

  this.initialize = function(nav, targets) {

    this.nav      = $(nav);
    this.targets  = $(targets);
    this.handle   = $("#scrollbar-handle");
    this.track    = $("#scrollbar-track");
    this.hotspots = [];
    this.anchors  = $("a", nav);
    this.target_h = this.calculate_targetable_height();
    this.track_h  = this.track.height();
    this.win_h    = $(window).height();
    this.body_h   = $('body').height();
    this.current  = 0;

    var scr = this;
  
    this.calculate_hotspots();

    console.log(scr.hotspots);

    // var grid_y = Math.round(scr.nav.height()/scr.nav.children().length);
    // scr.handle.draggable({
    //   grid : [0, grid_y ],
    //   axis : 'y',
    //   containment : 'parent',
    //   stop : function() {
    //     var handle_pos = $(this).position().top;
    //     for (var i=0; i < scr.heights.length; i++) {
    //       if (handle_pos >= scr.heights[i][1] && handle_pos <= scr.heights[i][2]) {
    //         scr.heights[i][0].click();
    //       }
    //     }
    //   }
    // });

    var track_scrolling = function(){
      var win   = $(this),
          win_s = win.scrollTop();
      
      var adjusted  = win_s * (scr.track_h/scr.target_h);
      
      // var adjusted = scr.adjust_motion(win_s);

      // console.log( adjusted );
      // console.log( new_t, win_s, scr.target_h, scr.win_h );

      scr.handle.css({ top : adjusted });
    };

    $(window).scroll( $.throttle(150, track_scrolling) );

  };

  this.move_to = function( a ) {
    
    var scr = this;

    if (scr.scrolling===false) {
      // console.log('move_to');
      scr.scrolling = true;
      var t = a.position().top + ( (a.height()-scr.handle.height())/2 );

      scr.anchors.removeClass("selected");
      a.addClass("selected");

      scr.handle.stop(true,true).animate({ top : t }, { 
        duration : 500, 
        complete : function(){
          scr.scrolling = false;
        }
      });
    };

  };

  this.calculate_hotspots = function() {
    
    var scr = this;

    scr.anchors.each(function(idx){

      var tt = $(scr.targets.get(idx)).offset().top;
      if (tt > Math.abs(scr.body_h - scr.win_h)) {
        tt  = scr.win_h;
      }

      var a = $(this),
         at = a.position().top, 
         ah = a.height(),
         tt = tt > 0 ? tt : 0,
         th = $(scr.targets.get(idx)).height();

      scr.hotspots.push({ at : at, ah : ah, tt : tt, th : th });

    });

  };

  // returns an array where the first value is the adjusted position of the handler,
  // and the second is the index of the target it is currently near, if any. if it's not
  // near any targets, it returns null
  this.adjust_motion = function(win_scroll) {
    
    var scr = this,
        hs  = scr.hotspots,
        pos = 0,
        hot = null,
        mov = win_scroll;
        edge = scr.body_h - (scr.win_h/2);

    console.log(mov, edge);

    if (mov <= (hs[0].tt+hs[0].th)) {
      console.log('high');
      pos = hs[0].at;// + (hs[0].ah/2);
      hot = 0;

    } else if (mov > (hs[0].tt+hs[0].th) && (mov < hs[hs.length-1].tt) && mov <= edge ) {
      console.log('mid');
      for (var i=0; i<hs.length; i++) {
        if (mov >= hs[i].tt && mov < (hs[i].tt + hs[i].th)) {
          pos = hs[i].at;
          hot = i;
          break;
        }
      }

    } else if ( mov > edge || (mov >= hs[hs.length-1].tt)) {
      console.log('low');
      pos = hs[hs.length-1].at;
      hot = hs.length-1;

    }

    return [ pos, hot ];

  };

  this.calculate_targetable_height = function() {
    
    var slide = $(".main_slide", this.target),
      targetable_h = $('body').height() - $(window).height();
      //targetable_h = (((slide.outerHeight() + parseInt(slide.css('margin-bottom'))) * (slide.length-1)) + 
      //       (slide.outerHeight() - $(".slideshow").height())) - $(slide.get(0)).offset().top ;
    // console.log(targetable_h);    
    return targetable_h;

  };
}


$(function(){
	
  var slides 	    = $(".main_slide"), 
  	slides_list   = $(".main_slides"),
  	parallax_cont = $("#main"),
  	anchors       = $(".bttn"),
    scroller      = new Scroller;

  slides.each(function(idx){
  	$(this).css("top", $(this).outerHeight()*idx );
  });

  slides_list.height( (slides.outerHeight() + parseInt(slides.css("margin-bottom"))) * slides.length );
  
  // this is manually set
  $("body").height( parallax_cont.outerHeight() + parseInt(parallax_cont.css("margin-bottom")) );

  parallax_cont.parallax({ targets : ".parallax_target", background_position : true });

  anchors.click(function(){
    parallax_cont.parallax("scroll_to", $(this).attr("href").replace(/[\/]+/gi,""), true);
    return false;
  });

  scroller.initialize("#nav", ".main_slide");

  if (document.location.hash.length>1) {
    $(".bttn_" + document.location.hash.replace("#","")).click();
  }

  var positionSlidesAndNav = function() {
    var slides = $(".main_slides"), nav = $("#sidebar"), win_w = $(window).width(), slides_w = slides.outerWidth(), nav_w = nav.outerWidth();
    if (win_w > slides_w + nav_w) {
      var left = (win_w - (slides_w+nav_w+50))/2;
      slides.css("left", left);
      nav.css("left", left + slides_w + 50);
    } else {
      slides.css("left", "0px");
      nav.css("left", slides_w + 50);
    }
  }

  positionSlidesAndNav();

  $(window).smartresize( positionSlidesAndNav );


});
