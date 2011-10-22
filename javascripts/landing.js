
$(function(){
	
  $.Debug = $("#debug");

  $("body").parallax({ 
    targets    : ".parallax_target", 
    highest_z  : 99, 
    lowest_z   : 1, 
    force_height : 3500 
  });

  $.Debug.text("ipad? "+ $.iPad);

});
