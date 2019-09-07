(function() {
  // Inits
  // Transparent On/OFF bug

  // Screens: MacOS - Monochrome
  // Settings: URL bar ON/OFF

  // Magnifier: Select
  // - Normal - OK
  // - Silver - 2 circles - transparent - whiter background
  // - Transparent border - 2 circles - inner shadow + outer shadow - blurred background
  // Magnifier settings: lens size, lens scale

  // Download settings: png/jpg, 1k/2k width

  // Intro popup

  // Run server
  // python -m SimpleHTTPServer
  feather.replace() // inits feather icons

  var lens,
      lensClippper,
      lensBorderInner,
      lensBorderOuter,
      lensRadius = 150,
      lensScale = 2.5,
      lensLeft,
      lensTop,
      mouseX=1,
      mouseY=1,
      screenshotUrl,
      imgScale,
      imgWidth,
      imgHeight,
      imgLeft,
      imgTop,
      mockupImg,
      mockupObjects,
      canvasWidth,
      canvasHeight
      canvasSizes = [800, 1000, 1400],
      defaultColor = '#007BFF',
      fileWidth = 800

  // Init canvas and resize to fit the screen
  var canvas = this.__canvas = new fabric.Canvas('canvas');
  var backPattern = new fabric.Pattern({source: 'https://www.transparenttextures.com/patterns/always-grey.png', repeat: 'repeat'});

  var shadow = {
    color: 'rgba(0, 80, 200, 1)',
    blur: 20,
    offsetX: -15,
    offsetY: 15,
    opacity: 0.8
  }

  canvas.setBackgroundColor(defaultColor);

  resizeCanvas = function() {
    var winW = $(window).width(),
        winH = $(window).height(),
        curW = canvas.getWidth(),
        curH = canvas.getHeight()

        sidebarWidth = $('nav').width(),
        canvasWidth = canvasSizes[0],
        canvasHeight

    if (winW - sidebarWidth > 1500) {
      canvasWidth = canvasSizes[2]
    } else if ((winW - sidebarWidth > 1100)) {
      canvasWidth = canvasSizes[1]
    }

    canvasHeight = canvasWidth*0.75;

    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    imgWidth = canvasWidth-200
    canvas.renderAll();
  };
  $(window).resize(resizeCanvas);
  resizeCanvas();

  renderMockup = function(svgSource="", whRatio=null) {
    if (typeof mockupObjects !== 'undefined') {
      console.log("removing screen type");
      canvas.remove(mockupObjects);
    }
    if (svgSource != "") {
      fabric.loadSVGFromURL(svgSource, function (objects, options) {
        mockupObjects = fabric.util.groupSVGElements(objects, options);
        mockupObjects.set({
            evented: true,
            selectable: false,
            width: canvasWidth*0.9,
            height: canvasHeight*0.9
        });

        canvas.centerObject(mockupObjects);
        mockupObjects.setShadow(shadow);
        canvas.add(mockupObjects);
        canvas.sendToBack(mockupObjects);
      }, addSVGProperties);

      // copy ID property as object.id
      function addSVGProperties(el, obj) {
        obj.id = el.getAttribute('id');
        if (obj.id == "border") {
          obj.set({"height": whRatio*imgWidth+25}); 
        }
      }
    }
  }

  // Inits jquery fields to start fresh on refresh
  $('input[name=shadow-range]').val("5");
  $('select[id=mockup]').val("");
  $('select[id=magnifier]').val("");

  $('#color-picker').colorpicker({
    useAlpha: false,
    format: 'hex',
    color: defaultColor
  });

  // set colorpicker value based on user input
  $('#color').val("").on("blur", function(e) {
    var inputColor = $(this).val()
    if (inputColor != null && inputColor != "") {
      $('#color-picker').colorpicker("setValue", inputColor);
    }
  });

  $('#transparent-checkbox').prop('checked', false).on("change", function(e) {
    console.log("transparent: " + this.checked);
    if (this.checked) {
      canvas.setBackgroundColor('rgba(255,255,255,0)', canvas.renderAll.bind(canvas));
    } else {
      canvas.setBackgroundColor($('#color').val());
      canvas.renderAll();
    }
  });

  // Init dropzone
  $("#dropzone").dropzone({
    url: "post", // temp
    autoProcessQueue: false, // do not send to server, yet
    init: function() {
      this.on("drop", function(file) {
        $(".dz-preview").remove(); // remove previously dropped img details from dropzone
      });

      this.on("thumbnail", function(file) {
        // removes previously added image from canvas
        var objects = canvas.getObjects();
        for (let i in objects) {
            canvas.remove(objects[i]);
        }

        // show additional settings (color, shadow, etc.)
        $('#dropzone').removeClass("dropzone-lg").addClass("dropzone-sm");
        $('#dropzone').find("p").text("Drop or upload screenshot to change it.");
        $('#form-block').show();

        // add image to canvas & center it
        droppedImg = new Image();
        droppedImg.src = file.dataURL;
        var fileSize = {"width": file.width, "height": file.height};
        fileWidth = fileSize["width"];
        var whRatio = fileSize["height"]/fileSize["width"];

        var dropImg = new fabric.Image(droppedImg);
        dropImg.set({selectable: false});
        dropImg.scaleToWidth(imgWidth);
        canvas.centerObject(dropImg);
        var dropImgBox = dropImg.getBoundingRect();
        dropImg.set("top", dropImgBox["top"]+12)
        canvas.add(dropImg);

        renderMockup("img/browser-macos-no-url.svg", whRatio);
        $('select#mockup').val('img/browser-macos-no-url.svg');
        //dropImg.setShadow(shadow);

        $('#color-picker').on('colorpickerChange', function(event) {
          if (event.color != null) {
            console.log("change color")
            $('#color').val(event.color.toString());
            shadow["color"] = event.color.api("darken", 0.3).toString();
            if (typeof lensBorderOuter !== 'undefined') {
              lensBorderOuter.set('fill', shadow["color"]);
            }
            if (!$('#transparent-checkbox').is(':checked')) {
              canvas.setBackgroundColor(event.color.toString());
            }
            mockupObjects.setShadow(shadow);
            canvas.renderAll();
          }
        })

        $('input[name=shadow-position]').on("change", function(e) {
          console.log("change shadow position")

          shadow["offsetX"] = this.value*shadow["offsetY"];
          mockupObjects.setShadow(shadow);
          canvas.renderAll();
        });

        $('input[name=shadow-blur]').on("change", function(e) {
          console.log("change shadow blur");
          shadow["blur"] = this.value;
          mockupObjects.setShadow(shadow);
          canvas.renderAll();
        });

        $('input[name=shadow-range]').on("change", function(e) {
          console.log("change shadow range")
          if (this.value == "0") {
            $('#radio-center').button("toggle");
          }
          $('#shadow-size').html(this.value);
          shadow["offsetX"] = Math.sign(shadow["offsetX"])*this.value*3;
          shadow["offsetY"] = this.value*3;
          //shadow["blur"] = this.value*10;
          //shadow["opacity"] = this.value*0.1;
          mockupObjects.setShadow(shadow);
          canvas.renderAll();
        });

        $('select#mockup').on("change", function(e) {
          console.log("change screen type");
          if (this.value == "") {
            renderMockup(); // remove the screen mockup

            dropImg.set({'clipTo':
              function(ctx) {
                var rect = new fabric.Rect({
                  width: this.width,
                  height: this.height,
                  top: 0,
                  left: 0,
                  rx: 50,
                  ry: 50
                });
                rect._render(ctx, false);
              }
            });

            //dropImg.setShadow(shadow);
          } else {
            dropImg.set({"clipTo": null});
            //dropImg.setShadow(null);
            renderMockup(this.value, whRatio);
          }
          canvas.renderAll();
        });

        $('select#magnifier').on("change", function(e) {
          // Set lens / magnifier
          imgLeft = dropImg.get("left");
          imgTop = dropImg.get("top");
          if (typeof lens === 'undefined' || lens == null) {
            lensClippper = new fabric.Circle({
              radius:lensRadius,
              top:400,
              left:600,
              originX: "center",
              originY: "center",
              absolutePositioned: true
            });
            dropImg.clone(function(c) {
              lens = c;
              lens.set({evented: true, selectable: false});
              lens.setShadow(null);
              canvas.centerObject(lens);
              lens.scaleToWidth(dropImg.get("width")*dropImg.get("scaleX")*lensScale);
              lens.clipPath = lensClippper;
              canvas.add(lens);
              lens.bringToFront();
            });            
            lensBorderOuter = new fabric.Circle({
              radius: lensRadius+4,
              top:399,
              left: 599,
              originX: "center",
              originY: "center",
              fill: shadow["color"],
              //stroke: "#999",
              selectable: false
            });
            canvas.add(lensBorderOuter);
            lensBorderOuter.moveTo(3);
          } else if (this.value == "") {
            canvas.remove(lens);
            lensClippper = null;
            lens = null;
            canvas.remove(lensBorderOuter);
          }

          $('#magnifier-settings').css("display", "flex");

          canvas.renderAll();
        });

        $('input[name=magnifier-size]').on("change", function(e) {
          console.log("change magnifier-size: " + this.value);
          
          $('#magnifier-size').html(this.value);
          lensRadius = this.value
          lensClippper.set({radius: lensRadius});
          lensBorderOuter.set({radius: parseInt(lensRadius)+4});
          canvas.renderAll();
        });

        $('input[name=magnifier-scale]').on("change", function(e) {
          console.log("change magnifier-scale: " + this.value);
          
          $('#magnifier-scale').html(this.value);
          lensScale = this.value
          lens.scaleToWidth(dropImg.get("width")*dropImg.get("scaleX")*lensScale);
          canvas.renderAll();
        });

        canvas.renderAll();
      });
    }
  });

  $("#download").on("click", function () {
    var fileMultiplier = fileWidth/imgWidth,
      fileType = $('select#download-type').val()
    console.log("download canvas: "+ fileMultiplier + " ."+fileType);
    this.href = canvas.toDataURL({
        multiplier: fileMultiplier,
        format: fileType,
        quality: 1
    });
    this.download = 'productshot-1.'+fileType;
  });


  canvas.on('mouse:down', function (e) {
      mouseX = e.e.layerX;
      mouseY = e.e.layerY;
      if (typeof lens !== 'undefined') {
        lens.set('left', mouseX - lensScale*(mouseX - imgLeft));
        lens.set('top', mouseY - lensScale*(mouseY - imgTop));
        lensClippper.set({'left': mouseX, 'top': mouseY});
        lensBorderOuter.set({'left': mouseX-0.2, 'top': mouseY-0.2});
        canvas.renderAll();
      }
  });


})();
