module.exports = function (data) {
  return data.reduce((newObject, item) => {
    newObject[item._id] = item;

    return newObject;
  }, {});
};
