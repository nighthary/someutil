/**
 * 获取图片相关信息
 * https://github.com/exif-js/exif-js
 */
var debug = false;
var root = this;
var EXIF = function(obj) {
    if (obj instanceof EXIF) return obj;
    if (!(this instanceof EXIF)) return new EXIF(obj);
    this.EXIFwrapped = obj;
};
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = EXIF;
    }
    exports.EXIF = EXIF;
} else {
    root.EXIF = EXIF;
}

var TiffTags = EXIF.TiffTags = {
    0x0112: "Orientation"
};

function addEvent(element, event, handler) {
    if (element.addEventListener) {
        element.addEventListener(event, handler, false);
    } else if (element.attachEvent) {
        element.attachEvent("on" + event, handler);
    }
}

function imageHasData(img) {
    return !!(img.exifdata);
}

function base64ToArrayBuffer(base64, contentType) {
    contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
    base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}

function objectURLToBlob(url, callback) {
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.responseType = "blob";
    http.onload = function(e) {
        if (this.status == 200 || this.status === 0) {
            callback(this.response);
        }
    };
    http.send();
}

function getImageData(img, callback) {
    function handleBinaryFile(binFile) {
        var data = findEXIFinJPEG(binFile);
        var iptcdata = findIPTCinJPEG(binFile);
        img.exifdata = data || {};
        img.iptcdata = iptcdata || {};
        if (callback) {
            callback.call(img);
        }
    }
    if (img.src) {
        if (/^data\:/i.test(img.src)) { // Data URI
            var arrayBuffer = base64ToArrayBuffer(img.src);
            handleBinaryFile(arrayBuffer);
        } else if (/^blob\:/i.test(img.src)) { // Object URL
            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                handleBinaryFile(e.target.result);
            };
            objectURLToBlob(img.src, function(blob) {
                fileReader.readAsArrayBuffer(blob);
            });
        } else {
            var http = new XMLHttpRequest();
            http.onload = function() {
                if (this.status == 200 || this.status === 0) {
                    handleBinaryFile(http.response);
                } else {
                    throw "Could not load image";
                }
                http = null;
            };
            http.open("GET", img.src, true);
            http.responseType = "arraybuffer";
            http.send(null);
        }
    } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
        var fileReader = new FileReader();
        fileReader.onload = function(e) {
            if (debug) console.log("Got file of length " + e.target.result.byteLength);
            handleBinaryFile(e.target.result);
        };
        fileReader.readAsArrayBuffer(img);
    }
}

function findEXIFinJPEG(file) {
    var dataView = new DataView(file);
    if (debug) console.log("Got file of length " + file.byteLength);
    if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
        if (debug) console.log("Not a valid JPEG");
        return false; // not a valid jpeg
    }
    var offset = 2,
        length = file.byteLength,
        marker;
    while (offset < length) {
        if (dataView.getUint8(offset) != 0xFF) {
            if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
            return false; // not a valid marker, something is wrong
        }
        marker = dataView.getUint8(offset + 1);
        if (debug) console.log(marker);
        // we could implement handling for other markers here,
        // but we're only looking for 0xFFE1 for EXIF data
        if (marker == 225) {
            if (debug) console.log("Found 0xFFE1 marker");
            return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);
            // offset += 2 + file.getShortAt(offset+2, true);
        } else {
            offset += 2 + dataView.getUint16(offset + 2);
        }
    }
}

