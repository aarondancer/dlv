var assert = require("assert");
var delve = require(".");

var obj = {
  undef: undefined,
  zero: 0,
  one: 1,
  n: null,
  f: false,
  a: {
    two: 2,
    b: {
      three: 3,
      c: {
        four: 4
      }
    }
  },
  foo: {
    "some property": 8
  },
  arr: [4, 3, [9, { bar: false, deep: [false, true] }, 7]]
};

// assert equality of a given path, as dot notation and array.
//optional third argument is for default when object is not found
function check(path, value, def) {
  var out = delve(obj, path, def);
  assert.strictEqual(
    out,
    value,
    'delve(obj, "' + path + '") should be ' + value + ", got " + out
  );
  console.log(
    ' ✓ delve(obj, "' + path + '"' + (def ? ', "' + def + '"' : "") + ")"
  );

  if (path) {
    var arr = path.replace(/\[("|')?([^\[\]]+)\1\]/g, ".$2").split(".");
    assert.strictEqual(delve(obj, arr, def), value);
    console.log(
      " ✓ delve(obj, " +
        JSON.stringify(arr) +
        (def ? ', "' + def + '"' : "") +
        ")"
    );
    console.log(" ✓ delve(obj, " + JSON.stringify(arr) + ")");
  }
}

console.log("> No Defaults");
check("", undefined);
check("one", obj.one);
check("one.two", undefined);
check("a", obj.a);
check("a.two", obj.a.two);
check("a.b", obj.a.b);
check("a.b.three", obj.a.b.three);
check("a.b.c", obj.a.b.c);
check("a.b.c.four", obj.a.b.c.four);
check("n", obj.n);
check("n.badkey", undefined);
check("f", false);
check("f.badkey", undefined);
check("foo.some property", obj.foo["some property"]);
check('foo["some property"]', obj.foo["some property"]);
check("foo['some property']", obj.foo["some property"]);
check("foo[some property]", obj.foo["some property"]);
check("arr[1]", obj.arr[1]);
check("arr[2][1].bar", obj.arr[2][1].bar);
check("arr[2][1].deep[1]", obj.arr[2][1].deep[1]);

//test defaults
console.log("\n> With Defaults");
check("", "foo", "foo");
check("undef", "foo", "foo");
check("n", null, "foo");
check("n.badkey", "foo", "foo");
check("zero", 0, "foo");
check("a.badkey", "foo", "foo");
check("a.badkey.anotherbadkey", "foo", "foo");
check("f", false, "foo");
check("f.badkey", "foo", "foo");

//check undefined key throws an error
assert.throws(delve.bind(this, obj, undefined));
assert.throws(delve.bind(this, obj, undefined, "foo"));

//check undefined obj doesn't throw errors and uses default
var backupObj = obj;
obj = undefined;
check("one", undefined);
check("one", "foo", "foo");
obj = backupObj;

console.log("✅ Success!");

const failed = [];
// process.exit(0);

function it(description, assertion) {
  try {
    assertion();
    console.log(` ✓ ${description}`);
  } catch (e) {
		failed.push(description);
    console.error(" X " + description + "\n", e);
  }
}

const lodashStable = require("lodash");

const methodName = "dlv";

const func = delve;

const { symbol, noop, numberProto, empties } = require("./utils.js");

it("`" + methodName + "` should get string keyed property values", function() {
  var object = { a: 1 };

  lodashStable.each(["a", ["a"]], function(path) {
    assert.strictEqual(func(object, path), 1);
  });
});

it("`" + methodName + "` should preserve the sign of `0`", function() {
  var object = { "-0": "a", "0": "b" },
    props = [-0, Object(-0), 0, Object(0)];

  var actual = lodashStable.map(props, function(key) {
    return func(object, key);
  });

  assert.deepStrictEqual(actual, ["a", "a", "b", "b"]);
});

it("`" + methodName + "` should get symbol keyed property values", function() {
  if (Symbol) {
    var object = {};
    object[symbol] = 1;

    assert.strictEqual(func(object, symbol), 1);
  }
});

it("`" + methodName + "` should get deep property values", function() {
  var object = { a: { b: 2 } };

  lodashStable.each(["a.b", ["a", "b"]], function(path) {
    assert.strictEqual(func(object, path), 2);
  });
});

it("`" + methodName + "` should get a key over a path", function() {
  var object = { "a.b": 1, a: { b: 2 } };

  lodashStable.each(["a.b", ["a.b"]], function(path) {
    assert.strictEqual(func(object, path), 1);
  });
});

it("`" + methodName + "` should not coerce array paths to strings", function() {
  var object = { "a,b,c": 3, a: { b: { c: 4 } } };
  assert.strictEqual(func(object, ["a", "b", "c"]), 4);
});

it("`" + methodName + "` should not ignore empty brackets", function() {
  var object = { a: { "": 1 } };
  assert.strictEqual(func(object, "a[]"), 1);
});

it("`" + methodName + "` should handle empty paths", function() {
  lodashStable.each([["", ""], [[], [""]]], function(pair) {
    assert.strictEqual(func({}, pair[0]), undefined);
    assert.strictEqual(func({ "": 3 }, pair[1]), 3);
  });
});

it("`" + methodName + "` should handle complex paths", function() {
  var object = {
    a: {
      "-1.23": { '["b"]': { c: { "['d']": { "\ne\n": { f: { g: 8 } } } } } }
    }
  };

  var paths = [
    "a[-1.23][\"[\\\"b\\\"]\"].c['[\\'d\\']'][\ne\n][f].g",
    ["a", "-1.23", '["b"]', "c", "['d']", "\ne\n", "f", "g"]
  ];

  lodashStable.each(paths, function(path) {
    assert.strictEqual(func(object, path), 8);
  });
});

it(
  "`" + methodName + "` should return `undefined` when `object` is nullish",
  function() {
    lodashStable.each(["constructor", ["constructor"]], function(path) {
      assert.strictEqual(func(null, path), undefined);
      assert.strictEqual(func(undefined, path), undefined);
    });
  }
);

it(
  "`" +
    methodName +
    "` should return `undefined` for deep paths when `object` is nullish",
  function() {
    var values = [null, undefined],
      expected = lodashStable.map(values, noop),
      paths = [
        "constructor.prototype.valueOf",
        ["constructor", "prototype", "valueOf"]
      ];

    lodashStable.each(paths, function(path) {
      var actual = lodashStable.map(values, function(value) {
        return func(value, path);
      });

      assert.deepStrictEqual(actual, expected);
    });
  }
);

it(
  "`" +
    methodName +
    "` should return `undefined` if parts of `path` are missing",
  function() {
    var object = { a: [, null] };

    lodashStable.each(["a[1].b.c", ["a", "1", "b", "c"]], function(path) {
      assert.strictEqual(func(object, path), undefined);
    });
  }
);

it("`" + methodName + "` should be able to return `null` values", function() {
  var object = { a: { b: null } };

  lodashStable.each(["a.b", ["a", "b"]], function(path) {
    assert.strictEqual(func(object, path), null);
  });
});

it(
  "`" + methodName + "` should follow `path` over non-plain objects",
  function() {
    var paths = ["a.b", ["a", "b"]];

    lodashStable.each(paths, function(path) {
      numberProto.a = { b: 2 };
      assert.strictEqual(func(0, path), 2);
      delete numberProto.a;
    });
  }
);

it(
  "`" + methodName + "` should return the default value for `undefined` values",
  function() {
    var object = { a: {} },
      values = empties.concat(true, new Date(), 1, /x/, "a"),
      expected = lodashStable.map(values, function(value) {
        return [value, value];
      });

    lodashStable.each(["a.b", ["a", "b"]], function(path) {
      var actual = lodashStable.map(values, function(value) {
        return [func(object, path, value), func(null, path, value)];
      });

      assert.deepStrictEqual(actual, expected);
    });
  }
);

it(
  "`" + methodName + "` should return the default value when `path` is empty",
  function() {
    assert.strictEqual(func({}, [], "a"), "a");
  }
);

console.log(`Failed lodash tests: ${failed.length}\n` + failed.join("\n"))