// Globals

var game;
var cw, ch;
var bw, bh;
var s;

// Utils

function scale(x) {
    return x * s;
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function createNumericArray(value, count) {
    return Array.apply(null, new Array(count)).map(Number.prototype.valueOf, value);
}

function setSmoothingEnabled(ctx, val) {
    ctx.imageSmoothingEnabled       = val;
    ctx.mozImageSmoothingEnabled    = val;
    ctx.webkitImageSmoothingEnabled = val;
    ctx.oImageSmoothingEnabled      = val;
    ctx.msImageSmoothingEnabled     = val;
}

function getCharWidth(char, fontData) {
    var charIdx = fontData.chars.indexOf(char);
    return charIdx < 0 ? 0 : fontData.charWidth[charIdx];
}

function getCharOffset(char, fontData) {
    var charIdx = fontData.chars.indexOf(char);
    return charIdx < 0 ? 0 : fontData.offsets[charIdx];
}

 function measureText(text, fontData) {
    var maxW = 0;
    var w = 0;
    var h = fontData.lineHeight + fontData.ySpacing;
    for (var i = 0; i < text.length; i++) {
        if (text[i] == '\n') {
            h += fontData.lineHeight + fontData.ySpacing;
            maxW = Math.max(maxW, w);
            w = 0;
        } else {
            w += getCharWidth(text[i], fontData) + fontData.xSpacing;
        }
    }
    maxW = Math.max(maxW, w);
    return { 
        w: Math.max(0, maxW - fontData.xSpacing), 
        h: h - fontData.ySpacing
    };
}

// Init

function init(canvasW, canvasH, bkgrW, bkgrH, container) {
	cw = canvasW; ch = canvasH;
	bw = bkgrW;   bh = bkgrH;
	game = new Phaser.Game(cw, ch, Phaser.AUTO, container);
    var containerObj = document.getElementById(container);
    containerObj.style.transformOrigin = "0 0";
    containerObj.style.transform = "scale(" + (1 / window.devicePixelRatio) + ")";
    var s1 = Math.floor(cw / bw);
    var s2 = Math.ceil(cw / bw);
	s = Math.abs(s1 * bw - cw) > Math.abs(s2 * bw - cw) ? s2 : s1;
}

// Assets

function addImage(imgName, cacheKey, addToCache) {
    var img = game.cache.getImage(imgName);
    var w = scale(img.width);
    var h = scale(img.height);
    var bd = game.add.bitmapData(w, h, cacheKey, addToCache);
    // this is the only place where NN resize is performed
    setSmoothingEnabled(bd.ctx, false);
    bd.ctx.drawImage(img, 0, 0, w, h);
    setSmoothingEnabled(bd.ctx, true);
    return bd;
}

function addSprite(x, y, imgName) {
    return game.add.sprite(cw / 2 + scale(x), ch / 2 + scale(y), addImage(imgName));
}

function addFont(imgName, fontName, fontData) {
    addImage(imgName, fontName, /*addToCache=*/true).$fontData = fontData;
    if (isNumber(fontData.charWidth)) {
        fontData.charWidth = createNumericArray(fontData.charWidth, fontData.chars.length);
    } 
    fontData.offsets = [];
    var offset = 0;
    for (var i = 0; i < fontData.chars.length; i++) {
        fontData.offsets.push(offset);
        offset += getCharWidth(fontData.chars[i], fontData);
    }
}

function addText(fontName, text, evenSize) {
    var font = game.cache.getBitmapData(fontName);
    var txtSize = measureText(text, font.$fontData);
    var w = scale(txtSize.w);
    var h = scale(txtSize.h);
    if (evenSize) {
        if (w % 2 !== 0) { w++; }
        if (h % 2 !== 0) { h++; }
    }
    var bd = game.add.bitmapData(w, h); 
    var charX = 0, charY = 0;
    var charW;
    for (var i = 0; i < text.length; i++) {
        if (text[i] == '\n') {
            charY += scale(font.$fontData.lineHeight + font.$fontData.ySpacing);
            charX = 0;
        } else {
            charW = scale(getCharWidth(text[i], font.$fontData));
            bd.copy(font, scale(getCharOffset(text[i], font.$fontData)), 0, charW, scale(font.$fontData.lineHeight), charX, charY);
            charX += charW + scale(font.$fontData.xSpacing);
        }
    }
    return bd;
}

function addTextSprite(x, y, fontName, text, evenSize) {
    var sprite = game.add.sprite(cw / 2 + scale(x), ch / 2 + scale(y), addText(fontName, text, evenSize));
    sprite.$fontName = fontName;
    return sprite;
}

function updateTextSprite(sprite, text, evenSize) {
    sprite.loadTexture(addText(sprite.$fontName, text, evenSize));
}

// Fonts

var spectrumFontData = {
    imgFileName: "font/spectrum.png",
    chars:       "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    charWidth:   7, 
    lineHeight:  6,
    xSpacing:    0,  
    ySpacing:    1
};