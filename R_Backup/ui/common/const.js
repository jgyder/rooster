// Sync to apps/common/const.js and web/common/constants.js
define({
  TYPE_ERR:   0,
  TYPE_TEXT:  1,
  TYPE_HTML:  2,
  TYPE_JSON:  3,
  TYPE_XML:   4,
  TYPE_FEED:  5,

  TYPE_RULE:        1,
  TYPE_RULE_GROUP:  2,

  OP_AND:   1,
  OP_OR:    2,

  CONTENT_TYPE_TEXT:          1,
  CONTENT_TYPE_CHANGED_TEXT:  2,

  RULE_NOT_EMPTY:       1,
  RULE_HAS_TEXT:        2,
  RULE_HAS_TEXT_NOT:    3,
  RULE_HAS_NUMBER_LT:   4,
  RULE_HAS_NUMBER_GT:   5,
  RULE_HAS_NUMBER_DECR_MIN:  6,
  RULE_HAS_NUMBER_INCR_MIN:  7,

  STATE_NEW: 10,
  STATE_INIT: 20,
  STATE_READY: 40,
  STATE_DISCARD: 90,
  STATE_DONE: 100,

  STATE_ATTR_VERIFY: 10,

  ACTION_EMAIL:       1,
  ACTION_SMS:         2,
  ACTION_PUSH:        3,
  ACTION_MACRO:       4,

  ACTION_LOCAL_AUDIO: 101,
  ACTION_LOCAL_POPUP: 102,

  RUN_STATE_INIT: 1,
  RUN_STATE_WAIT: 2,
  RUN_STATE_WIP: 3,

  TIME_INFINITE: 2592000  // Roughly 30 days
});
