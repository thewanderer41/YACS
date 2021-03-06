// Generated by CoffeeScript 1.3.3
(function() {
  var NullStorage, Selection, Storage, Validator;

  Storage = (function() {

    function Storage(options) {
      options = $.extend({}, options);
      this.store = options.store || window.localStorage || window.sessionStorage;
      this.serialize = options.serialize || JSON.stringify;
      this.deserialize = options.deserialize || $.parseJSON;
      this.version = options.version || 5;
    }

    Storage.prototype.set = function(key, value) {
      return this.store.setItem(key, this.serialize(value));
    };

    Storage.prototype.get = function(key) {
      return this.deserialize(this.store.getItem(key));
    };

    Storage.prototype.clear = function() {
      return this.store.clear();
    };

    Storage.prototype.version_check = function() {
      if (this.get('version') !== this.version) {
        Logger.warn(format('Invalid version (got {{ 0 }}; expected {{ 1 }})', this.get('version'), this.version));
        this.clear();
        this.set('version', this.version);
      }
      return this;
    };

    return Storage;

  })();

  NullStorage = (function() {

    function NullStorage() {}

    NullStorage.prototype.set = function(key, value) {};

    NullStorage.prototype.get = function(key) {};

    NullStorage.prototype.clear = function() {};

    NullStorage.prototype.version_check = function() {};

    return NullStorage;

  })();

  Selection = (function() {

    function Selection(options) {
      options = $.extend({
        version: $('meta[name=storage-version]').attr('content') || void 0
      }, options);
      this.storage = options.storage || new Storage();
      this.storage.version_check();
      this.data = options.data || {};
      this.read_only = options.read_only || false;
      this.conflicts = options.conflicts;
      this.history = [];
    }

    Selection.prototype.copy = function() {
      return new Selection({
        storage: new NullStorage(),
        data: $.extend(true, {}, this.data),
        conflicts: this.conflicts
      });
    };

    Selection.prototype.fetch_conflicts = function() {
      var that;
      that = this;
      api.conflicts(function(data) {
        return that.conflicts = data;
      });
      return that;
    };

    Selection.prototype.load = function(data) {
      this.data = data || this.storage.get('selection');
      if (this.data == null) {
        this.data = {};
      }
      $(this).trigger('loaded', {
        sender: this,
        data: this.data
      });
      return this;
    };

    Selection.prototype.save = function() {
      if (this.read_only) {
        return this;
      }
      this.storage.set('selection', this.data);
      $(this).trigger('saved', {
        sender: this,
        data: this.data
      });
      return this;
    };

    Selection.prototype.undo = function() {
      if (this.history.length) {
        return this.history.pop()();
      }
    };

    Selection.prototype.add_section = function(course_id, section_id) {
      var that, _base, _ref;
      if ((_ref = (_base = this.data)[course_id]) == null) {
        _base[course_id] = [];
      }
      pushUnique(this.data[course_id], section_id);
      that = this;
      this.history.push(function() {
        return that.remove_section(course_id, section_id);
      });
      return this.save();
    };

    Selection.prototype.add_course = function(course_id, section_ids) {
      var sid, that, _base, _i, _len, _ref;
      if ((_ref = (_base = this.data)[course_id]) == null) {
        _base[course_id] = [];
      }
      for (_i = 0, _len = section_ids.length; _i < _len; _i++) {
        sid = section_ids[_i];
        pushUnique(this.data[course_id], sid);
      }
      that = this;
      this.history.push(function() {
        return that.remove_section(course_id, section_ids);
      });
      return this.save();
    };

    Selection.prototype.remove_section = function(course_id, section_id) {
      if (this.data[course_id] != null) {
        this.data[course_id] = _.without(this.data[course_id], section_id);
      }
      if (this.data[course_id].length === 0) {
        delete this.data[course_id];
      }
      return this.save();
    };

    Selection.prototype.remove_course = function(course_id, section_ids) {
      delete this.data[course_id];
      return this.save();
    };

    Selection.prototype.clear = function() {
      this.data = {};
      return this.save();
    };

    Selection.prototype.has_courses = function() {
      return this.get_sections().length !== 0;
    };

    Selection.prototype.get_sections = function() {
      var cid, sections, sid, _i, _j, _len, _len1, _ref, _ref1;
      sections = [];
      _ref = Object.keys(this.data);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cid = _ref[_i];
        _ref1 = this.data[cid];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          sid = _ref1[_j];
          sections.push(sid);
        }
      }
      return _.uniq(sections);
    };

    Selection.prototype.get_courses = function() {
      var cid, courses, _i, _len, _ref;
      courses = [];
      _ref = Object.keys(this.data);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cid = _ref[_i];
        courses.push(parseInt(cid, 10));
      }
      return courses;
    };

    Selection.prototype.get = function(course_id) {
      return this.data[course_id];
    };

    return Selection;

  })();

  Validator = (function() {

    function Validator(options) {
      options = $.extend({}, options);
      this.data = options.data || {};
      this.sections = null;
      this.conflicts = null;
    }

    Validator.prototype.set_data = function(data) {
      this.data = data || {};
      return this;
    };

    Validator.prototype.is_ready = function() {
      return (this.data != null) && (this.conflicts != null);
    };

    Validator.prototype.set_conflicts = function(conflicts) {
      this.conflicts = conflicts;
      return this;
    };

    Validator.prototype.set_sections = function(sections) {
      this.sections = hash_by_attr(sections.to_array(), 'id', {
        value: function(o) {
          return o.get('section_times');
        },
        flat: true
      });
      return this;
    };

    Validator.prototype.conflicts_with = function(section_id) {
      var conflicting_sections, course_id, is_conflicted, sid, _i, _j, _len, _len1, _ref, _ref1;
      assert(this.conflicts != null, 'conflicts is not assigned');
      conflicting_sections = this.conflicts.get(section_id);
      if (!(conflicting_sections != null)) {
        return null;
      }
      conflicting_sections = conflicting_sections.get('conflicts');
      _ref = Object.keys(this.data);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        course_id = _ref[_i];
        course_id = parseInt(course_id, 10);
        is_conflicted = false;
        _ref1 = this.data[course_id];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          sid = _ref1[_j];
          if (_.include(conflicting_sections, sid)) {
            is_conflicted = true;
            break;
          }
        }
        if (is_conflicted) {
          return course_id;
        }
      }
      return null;
    };

    Validator.prototype._time_conflict = function(time1, time2) {
      var dow, dow1, dow2, dow_equal, end1, end2, result, start1, start2, time_to_int, _i, _len;
      time_to_int = function(s) {
        return Time.parse_military(s).toInt();
      };
      start1 = time_to_int(time1.start);
      end1 = time_to_int(time1.end);
      start2 = time_to_int(time2.start);
      end2 = time_to_int(time2.end);
      dow1 = time1.days_of_the_week;
      dow2 = time2.days_of_the_week;
      dow_equal = false;
      for (_i = 0, _len = dow1.length; _i < _len; _i++) {
        dow = dow1[_i];
        if (dow2.indexOf(dow) >= 0) {
          dow_equal = true;
          break;
        }
      }
      result = dow_equal && ((start1 <= start2 && start2 <= end1) || (start2 <= start1 && start1 <= end2) || (start1 <= end2 && end2 <= end1) || (start2 <= end1 && end1 <= end2));
      return result;
    };

    Validator.prototype._section_times_conflict = function(times1, times2) {
      var time1, time2, _i, _j, _len, _len1;
      for (_i = 0, _len = times1.length; _i < _len; _i++) {
        time1 = times1[_i];
        for (_j = 0, _len1 = times2.length; _j < _len1; _j++) {
          time2 = times2[_j];
          if (this._time_conflict(time1, time2)) {
            return true;
          }
        }
      }
      return false;
    };

    Validator.prototype._schedule_is_valid = function(schedule) {
      var k, key1, key2, keys, section_times, times1, times2, _i, _j, _len, _len1;
      keys = Object.keys(schedule);
      section_times = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          k = keys[_i];
          _results.push(schedule[k]);
        }
        return _results;
      })();
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key1 = keys[_i];
        times1 = schedule[key1];
        for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
          key2 = keys[_j];
          if (key1 === key2) {
            continue;
          }
          times2 = schedule[key2];
          if (this._section_times_conflict(times1, times2)) {
            return false;
          }
        }
      }
      return true;
    };

    Validator.prototype.is_valid = function() {
      var course_id, keys, schedule, schedules, sections, that, _i, _j, _len, _len1;
      that = this;
      keys = Object.keys(this.data);
      sections = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        course_id = keys[_i];
        sections.push(_.map(this.data[course_id], function(cid) {
          return that.sections[cid];
        }));
      }
      schedules = product.apply(null, sections);
      for (_j = 0, _len1 = schedules.length; _j < _len1; _j++) {
        schedule = schedules[_j];
        if (this._schedule_is_valid(schedule)) {
          return schedule;
        }
      }
      return false;
    };

    return Validator;

  })();

  window.Validator = Validator;

  window.NullStorage = NullStorage;

  window.Storage = Storage;

  window.Selection = Selection;

}).call(this);
