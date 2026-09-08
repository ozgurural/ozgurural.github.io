/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

/* The site is dark only. head/custom.html sets data-theme="dark" on the root
   element before first paint, which is what actually decides the theme; this
   is only the belt to that braces, re-asserting it once jQuery is up in case
   anything cleared the attribute.

   What used to live here was the upstream theme machinery: a three-state
   setting in localStorage, a computed-theme resolver falling back to the OS
   preference, an OS-preference change listener, and a toggle. All of it was
   already inert (setTheme had been rewritten to ignore its argument and force
   dark) but it still ran: two localStorage reads and a matchMedia listener on
   every page load, for a value nothing consumed. Its last real consumer was
   plotly-blocks.js, which asked determineComputedTheme() which chart palette
   to use and could get back "light" on a dark-only site; that file now carries
   its own dark palette and asks nothing. The selectors the old code touched
   (#theme-icon, #theme-toggle) have matched nothing since the toggle came out
   of the masthead. */
let setTheme = () => {
  $("html").attr("data-theme", "dark");
};

/* Plotly rendering for ```plotly markdown blocks lives in
   /assets/js/plotly-blocks.js, included by scripts.html ONLY on pages that
   actually contain such a block. Bundling Plotly here cost 4.5 MB on every
   page — and the ES `import` it used broke this entire bundle as a classic
   script. Keep this file import/export-free. */

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const scssLarge = 925;          // pixels, from /_sass/_themes.scss
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)

  setTheme();



  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("padding-bottom", "0");
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

  // Init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({
    offset: -scssMastheadHeight,
    preventDefault: false,
  });

  // 1. Copy to Clipboard Button for Code Blocks
  $('div.highlighter-rouge').each(function() {
    var $codeBlock = $(this);
    var $button = $('<button class="ep-copy-btn" aria-label="Copy code" title="Copy code"><i class="fas fa-copy"></i></button>');
    
    $button.on('click', function() {
      var codeText = $codeBlock.find('code').text();
      navigator.clipboard.writeText(codeText).then(function() {
        $button.html('<i class="fas fa-check"></i>');
        $button.addClass('copied');
        setTimeout(function() {
          $button.html('<i class="fas fa-copy"></i>');
          $button.removeClass('copied');
        }, 2000);
      });
    });
    
    $codeBlock.prepend($button);
  });

  // 2. Reading Progress Bar
  if ($('.page__content').length > 0) {
    var $progressBar = $('<div class="ep-progress-bar"></div>');
    $('body').prepend($progressBar);
    
    $(window).on('scroll', function() {
      var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var scrolled = (winScroll / height) * 100;
      $progressBar.css('width', scrolled + '%');
    });
  }

  // 3. Smooth Scroll Animations (Fade-in-up)
  if ('IntersectionObserver' in window) {
    var observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    var fadeObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ep-fade-in-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    $('.lab-card, .ep-stats > li, .archive__item').each(function() {
      $(this).addClass('ep-fade-in');
      fadeObserver.observe(this);
    });
  }

  // 5. Back to Top Button
  var $backToTop = $('<button class="ep-back-to-top" aria-label="Back to top" title="Back to top"><i class="fas fa-arrow-up"></i></button>');
  $('body').append($backToTop);
  
  $(window).on('scroll', function() {
    if ($(this).scrollTop() > 600) {
      $backToTop.addClass('visible');
    } else {
      $backToTop.removeClass('visible');
    }
  });
  
  $backToTop.on('click', function() {
    $('html, body').animate({scrollTop: 0}, 400);
    return false;
  });
  // 6. Medium-Style Lightbox for Images
  $('.page__content img').not('a img').on('click', function(e) {
    var $img = $(this);
    if ($img.width() < 100 || $img.hasClass('no-lightbox')) return;
    
    e.stopPropagation();
    
    var $overlay = $('<div class="ep-lightbox-overlay"></div>');
    var $clone = $img.clone().addClass('ep-lightbox-img');
    
    $overlay.append($clone);
    $('body').append($overlay);
    
    $overlay[0].offsetHeight; // Trigger reflow
    $overlay.addClass('active');
    
    var closeLightbox = function() {
      $overlay.removeClass('active');
      setTimeout(function() {
        $overlay.remove();
      }, 300);
    };
    
    $overlay.on('click', closeLightbox);
    
    $(document).on('keydown.lightbox', function(e) {
      if (e.key === 'Escape') {
        closeLightbox();
        $(document).off('keydown.lightbox');
      }
    });
  });

});
