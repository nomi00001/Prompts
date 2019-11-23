const through2 = require('through2');

const list = [];
const mapToArray = through2.obj(function (media, enc, cb) {
  list.push(media)
  cb();
}, function (cb) {
  this.push(list);
  cb();
});

module.exports = mapToArray;