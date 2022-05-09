module.exports = function (array) {
  return array.sort(function (a, b) {
    var nameA = a;
    var nameB = b;

    if (nameA > nameB) {
      return 1;
    }
    if (nameA < nameB) {
      return -1;
    }

    return 0;
  });
};
