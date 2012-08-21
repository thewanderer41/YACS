// Generated by CoffeeScript 1.3.3
(function() {
  var attached_live;

  attached_live = false;

  window.summarize = function(elements, options) {
    var handler;
    options = $.extend({
      summary_length: 150,
      more_text: 'more'
    }, options);
    $(elements).each(function() {
      var $el, text;
      $el = $(this);
      text = $.trim($el.text());
      $el.data('full-text', text);
      if (text.length > options.summary_length) {
        text = text.slice(0, options.summary_length) + '... ';
        $el.text(text);
        return $el.append(format('(<a href="#read-more" class="read-more">{{ text }}</a>)', {
          text: options.more_text
        }));
      }
    });
    if (!attached_live) {
      handler = function() {
        var parent, text;
        parent = $(this).parent();
        text = parent.data('full-text');
        parent.text(text);
        return false;
      };
      $(elements).data('summarize-click-handler', handler);
      $('.read-more').live('click', handler);
      return attached_live = true;
    }
  };

}).call(this);
