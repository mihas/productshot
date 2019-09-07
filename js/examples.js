// Examples

var src = "http://fabricjs.com/lib/pug.jpg";
fabric.Image.fromURL(src, function(img) {
  img.selectable = false;
  img.id = 'image';
  object = img;
  canvas.add(img);
});

canvas.on('object:added', function(e) {
  target = null;
  mask = null;
  canvas.forEachObject(function(obj) {
    //alert(obj.get('id'));
    var id = obj.get('id');
    if (id === 'image') {
      target = obj;
    }
    if (id === 'mask') {
      //alert('mask');
      mask = obj;
    }
  });
});