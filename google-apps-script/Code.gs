/**
 * Chillcom orders -> Google Sheet + Google Drive.
 *
 * How to use (full steps in docs/ORDERS_SETUP.md):
 *  1. Open your Google Sheet -> Extensions -> Apps Script, paste this whole file, Save.
 *  2. Pick "setup" in the function dropdown and click Run (approve the permissions). Copy the SECRET it logs.
 *  3. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone. Copy the /exec URL.
 *
 * The website calls this script from its server with the secret, so only your site can add orders.
 */

var SHEET_NAME = 'Orders';
var FOLDER_NAME = 'Chillcom payment proofs';
var STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];
var HEADERS = ['Order', 'Time', 'Status', 'Item', 'Product', 'Size', 'Amount (Rs)', 'Name', 'Mobile', 'WhatsApp', 'UTR', 'Screenshot'];
var COL = { ITEM: 4, WHATSAPP: 10, SCREENSHOT: 12 };   // 1-based column numbers
var ROW_HEIGHT_WITH_PICTURE = 110;

// Where the small product pictures live: the order-thumbs folder in your GitHub repo.
// The Item column shows PICTURE_BASE + '/' + <product-id> + '.jpg'. GitHub addresses keep working even if
// you rename your Vercel domain. (If you move or rename the repo, change this line and run setup again.)
var PICTURE_BASE = 'https://raw.githubusercontent.com/Tanmaysharma264/clothing-rail-landing/main/public/order-thumbs';

// Product name -> product id, used by setup() to add pictures to orders that were saved without one.
var PRODUCT_IDS = {
  'Shattered Disc Tee · Black': 'tee-shattered-disc',
  'Falling Figure Tee · Black': 'tee-falling-figure',
  'Popsicle Tee · Black': 'tee-popsicle-black',
  'Skeleton Tee · Black': 'tee-skeleton',
  'Popsicle Tee · White': 'tee-popsicle-white',
  'Chill Culture Tee · White': 'tee-chill-culture',
  'Falling Figure Hoodie · Black': 'hoodie-falling-figure',
  'Skeleton Hoodie · Black': 'hoodie-skeleton',
  'Shattered Disc Hoodie · Black': 'hoodie-shattered-disc',
  'Popsicle Hoodie · Black': 'hoodie-popsicle'
};
var RATE_LIMIT = 3;                    // orders per mobile number...
var RATE_WINDOW_MS = 10 * 60 * 1000;   // ...per 10 minutes

/** Run this ONCE by hand. Safe to run again: it never deletes orders. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  // Upgrade from the first version (no "Item" picture column): make room for it. Existing orders are kept.
  if (sheet.getLastColumn() >= 11 && sheet.getRange(1, 4).getValue() === 'Product') {
    sheet.insertColumnAfter(3);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Status column: a dropdown (pending / paid / shipped / cancelled)
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
  sheet.getRange('C2:C').setDataValidation(rule);
  sheet.getRange('D2:D').clearDataValidations(); // an inserted column copies the Status dropdown from column C: remove it

  // Keep names, mobiles and UTRs as plain text so nothing is ever treated as a formula or a number
  ['H2:H', 'I2:I', 'K2:K'].forEach(function (a1) { sheet.getRange(a1).setNumberFormat('@'); });
  sheet.getRange('B2:B').setNumberFormat('dd mmm yyyy, hh:mm');

  // Colour the status so unpaid orders stand out
  var statusRange = sheet.getRange('C2:C');
  var colours = { pending: '#fff3cd', paid: '#d4edda', shipped: '#cce5ff', cancelled: '#e2e3e5' };
  var rules = Object.keys(colours).map(function (status) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status).setBackground(colours[status]).setRanges([statusRange]).build();
  });
  sheet.setConditionalFormatRules(rules);

  sheet.setColumnWidth(1, 80); sheet.setColumnWidth(2, 150); sheet.setColumnWidth(4, 100); sheet.setColumnWidth(5, 230);
  sheet.setColumnWidth(8, 160); sheet.setColumnWidth(9, 110);

  // Fix any orders that an out-of-date web app deployment wrote one column too far left
  var repaired = repairShiftedRows_(sheet);
  var pictures = addMissingPictures_(sheet);

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) {
    props.setProperty('SECRET', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  if (!props.getProperty('ORDER_NO')) props.setProperty('ORDER_NO', '0');
  getFolder_();

  Logger.log('Setup done. Orders repaired: ' + repaired + '. Pictures added: ' + pictures);
  Logger.log('SECRET (copy this into Vercel as SHEETS_SECRET): ' + props.getProperty('SECRET'));
}

/**
 * An older deployment of this script (before the Item column) writes orders into columns D..K instead of E..L.
 * Such a row has text in D (the product), no picture formula, an empty L, and the screenshot link in K.
 * Move it to the right place. Rows that are already correct are never touched.
 */