function findIPTCinJPEG(file) {
    var dataView = new DataView(file);
    if (debug) console.log("Got file of length " + file.byteLength);
    if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
        if (debug) console.log("Not a valid JPEG");
        return false; // not a valid jpeg
    }
    var offset = 2,
        length = file.byteLength;
    var isFieldSegmentStart = function(dataView, offset) {
        return (
            dataView.getUint8(offset) === 0x38 &&
            dataView.getUint8(offset + 1) === 0x42 &&
            dataView.getUint8(offset + 2) === 0x49 &&
            dataView.getUint8(offset + 3) === 0x4D &&
            dataView.getUint8(offset + 4) === 0x04 &&
            dataView.getUint8(offset + 5) === 0x04
        );
    };
    while (offset < length) {
        if (isFieldSegmentStart(dataView, offset)) {
            // Get the length of the name header (which is padded to an even number of bytes)
            var nameHeaderLength = dataView.getUint8(offset + 7);
            if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
            // Check for pre photoshop 6 format
            if (nameHeaderLength === 0) {
                // Always 4
                nameHeaderLength = 4;
            }
            var startOffset = offset + 8 + nameHeaderLength;
            var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);
            return readIPTCData(file, startOffset, sectionLength);
            break;
        }
        // Not the marker, continue searching
        offset++;
    }
}
var IptcFieldMap = {
    0x78: 'caption',
    0x6E: 'credit',
    0x19: 'keywords',
    0x37: 'dateCreated',
    0x50: 'byline',
    0x55: 'bylineTitle',
    0x7A: 'captionWriter',
    0x69: 'headline',
    0x74: 'copyright',
    0x0F: 'category'
};

function readIPTCData(file, startOffset, sectionLength) {
    var dataView = new DataView(file);
    var data = {};
    var fieldValue, fieldName, dataSize, segmentType, segmentSize;
    var segmentStartPos = startOffset;
    while (segmentStartPos < startOffset + sectionLength) {
        if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
            segmentType = dataView.getUint8(segmentStartPos + 2);
            if (segmentType in IptcFieldMap) {
                dataSize = dataView.getInt16(segmentStartPos + 3);
                segmentSize = dataSize + 5;
                fieldName = IptcFieldMap[segmentType];
                fieldValue = getStringFromDB(dataView, segmentStartPos + 5, dataSize);
                // Check if we already stored a value with this name
                if (data.hasOwnProperty(fieldName)) {
                    // Value already stored with this name, create multivalue field
                    if (data[fieldName] instanceof Array) {
                        data[fieldName].push(fieldValue);
                    } else {
                        data[fieldName] = [data[fieldName], fieldValue];
                    }
                } else {
                    data[fieldName] = fieldValue;
                }
            }
        }
        segmentStartPos++;
    }
    return data;
}

function readTags(file, tiffStart, dirStart, strings, bigEnd) {
    var entries = file.getUint16(dirStart, !bigEnd),
        tags = {},
        entryOffset, tag,
        i;
    for (i = 0; i < entries; i++) {
        entryOffset = dirStart + i * 12 + 2;
        tag = strings[file.getUint16(entryOffset, !bigEnd)];
        if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
        tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
    }
    return tags;
}

function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
    var type = file.getUint16(entryOffset + 2, !bigEnd),
        numValues = file.getUint32(entryOffset + 4, !bigEnd),
        valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
        offset,
        vals, val, n,
        numerator, denominator;
    switch (type) {
        case 1: // byte, 8-bit unsigned int
        case 7: // undefined, 8-bit byte, value depending on field
            if (numValues == 1) {
                return file.getUint8(entryOffset + 8, !bigEnd);
            } else {
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getUint8(offset + n);
                }
                return vals;
            }
        case 2: // ascii, 8-bit byte
            offset = numValues > 4 ? valueOffset : (entryOffset + 8);
            return getStringFromDB(file, offset, numValues - 1);
        case 3: // short, 16 bit int
            if (numValues == 1) {
                return file.getUint16(entryOffset + 8, !bigEnd);
            } else {
                offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                }
                return vals;
            }
        case 4: // long, 32 bit int
            if (numValues == 1) {
                return file.getUint32(entryOffset + 8, !bigEnd);
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                }
                return vals;
            }
        case 5: // rational = two long values, first is numerator, second is denominator
            if (numValues == 1) {
                numerator = file.getUint32(valueOffset, !bigEnd);
                denominator = file.getUint32(valueOffset + 4, !bigEnd);
                val = new Number(numerator / denominator);
                val.numerator = numerator;
                val.denominator = denominator;
                return val;
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                    denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                    vals[n] = new Number(numerator / denominator);
                    vals[n].numerator = numerator;
                    vals[n].denominator = denominator;
                }
                return vals;
            }
        case 9: // slong, 32 bit signed int
            if (numValues == 1) {
                return file.getInt32(entryOffset + 8, !bigEnd);
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                }
                return vals;
            }
        case 10: // signed rational, two slongs, first is numerator, second is denominator
            if (numValues == 1) {
                return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd);
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                }
                return vals;
            }
    }
}

