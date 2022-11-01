module.exports = {
  checkMask: function (combo, mask) {
    
    if (!mask) return true;

    for (var i = 0; i < combo.length; i++)
      if (mask[i] + combo[i] == 2) return true;

    return false;
  },
  binaryCombinations: function (n) {

    var result = [];
    for (y = 0; y < Math.pow(2, n); y++) {
      var combo = [];
      for (x = 0; x < n; x++) combo.push((y >> x) & 1);
      //shift bit and AND it with 1

      result.push(combo);
    }
    return result;
  },
  getWildcardPermutations: function (topic, mask) {

    var _this = this;

    var possible = [];

    var segments = topic.split('/').slice(1);

    var combinations = this.binaryCombinations(segments.length);

    combinations.forEach(function (combo) {

      if (mask != null && (eval(mask.join('+')) > 0) && !_this.checkMask(combo, mask)) return;

      var possibility = [];

      segments.forEach(function (segment, segmentIndex) {

        if (combo[segmentIndex] == 1) return possibility.push('*');
        possibility.push(segment);
      });

      possible.push('/' + possibility.join('/'));
    });

    return possible;
  }
};