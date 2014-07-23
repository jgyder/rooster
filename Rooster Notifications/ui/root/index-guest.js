require([
'module',
'jquery',
'backbone', 
'async', 
'common/core',
'common/msg',
'root/views/invite',
'root/views/register',
'bootstrap'
],

function(module, $, Backbone, async, Core, Msg, Invite, Register) {

$('.xinvite').each(function() { new Invite({ el: this }); });

//new Register({ el: $('#register')[0] }).render();
$('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') 
        || location.hostname == this.hostname) {

        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
           if (target.length) {
             $('html,body').animate({
                 scrollTop: target.offset().top
            }, 1000);
            return false;
        }
    }
});

});