function getStringFromDB(buffer, start, length) {
    var outstr = "";
    for (n = start; n < start + length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n));
    }
    return outstr;
}

function readEXIFData(file, start) {
    if (getStringFromDB(file, start, 4) != "Exif") {
        if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
        return false;
    }
    var bigEnd,
        tags, tag,
        exifData, gpsData,
        tiffOffset = start + 6;
    // test for TIFF validity and endianness
    if (file.getUint16(tiffOffset) == 0x4949) {
        bigEnd = false;
    } else if (file.getUint16(tiffOffset) == 0x4D4D) {
        bigEnd = true;
    } else {
        if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
        return false;
    }
    if (file.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
        if (debug) console.log("Not valid TIFF data! (no 0x002A)");
        return false;
    }
    var firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);
    if (firstIFDOffset < 0x00000008) {
        if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset + 4, !bigEnd));
        return false;
    }
    tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);
    if (tags.ExifIFDPointer) {
        exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
        for (tag in exifData) {
            switch (tag) {
                case "LightSource":
                case "Flash":
                case "MeteringMode":
                case "ExposureProgram":
                case "SensingMethod":
                case "SceneCaptureType":
                case "SceneType":
                case "CustomRendered":
                case "WhiteBalance":
                case "GainControl":
                case "Contrast":
                case "Saturation":
                case "Sharpness":
                case "SubjectDistanceRange":
                case "FileSource":
                    exifData[tag] = StringValues[tag][exifData[tag]];
                    break;
                case "ExifVersion":
                case "FlashpixVersion":
                    exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                    break;
                case "ComponentsConfiguration":
                    exifData[tag] =
                        StringValues.Components[exifData[tag][0]] +
                        StringValues.Components[exifData[tag][1]] +
                        StringValues.Components[exifData[tag][2]] +
                        StringValues.Components[exifData[tag][3]];
                    break;
            }
            tags[tag] = exifData[tag];
        }
    }
    if (tags.GPSInfoIFDPointer) {
        gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
        for (tag in gpsData) {
            switch (tag) {
                case "GPSVersionID":
                    gpsData[tag] = gpsData[tag][0] +
                        "." + gpsData[tag][1] +
                        "." + gpsData[tag][2] +
                        "." + gpsData[tag][3];
                    break;
            }
            tags[tag] = gpsData[tag];
        }
    }
    return tags;
}
EXIF.getData = function(img, callback) {
    if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;
    if (!imageHasData(img)) {
        getImageData(img, callback);
    } else {
        if (callback) {
            callback.call(img);
        }
    }
    return true;
}
EXIF.getTag = function(img, tag) {
    if (!imageHasData(img)) return;
    return img.exifdata[tag];
}
EXIF.getIptcTag = function(img, tag) {
    if (!imageHasData(img)) return;
    return img.iptcdata[tag];
}
EXIF.getAllTags = function(img) {
    if (!imageHasData(img)) return {};
    var a,
        data = img.exifdata,
        tags = {};
    for (a in data) {
        if (data.hasOwnProperty(a)) {
            tags[a] = data[a];
        }
    }
    return tags;
}
EXIF.getAllIptcTags = function(img) {
    if (!imageHasData(img)) return {};
    var a,
        data = img.iptcdata,
        tags = {};
    for (a in data) {
        if (data.hasOwnProperty(a)) {
            tags[a] = data[a];
        }
    }
    return tags;
}
EXIF.pretty = function(img) {
    if (!imageHasData(img)) return "";
    var a,
        data = img.exifdata,
        strPretty = "";
    for (a in data) {
        if (data.hasOwnProperty(a)) {
            if (typeof data[a] == "object") {
                if (data[a] instanceof Number) {
                    strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                } else {
                    strPretty += a + " : [" + data[a].length + " values]\r\n";
                }
            } else {
                strPretty += a + " : " + data[a] + "\r\n";
            }
        }
    }
    return strPretty;
}
EXIF.readFromBinaryFile = function(file) {
    return findEXIFinJPEG(file);
}
if (typeof define === 'function' && define.amd) {
    define('exif-js', [], function() {
        return EXIF;
    });
}
