// Generated by CoffeeScript 1.3.3
(function() {

  window.liveform = function(form, options) {
    var $form, empty_state, previous;
    options = $.extend({
      changed: function(form) {},
      empty: $.noop,
      listen: function(form, callback) {
        var false_callback, true_callback;
        false_callback = function() {
          callback();
          return false;
        };
        true_callback = function() {
          callback();
          return true;
        };
        $(form).submit(false_callback);
        $(form).find('input, select').change(true_callback);
        $(form).find('input[type=text], input[type=search], textarea').keyup(true_callback);
        return $(form).find('input[type=search]').bind('search', true_callback);
      }
    }, options);
    $form = $(form);
    empty_state = previous = $form.serialize();
    return options.listen($form, function() {
      var querystring;
      querystring = $form.serialize();
      if (empty_state === querystring) {
        options.empty($form);
      } else if (querystring !== previous) {
        options.changed($form);
      }
      return previous = querystring;
    });
  };

  window.form_for_ajax = function(form) {
    var $form;
    $form = $(form);
    return {
      url: $form.attr('action'),
      type: $form.attr('method').toUpperCase(),
      data: $form.serialize(),
      cache: $form.attr('method').toUpperCase() === 'GET'
    };
  };

  window.updateform = function(form, options) {
    var request, trigger;
    options = $.extend({
      data: {},
      start: $.noop,
      ajax_start: $.noop,
      update: $.noop,
      error: $.noop,
      empty: $.noop,
      delay: 200
    }, options);
    request = null;
    trigger = delayfn(options.delay, function() {
      var ajax;
      if (request != null) {
        request.abort();
      }
      ajax = form_for_ajax(form);
      ajax.data += '&' + $.param(options.data);
      request = $.ajax($.extend(ajax, {
        success: function(data) {
          request = null;
          return options.update(data);
        },
        error: function() {
          if (request != null) {
            options.error();
            return request = null;
          }
        }
      }));
      return options.ajax_start();
    });
    return liveform(form, {
      changed: function() {
        options.start();
        return trigger();
      },
      empty: options.empty
    });
  };

}).call(this);