function repairShiftedRows_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var range = sheet.getRange(2, 1, last - 1, HEADERS.length);
  var values = range.getValues();
  var formulas = range.getFormulas();
  var fixed = 0;
  for (var i = 0; i < values.length; i++) {
    var v = values[i], f = formulas[i], r = i + 2;
    var shifted = !/^=IMAGE/i.test(f[3]) && v[3] !== '' && v[11] === '' && /^=HYPERLINK/i.test(f[10]);
    if (!shifted) continue;
    var screenshotFormula = f[10];
    sheet.getRange(r, 4, 1, 9).setValues([[
      '',                      // D  Item (picture not available for this order)
      safe_(v[3]),             // E  Product
      safe_(v[4]),             // F  Size
      Number(v[5]) || 0,       // G  Amount
      safe_(v[6]),             // H  Name
      String(v[7]),            // I  Mobile
      '',                      // J  WhatsApp (formula below)
      safe_(v[9]),             // K  UTR
      ''                       // L  Screenshot (formula below)
    ]]);
    sheet.getRange(r, COL.WHATSAPP).setFormula('=HYPERLINK("https://wa.me/91"&I' + r + ',"Chat")');
    sheet.getRange(r, COL.SCREENSHOT).setFormula(screenshotFormula);
    fixed++;
  }
  return fixed;
}

/** The picture address for a product id, or '' when it cannot be built safely. */
function pictureUrl_(productId, websiteUrl) {
  var id = String(productId || '');
  var base = String(PICTURE_BASE || '').replace(/\/+$/, '');
  if (base && /^https:\/\/[A-Za-z0-9.\-_\/]+$/.test(base) && /^[a-z0-9\-]+$/.test(id)) {
    return base + '/' + id + '.jpg';
  }
  // No PICTURE_BASE set: accept the address the website sent, but only from an https /order-thumbs/ path
  var url = String(websiteUrl || '');
  return /^https:\/\/[A-Za-z0-9.\-]+\/order-thumbs\/[a-z0-9\-]+\.jpg$/.test(url) ? url : '';
}

/** Adds the Item picture to rows that have none, by looking up the product name. Existing pictures are kept. */
function addMissingPictures_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var range = sheet.getRange(2, 1, last - 1, HEADERS.length);
  var values = range.getValues();
  var formulas = range.getFormulas();
  var added = 0;
  for (var i = 0; i < values.length; i++) {
    if (formulas[i][COL.ITEM - 1] !== '' || values[i][COL.ITEM - 1] !== '') continue;
    var url = pictureUrl_(PRODUCT_IDS[String(values[i][4])], '');
    if (!url) continue;
    sheet.getRange(i + 2, COL.ITEM).setFormula('=IMAGE("' + url + '")');
    sheet.setRowHeight(i + 2, ROW_HEIGHT_WITH_PICTURE);
    added++;
  }
  return added;
}

/** Health check: opening the web app URL in a browser shows this. */
function doGet() {
  return json_({ ok: true, service: 'chillcom-orders' });
}

/** Called by the website's server for each new order. */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || data.secret !== secret) return json_({ ok: false, error: 'unauthorized' });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      return json_(saveOrder_(data));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: 'server', detail: String(err) });
  }
}

function saveOrder_(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { ok: false, error: 'no-sheet' };

  var mobile = String(data.mobile || '');
  var proof = data.proof || {};
  if (!/^[6-9]\d{9}$/.test(mobile) || !proof.base64) return { ok: false, error: 'bad-request' };

  // Rate limit: too many recent orders from this mobile number
  var last = sheet.getLastRow();
  if (last > 1) {
    var from = Math.max(2, last - 40);
    var recent = sheet.getRange(from, 1, last - from + 1, HEADERS.length).getValues();
    var since = Date.now() - RATE_WINDOW_MS;
    var count = recent.filter(function (row) {
      return String(row[8]) === mobile && row[1] instanceof Date && row[1].getTime() >= since;
    }).length;
    if (count >= RATE_LIMIT) return { ok: false, error: 'rate' };
  }

  var props = PropertiesService.getScriptProperties();
  var orderNo = Number(props.getProperty('ORDER_NO') || '0') + 1;
  var code = 'CC-' + ('0000' + orderNo).slice(-4);

  var blob = Utilities.newBlob(Utilities.base64Decode(proof.base64), proof.mimeType || 'image/jpeg', code + '-payment.' + (proof.ext || 'jpg'));
  var file = getFolder_().createFile(blob);

  try {
    sheet.appendRow([
      code,
      new Date(),
      'pending',
      '',
      safe_(data.productName),
      safe_(data.size),
      Number(data.amount) || 0,
      safe_(data.name),
      mobile,
      '',
      /^\d+$/.test(String(data.utr || '')) ? "'" + data.utr : safe_(data.utr),   // digits-only IDs stay text (no 4.1E+11)
      ''
    ]);
    var row = sheet.getLastRow();
    sheet.getRange(row, 2).setNumberFormat('dd mmm yyyy, hh:mm');
    sheet.getRange(row, COL.WHATSAPP).setFormula('=HYPERLINK("https://wa.me/91"&I' + row + ',"Chat")');
    sheet.getRange(row, COL.SCREENSHOT).setFormula('=HYPERLINK("' + file.getUrl() + '","Open")');

    // Picture of what was ordered (only from our own website's /order-thumbs/ folder; a missing picture never blocks the order)
    var imageUrl = pictureUrl_(data.productId, data.imageUrl);
    if (imageUrl) {
      sheet.getRange(row, COL.ITEM).setFormula('=IMAGE("' + imageUrl + '")');
      sheet.setRowHeight(row, ROW_HEIGHT_WITH_PICTURE);
    }
  } catch (err) {
    file.setTrashed(true); // do not leave an orphan screenshot behind
    throw err;
  }

  props.setProperty('ORDER_NO', String(orderNo)); // only after the row is safely written
  return { ok: true, orderCode: code };
}

/** Stops customer text from being read as a spreadsheet formula (= + - @ at the start). */
function safe_(value) {
  var text = value === undefined || value === null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function getFolder_() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
