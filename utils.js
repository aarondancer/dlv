var falsey = [, null, undefined, false, 0, NaN, ''];

module.exports = {
  empties: [[], {}].concat(falsey.slice(1)),
  noop: function() {},
  numberProto: Number.prototype,
  symbol: Symbol ? Symbol('a') : undefined,
};
