
$(function(){
	
  // var slides 	     = $(".main_slide"), 
  // 	slides_list    = $(".main_slides"),
  // 	parallax_cont  = $("body"),
  //   resizePage     = function() {

  //     var slides_c  = $(".main_slides"), 
  //         slides    = $(".main_slide"),
  //         nav       = $("#sidebar"), 
  //         win_w     = $(window).width(), 
  //         slides_w  = slides_c.outerWidth(), 
  //         nav_w     = nav.outerWidth(),
  //         header    = $("#header"),
  //         footer    = $("#footer");

  //     // reposition slides and nav
  //     if (win_w > slides_w + nav_w) {
  //       var left = (win_w - (slides_w+nav_w+50))/2;
  //       slides_c.css("left", left);
  //       footer.css("left", left);
  //       nav.css("left", left + slides_w + 30);
  //     } else {
  //       slides_c.css("left", "0px");
  //       nav.css("left", slides_w + 30);
  //     }

  //     // resize individual slides
  //     var new_slide_h     = $(window).height() - (slides.outerHeight() - slides.height()),
  //         new_body_height = ($(window).height()*slides.length) + slides_c.offset().top + parseInt(slides_c.css('margin-bottom')) + footer.outerHeight();

  //     slides.height( new_slide_h );
      
  //     parallax_cont.parallax( "resize", new_body_height );


  //   };
  

  $("body").parallax({ 
    targets    : ".parallax_target", 
    highest_z  : 99, 
    lowest_z   : 1, 
    force_height : 3500 
  });

  // resizePage();

  // $(window).resize( $.debounce( 100, resizePage) );


});
