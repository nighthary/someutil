function zipImg(opts) {
    var settings = {
        resizeMode: "auto", //压缩模式，总共有三种  auto,width,height auto表示自动根据最大的宽度及高度等比压缩，width表示只根据宽度来判断是否需要等比例压缩，height类似。
        dataSource: "", //数据源。数据源是指需要压缩的数据源，有三种类型，image图片元素，base64字符串，canvas对象，还有选择文件时候的file对象。。。
        dataSourceType: "image", //image  base64 canvas
        maxWidth: 150, //允许的最大宽度
        maxHeight: 200, //允许的最大高度。
        beforeZip: function() {}, //压缩之前执行的函数
        onTmpImgGenerate: function(img) {}, //当中间图片生成时候的执行方法。。这个时候请不要乱修改这图片，否则会打乱压缩后的结果。
        success: function(resizeImgBase64, canvas) {}, //压缩成功后图片的base64字符串数据。
        debug: false //是否开启调试模式。
    };
    $.extend(settings, opts);

    var _debug = function(str, styles) {
        if (settings.debug == true) {
            if (styles) {
                console.log(str, styles);
            } else {
                console.log(str);
            }
        }
    };
    var innerTools = {
        getBase4FromImgFile: function(file, callBack) {

            var reader = new FileReader();
            reader.onload = function(e) {
                var base64Img = e.target.result;
                //var $img = $('<img>').attr("src", e.target.result)
                //$('#preview').empty().append($img)
                if (callBack) {
                    callBack(base64Img);
                }
            };
            reader.readAsDataURL(file);
        },
        //--处理数据源。。。。将所有数据源都处理成为图片图片对象，方便处理。
        getImgFromDataSource: function(datasource, dataSourceType, callback) {
            var _me = this;
            var img1 = new Image();
            if (dataSourceType == "img" || dataSourceType == "image") {
                img1.src = $(datasource).attr("src");
                img1.onload = function() {
                    if (callback) {
                        callback(img1);
                    }
                }
            } else if (dataSourceType == "base64") {
                img1.src = datasource;
                img1.onload = function() {
                    if (callback) {
                        callback(img1);
                    }
                }
            } else if (dataSourceType == "canvas") {
                img1.src = datasource.toDataURL("image/jpeg");
                img1.onload = function() {
                    if (callback) {
                        callback(img1);
                    }
                }
            } else if (dataSourceType == "file") {
                _me.getBase4FromImgFile(function(base64str) {
                    img1.src = base64str;
                    img1.onload = function() {
                        if (callback) {
                            callback(img1);
                        }
                    }
                });
            }

        },
        //计算图片的需要压缩的尺寸。当然，压缩模式，压缩限制直接从setting里面取出来。
        getResizeSizeFromImg: function(img) {
            var _img_info = {
                w: $(img)[0].naturalWidth,
                h: $(img)[0].naturalHeight
            };
            if (settings.debug) {
                console.log("----真实尺寸----");
                console.log(_img_info);
            }
            var _resize_info = {
                w: 0,
                h: 0
            };
            if (_img_info.w <= settings.maxWidth && _img_info.h <= settings.maxHeight) {
                return _img_info;
            }
            if (settings.resizeMode == "auto") {
                var _percent_scale = parseFloat(_img_info.w / _img_info.h);
                var _size1 = {
                    w: 0,
                    h: 0
                };
                var _size_by_mw = {
                    w: settings.maxWidth,
                    h: parseInt(settings.maxWidth / _percent_scale)
                };
                var _size_by_mh = {
                    w: parseInt(settings.maxHeight * _percent_scale),
                    h: settings.maxHeight
                };
                if (_size_by_mw.h <= settings.maxHeight) {
                    return _size_by_mw;
                }
                if (_size_by_mh.w <= settings.maxWidth) {
                    return _size_by_mh;
                }

                return {
                    w: settings.maxWidth,
                    h: settings.maxHeight
                };

            }
            if (settings.resizeMode == "width") {
                if (_img_info.w <= settings.maxWidth) {
                    return _img_info;
                }
                var _size_by_mw = {
                    w: settings.maxWidth,
                    h: parseInt(settings.maxWidth / _percent_scale)
                };
                return _size_by_mw;
            }

            if (settings.resizeMode == "height") {
                if (_img_info.h <= settings.maxHeight) {

                    return _img_info;
                }
                var _size_by_mh = {
                    w: parseInt(settings.maxHeight * _percent_scale),
                    h: settings.maxHeight
                };
                return _size_by_mh;
            }

        },
        //--将相关图片对象画到canvas里面去。
        //--将相关图片对象画到canvas里面去。
        drawToCanvas: function(img, theW, theH, realW, realH, callback) {

            var canvas = document.createElement("canvas");
            canvas.width = theW;
            canvas.height = theH;
            var ctx = canvas.getContext('2d');
            var orient = this.getPhotoOrientation(img);
            switch (orient) {
                case 6: //需要顺时针（向左）90度旋转
                    this.rotateImg(img, 'left', canvas);
                    break;
                case 8: //需要逆时针（向右）90度旋转
                    this.rotateImg(img, 'right', canvas);
                    break;
                case 3: //需要180度旋转
                    this.rotateImg(img, 'bottom', canvas); //转两次
                    break;
                default:
                    ctx.drawImage(img,
                        0, //sourceX,
                        0, //sourceY,
                        realW, //sourceWidth,
                        realH, //sourceHeight,
                        0, //destX,
                        0, //destY,
                        theW, //destWidth,
                        theH //destHeight
                    );
                    break;
            }
            //--获取base64字符串及canvas对象传给success函数。
            var base64str = canvas.toDataURL("image/png");
            if (callback) {
                callback(base64str, canvas);
            }
        },
        //获取图片旋转方向
        //0-1
        //顺时针90度-6
        //逆时针90度-8
        //180度-3
        getPhotoOrientation: function(img) {
            var orient;
            EXIF.getData(img, function() {
                orient = EXIF.getTag(this, 'Orientation');
            });
            return orient;
        },
        rotateImg: function(img, direction, canvas) {
            //最小与最大旋转方向，图片旋转4次后回到原方向
            var min_step = 0;
            var max_step = 3;
            //var img = document.getElementById(pid);
            if (img == null) return;
            //img的高度和宽度不能在img元素隐藏后获取，否则会出错
            var height = canvas.height;
            var width = canvas.width;
            //var step = img.getAttribute('step');
            var step = 2;
            if (step == null) {
                step = min_step;
            }
            if (direction == 'right') {
                step++;
                //旋转到原位置，即超过最大值
                step > max_step && (step = min_step);
            } else if (direction == 'bottom') { //旋转180度
                step = 2;
            } else {
                step--;
                step < min_step && (step = max_step);
            }
            //旋转角度以弧度值为参数
            var degree = step * 90 * Math.PI / 180;
            var ctx = canvas.getContext('2d');
            ctx.fillRect(0, 0, 200, 200);
            switch (step) {
                case 0:
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0);
                    break;
                case 1:
                    canvas.width = height;
                    canvas.height = width;
                    ctx.rotate(degree);
                    ctx.drawImage(img, 0, -height, width, height);
                    break;
                case 2:
                    canvas.width = width;
                    canvas.height = height;
                    ctx.rotate(degree);
                    ctx.drawImage(img, -width, -height, width, height);
                    break;
                case 3:
                    canvas.width = height;
                    canvas.height = width;
                    ctx.rotate(degree);
                    ctx.drawImage(img, -width, 0, width, height);
                    break;
            }
        }
    };

    //--开始处理。
    (function() {
        if (settings.beforeZip) {
            settings.beforeZip();
        }
        innerTools.getImgFromDataSource(settings.dataSource, settings.dataSourceType, function(_tmp_img) {
            var __tmpImg = _tmp_img;
            settings.onTmpImgGenerate(_tmp_img);
            //--计算尺寸。
            var _limitSizeInfo = innerTools.getResizeSizeFromImg(__tmpImg);
            if (settings.debug) {
                console.log("----压缩尺寸----");
                console.log(_limitSizeInfo);
            }

            var _img_info = {
                w: $(__tmpImg)[0].naturalWidth,
                h: $(__tmpImg)[0].naturalHeight
            };
            innerTools.drawToCanvas(__tmpImg, _limitSizeInfo.w, _limitSizeInfo.h, _img_info.w, _img_info.h, function(base64str, canvas) {
                settings.success(base64str, canvas);
            });

        });
    })();

    var returnObject = {


    };

    return returnObject;
}
