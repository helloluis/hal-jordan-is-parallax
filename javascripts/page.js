

$(function(){
	
	var slides = $(".main_slide");

  slides.
  	each(function(idx, elem){
  		$(this).css("top", $(this).outerHeight()*idx );
  	});

  $(".main_slides").height( slides.height()*slides.length );

  var main = $("#main").parallax({
    targets : ".parallax_target"
  });

  $(".bttn").click(function(){
    main.parallax("scroll_to", $(this).attr("data-target"), true);
    return false;
  });

});