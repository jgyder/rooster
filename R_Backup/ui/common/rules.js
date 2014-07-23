define(['./const'], function(C) {

var

DescList = [{
  type: C.RULE_NOT_EMPTY,
  label: 'l_not_empty',
  params: []
},
{
  type: C.RULE_HAS_TEXT,
  label: 'l_has',
  params: [{
    label: 'l_text',
    must: true,
    name: 'input',
    type: 'text'
  }]
},
{
  type: C.RULE_HAS_TEXT_NOT,
  label: 'l_has_not',
  params: [{
    label: 'l_text',
    must: true,
    name: 'input',
    type: 'text'
  }]
},
{
  type: C.RULE_HAS_NUMBER_LT,
  label: 'l_has_num_lt',
  params: [{
    label: 'l_num',
    must: true,
    name: 'input',
    type: 'number'
  }]
},
{
  type: C.RULE_HAS_NUMBER_GT,
  label: 'l_has_num_gt',
  params: [{
    label: 'l_num',
    must: true,
    name: 'input',
    type: 'number'
  }]
},
{
  type: C.RULE_HAS_NUMBER_DECR_MIN,
  label: 'l_has_num_decr_min',
  params: [{
    label: 'l_num',
    must: true,
    name: 'input',
    type: 'number'
  }]
},
{
  type: C.RULE_HAS_NUMBER_INCR_MIN,
  label: 'l_has_num_incr_min',
  params: [{
    label: 'l_num',
    must: true,
    name: 'input',
    type: 'number'
  }]
}],

ContentList = [{
  type: C.CONTENT_TYPE_TEXT,
  label: 'l_text'
}, {
  type: C.CONTENT_TYPE_CHANGED_TEXT,
  label: 'l_changed_text'
}];

return {
  ContentList: ContentList,
  DescList: DescList,

  CONTENT_TYPE_TEXT: C.CONTENT_TYPE_TEXT,
  CONTENT_TYPE_CHANGED_TEXT: C.CONTENT_TYPE_CHANGED_TEXT,
  TYPE_RULE: C.TYPE_RULE,
  TYPE_RULE_GROUP: C.TYPE_RULE_GROUP,
  OP_AND: C.OP_AND,
  OP_OR: C.OP_OR,

  RULE_NOT_EMPTY: C.RULE_NOT_EMPTY,
  RULE_HAS_TEXT: C.RULE_HAS_TEXT,
  RULE_HAS_TEXT_NOT: C.RULE_HAS_TEXT_NOT,
  RULE_HAS_NUMBER_LT: C.RULE_HAS_NUMBER_LT,
  RULE_HAS_NUMBER_GT: C.RULE_HAS_NUMBER_GT,
  RULE_HAS_NUMBER_DECR_MIN: C.RULE_HAS_NUMBER_DECR_MIN,
  RULE_HAS_NUMBER_INCR_MIN: C.RULE_HAS_NUMBER_INCR_MIN
}

});
