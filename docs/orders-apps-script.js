/**
 * House of Charly — order recorder & tracker
 * ===========================================================================
 * Every order placed on houseofcharly.com is written into an "Orders" tab in
 * this spreadsheet — newest at the top — and emailed to you. The tab doubles as
 * your fulfilment board: a Status dropdown plus courier and tracking columns
 * you fill in as the parcel moves.
 *
 * Free. No servers, no third parties, no monthly cost.
 *
 * ---------------------------------------------------------------------------
 * SETUP (about 5 minutes)
 *
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Delete anything in the editor and paste this whole file
 *  3. Set NOTIFY_EMAIL below to your address
 *  4. (Recommended) Set SHARED_SECRET below to any random text, and set the
 *     same value as ORDERS_WEBHOOK_SECRET in Netlify. Without it, anyone who
 *     learns your /exec URL can post fake orders into your sheet.
 *  5. Save, then in the editor's function dropdown choose `setupOrdersSheet`
 *     and click ▶ Run. Authorise when asked. This creates and formats the tab.
 *  6. Deploy → New deployment → type "Web app"
 *       Execute as:      Me
 *       Who has access:  Anyone        ← this exact wording. See the warning.
 *     Deploy, then copy the /exec URL
 *  7. In Netlify → Environment variables add:
 *       ORDERS_WEBHOOK_URL    = <that /exec URL>
 *       ORDERS_WEBHOOK_SECRET = <the same secret from step 4>
 *     then Deploys → Trigger deploy → Clear cache and deploy site
 *  8. Run the `testOrder` function once to check the row and email look right.
 *
 * ⚠️  "Who has access: Anyone" is the step people get wrong. The website posts
 *     anonymously — it has no Google login. If you pick "Anyone with a Google
 *     account", every order is silently rejected and you won't find out until
 *     one goes missing. That is what SHARED_SECRET is for: the endpoint has to
 *     be publicly reachable, so the secret is what keeps strangers out.
 *
 * ---------------------------------------------------------------------------
 * AFTER DEPLOYING — re-deploying when you edit this file
 *
 * Apps Script serves the version you deployed, not the version you last saved.
 * After editing, do Deploy → Manage deployments → ✏️ → Version: New version →
 * Deploy. The /exec URL stays the same.
 * ========================================================================= */

/** Where order emails go. Comma-separate for several recipients. */
var NOTIFY_EMAIL = "Official@houseofcharly.com";

/** Must match ORDERS_WEBHOOK_SECRET in Netlify. Empty = no check (not advised). */
var SHARED_SECRET = "";

var TAB = "Orders";

/** The fulfilment workflow. Edit freely — the dropdown and the colours follow. */
var STATUSES = ["New", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

var STATUS_COLOURS = {
  "New":       "#FFF1C2",
  "Confirmed": "#DDEBFF",
  "Packed":    "#E4DAF7",
  "Shipped":   "#D6ECFB",
  "Delivered": "#D9F2DF",
  "Cancelled": "#F8D8D4",
  "Returned":  "#F3E1CE"
};

var COURIERS = ["Delhivery", "Blue Dart", "DTDC", "India Post", "Ekart", "Xpressbees", "Shiprocket", "Self / Local"];

/**
 * The sheet's shape, in one place — so a new column can never be added to the
 * header list but forgotten in the row builder. They are the same list.
 *
 *   value  : how to fill it from an incoming order. Omitted = you fill it in.
 *   update : true if a repeat POST for the same ref may overwrite it. This is
 *            what protects your typing: a re-sent order refreshes the payment
 *            fields but never wipes the Status or tracking you entered.
 */
var COLS = [
  { key: "placedAt",   label: "Placed",         width: 145, format: "dd-MMM-yy  hh:mm AM/PM",
    value: function (o) { return o.placedAt ? new Date(o.placedAt) : new Date(); } },

  { key: "ref",        label: "Order Ref",      width: 155, format: "@",
    value: function (o) { return o.ref || ""; } },

  { key: "status",     label: "Status",         width: 110,
    value: function () { return "New"; } },

  { key: "name",       label: "Customer",       width: 160, format: "@",
    value: function (o) { return cust_(o).name; } },

  // Text format, or Sheets will happily turn a phone number into 9.87654e+09
  { key: "phone",      label: "Phone",          width: 120, format: "@",
    value: function (o) { return cust_(o).phone; } },

  { key: "address",    label: "Address",        width: 240, wrap: true, format: "@",
    value: function (o) { return cust_(o).address; } },

  { key: "city",       label: "City",           width: 100, format: "@",
    value: function (o) { return cust_(o).city; } },

  { key: "pin",        label: "PIN",            width: 75,  format: "@",
    value: function (o) { return cust_(o).pin; } },

  { key: "items",      label: "Items",          width: 300, wrap: true,
    value: function (o) { return itemLines_(o).join("\n"); } },

  { key: "qty",        label: "Qty",            width: 55,
    value: function (o) { return totalQty_(o); } },

  { key: "subtotal",   label: "Subtotal",       width: 90,  format: '"₹"#,##0',
    value: function (o) { return num_(o.subtotal); } },

  { key: "shipping",   label: "Delivery",       width: 85,  format: '"₹"#,##0',
    value: function (o) { return num_(o.shipping); } },

  { key: "total",      label: "Total",          width: 100, format: '"₹"#,##0', bold: true,
    value: function (o) { return num_(o.total); } },

  { key: "payment",    label: "Payment",        width: 125, format: "@", update: true,
    value: function (o) { return paymentLabel_(o); } },

  { key: "payStatus",  label: "Paid?",          width: 80,  format: "@", update: true,
    value: function (o) { return o.paymentStatus === "paid" ? "PAID" : "PENDING"; } },

  { key: "custNote",   label: "Customer Notes", width: 200, wrap: true, format: "@",
    value: function (o) { return cust_(o).note; } },

  /* ---- you fill these in as the parcel moves ---- */
  { key: "courier",    label: "Courier",        width: 115 },
  { key: "tracking",   label: "Tracking No",    width: 150, format: "@" },
  { key: "dispatched", label: "Dispatched On",  width: 115, format: "dd-MMM-yy" },
  { key: "delivered",  label: "Delivered On",   width: 115, format: "dd-MMM-yy" },
  { key: "ownNote",    label: "Internal Notes", width: 220, wrap: true },

  /* ---- reference ---- */
  { key: "rzpOrder",   label: "Razorpay Order", width: 170, format: "@", update: true,
    value: function (o) { return o.razorpayOrderId || ""; } },

  { key: "rzpPayment", label: "Razorpay Payment", width: 170, format: "@", update: true,
    value: function (o) { return o.razorpayPaymentId || ""; } },

  { key: "updatedAt",  label: "Last Updated",   width: 145, format: "dd-MMM-yy  hh:mm AM/PM", update: true,
    value: function () { return new Date(); } }
];

/* ========================== incoming order ============================== */

function doPost(e) {
  /* Orders can land at the same instant. Without a lock, two runs both insert
     at row 2 and one overwrites the other — a silently lost order. */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    console.error("Could not acquire lock: " + lockErr);
    return json_({ ok: false, error: "busy" });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) return json_({ ok: false, error: "empty request" });

    var o = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && o.secret !== SHARED_SECRET) {
      console.warn("Rejected a post with a bad or missing secret. Ref: " + (o.ref || "(none)"));
      return json_({ ok: false, error: "unauthorised" });
    }

    var sheet = getOrdersSheet_();
    var existingRow = findRowByRef_(sheet, o.ref);
    var wasUpdate = false;

    if (existingRow) {
      // Same order arriving twice — e.g. the browser retried the payment
      // confirmation. Refresh the payment columns, leave your work alone.
      updateRow_(sheet, existingRow, o);
      wasUpdate = true;
    } else {
      insertOrderAtTop_(sheet, o);
    }

    // Email must never be the reason an order fails to be written down.
    try {
      if (NOTIFY_EMAIL) sendEmail_(o, wasUpdate);
    } catch (mailErr) {
      console.error("Order was saved, but the email failed: " + mailErr);
    }

    return json_({ ok: true, ref: o.ref || "", updated: wasUpdate });
  } catch (err) {
    /* Return 200 with ok:false rather than throwing. The customer has already
       placed the order; the storefront must never be told it failed because a
       spreadsheet hiccuped. The site logs the full order when a channel fails,
       so nothing is lost. */
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Visiting the /exec URL in a browser — a quick "is this thing on?" check. */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB);
  return json_({
    ok: true,
    service: "House of Charly order recorder",
    tabExists: Boolean(sheet),
    orders: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0,
    secretRequired: Boolean(SHARED_SECRET)
  });
}

/* ============================ writing rows ============================== */

function insertOrderAtTop_(sheet, o) {
  // Row 2, directly under the frozen header: newest order always in view.
  sheet.insertRowBefore(2);
  var row = sheet.getRange(2, 1, 1, COLS.length);

  var values = COLS.map(function (c) { return c.value ? c.value(o) : ""; });
  row.setValues([values]);

  // An inserted row inherits formatting inconsistently, so state it explicitly.
  applyRowFormat_(sheet, 2);
}

function updateRow_(sheet, rowIndex, o) {
  COLS.forEach(function (c, i) {
    if (!c.update || !c.value) return;
    sheet.getRange(rowIndex, i + 1).setValue(c.value(o));
  });
}

function applyRowFormat_(sheet, rowIndex) {
  COLS.forEach(function (c, i) {
    var cell = sheet.getRange(rowIndex, i + 1);
    if (c.format) cell.setNumberFormat(c.format);
    if (c.wrap) cell.setWrap(true);
    if (c.bold) cell.setFontWeight("bold");
  });
  sheet.getRange(rowIndex, colIndex_("status")).setDataValidation(listRule_(STATUSES));
  sheet.getRange(rowIndex, colIndex_("courier")).setDataValidation(listRule_(COURIERS, true));
  sheet.setRowHeight(rowIndex, 21);
}

/** Scans the ref column. Returns the 1-based row, or 0 when not found. */
function findRowByRef_(sheet, ref) {
  if (!ref) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var refs = sheet.getRange(2, colIndex_("ref"), last - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]).trim() === String(ref).trim()) return i + 2;
  }
  return 0;
}

/* ============================ tab creation ============================== */

/** Run this from the editor to create or repair the Orders tab. Safe to re-run. */
function setupOrdersSheet() {
  buildOrdersSheet_(true);
  SpreadsheetApp.getActiveSpreadsheet().toast("Orders tab is ready.", "House of Charly", 5);
}

/**
 * The per-order path. Builds the tab the first time, then gets out of the way —
 * re-applying validation and conditional formats across a growing sheet on every
 * single order costs seconds the customer would spend waiting at checkout.
 */
function getOrdersSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB);
  return sheet ? sheet : buildOrdersSheet_(true);
}

function buildOrdersSheet_(applyRules) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  /* Dates are stored as real dates so they sort and filter properly, which
     means they render in the spreadsheet's timezone. Pin it to IST or every
     order will read hours off. Change under File → Settings if you disagree. */
  if (ss.getSpreadsheetTimeZone() !== "Asia/Kolkata") ss.setSpreadsheetTimeZone("Asia/Kolkata");

  var labels = COLS.map(function (c) { return c.label; });

  var sheet = ss.getSheetByName(TAB);
  var fresh = false;

  /* An Orders tab from an earlier version of this script has different columns
     in a different order — its "Payment Method" sits where "Status" now lives.
     Rewriting the header over the top would leave every existing row quietly
     mislabelled, with "cod" showing as an order status. Move the old tab aside
     instead: nothing is deleted, and the history stays readable. */
  if (sheet && sheet.getLastRow() > 0) {
    var firstHeader = String(sheet.getRange(1, 1).getValue()).trim();
    if (firstHeader && firstHeader !== labels[0]) {
      if (sheet.getLastRow() > 1) {
        var stamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yy HHmm");
        sheet.setName(TAB + " (old " + stamp + ")");
        sheet = null;                       // fall through and build a clean one
      } else {
        sheet.clear();                      // header-only: nothing worth keeping
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(TAB, 0);   // first tab — this is the one you live in
    fresh = true;
  }

  // Header: rewritten every time, so adding a column above just works.
  var header = sheet.getRange(1, 1, 1, COLS.length);
  header.setValues([labels])
    .setFontWeight("bold")
    .setFontSize(10)
    .setBackground("#14100E")
    .setFontColor("#FFFFFF")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);        // keep Placed / Ref / Status visible while scrolling

  if (fresh || applyRules) {
    COLS.forEach(function (c, i) { if (c.width) sheet.setColumnWidth(i + 1, c.width); });
  }
  if (fresh && sheet.getMaxColumns() > COLS.length) {
    // Only on a brand-new tab. Later on, a spare column is far more likely to
    // be something you added on purpose than leftover blank space.
    sheet.deleteColumns(COLS.length + 1, sheet.getMaxColumns() - COLS.length);
  }

  if (fresh || applyRules) applyColumnRules_(sheet);
  return sheet;
}

/** Dropdowns and status colours, applied down the whole column. */
function applyColumnRules_(sheet) {
  var rows = Math.max(sheet.getMaxRows() - 1, 1);

  sheet.getRange(2, colIndex_("status"), rows, 1).setDataValidation(listRule_(STATUSES));
  sheet.getRange(2, colIndex_("courier"), rows, 1).setDataValidation(listRule_(COURIERS, true));

  // Colour the whole row by status — scannable at a glance from across a shop.
  var wholeRows = sheet.getRange(2, 1, rows, COLS.length);
  var statusA1 = "$" + columnLetter_(colIndex_("status")) + "2";
  var rules = STATUSES.map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=' + statusA1 + '="' + s + '"')
      .setBackground(STATUS_COLOURS[s] || "#FFFFFF")
      .setRanges([wholeRows])
      .build();
  });
  sheet.setConditionalFormatRules(rules);

  sheet.getRange(2, colIndex_("status"), rows, 1).setHorizontalAlignment("center");
}

/* ================================ email ================================= */

function sendEmail_(o, wasUpdate) {
  var c = cust_(o);
  var subject = (wasUpdate ? "Order updated " : "New order ") + (o.ref || "") +
                " — ₹" + num_(o.total) + (o.paymentMethod === "cod" ? " (COD)" : " (paid)");

  var itemsHtml = itemLines_(o).map(function (l) {
    return '<tr><td style="padding:4px 0;border-bottom:1px solid #eee">' + escape_(l) + "</td></tr>";
  }).join("");

  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px">' +
      '<div style="background:#14100E;color:#fff;padding:16px 20px">' +
        '<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#C9BEB1">' +
          (wasUpdate ? "Order updated" : "New order") + "</div>" +
        '<div style="font-size:22px;margin-top:3px">' + escape_(o.ref || "") + "</div>" +
      "</div>" +
      '<div style="padding:18px 20px;border:1px solid #e7e2da;border-top:none">' +
        '<p style="margin:0;font-size:24px;font-weight:600">₹' + num_(o.total) + "</p>" +
        '<p style="margin:2px 0 16px;color:#6b6560;font-size:14px">' + escape_(paymentLabel_(o)) + "</p>" +
        '<p style="margin:0 0 16px;line-height:1.6"><b>' + escape_(c.name) + "</b><br>" +
          '<a href="tel:' + escape_(c.phone) + '">' + escape_(c.phone) + "</a><br>" +
          escape_([c.address, c.city, c.pin].filter(String).join(", ")) +
          (c.note ? '<br><span style="color:#6b6560">Notes: ' + escape_(c.note) + "</span>" : "") +
        "</p>" +
        '<table style="width:100%;border-collapse:collapse;font-size:14px">' + itemsHtml + "</table>" +
        '<p style="margin:14px 0 0;font-size:14px">Subtotal ₹' + num_(o.subtotal) +
          " · Delivery " + (num_(o.shipping) ? "₹" + num_(o.shipping) : "FREE") + "</p>" +
        '<p style="margin:18px 0 0"><a href="' + sheetUrl + '" ' +
          'style="background:#14100E;color:#fff;padding:10px 18px;text-decoration:none;' +
          'display:inline-block;font-size:14px">Open the Orders sheet</a></p>' +
      "</div>" +
    "</div>";

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: plainText_(o, wasUpdate, sheetUrl),   // fallback for plain-text clients
    htmlBody: html
  });
}

function plainText_(o, wasUpdate, sheetUrl) {
  var c = cust_(o);
  return [
    (wasUpdate ? "ORDER UPDATED " : "NEW ORDER ") + (o.ref || ""),
    "",
    "Total: ₹" + num_(o.total),
    "Payment: " + paymentLabel_(o),
    "",
    "Customer: " + c.name,
    "Phone: " + c.phone,
    "Address: " + [c.address, c.city, c.pin].filter(String).join(", "),
    c.note ? "Notes: " + c.note : "",
    "",
    "Items:",
    itemLines_(o).join("\n"),
    "",
    "Subtotal ₹" + num_(o.subtotal) + " · Delivery ₹" + num_(o.shipping),
    "",
    sheetUrl
  ].filter(function (l) { return l !== ""; }).join("\n");
}

/* =============================== helpers ================================ */

function cust_(o) {
  var c = o.customer || {};
  return {
    name: c.name || "",
    phone: c.phone || "",
    address: c.address || "",
    city: c.city || "",
    pin: c.pin || "",
    note: c.note || ""
  };
}

function itemLines_(o) {
  return (o.lines || []).map(function (l) {
    return l.name + " (" + l.sku + ") ×" + l.qty + " = ₹" + num_(l.lineTotal);
  });
}

function totalQty_(o) {
  return (o.lines || []).reduce(function (n, l) { return n + (Number(l.qty) || 0); }, 0);
}

function paymentLabel_(o) {
  if (o.paymentMethod === "cod") return "Cash on Delivery";
  if (o.paymentStatus === "paid") return "Paid — Razorpay";
  return (o.paymentMethod || "?") + " / " + (o.paymentStatus || "?");
}

function num_(v) { return Number(v) || 0; }

function escape_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colIndex_(key) {
  for (var i = 0; i < COLS.length; i++) if (COLS[i].key === key) return i + 1;
  throw new Error("Unknown column: " + key);
}

function columnLetter_(index) {
  var s = "";
  while (index > 0) {
    var m = (index - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    index = (index - m - 1) / 26;
  }
  return s;
}

function listRule_(values, allowOther) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(Boolean(allowOther))
    .build();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================== try it out ============================== */

/** Adds a realistic fake order. Run from the editor to check the whole thing. */
function testOrder() {
  var fake = {
    ref: "HOC-TEST" + String(Date.now()).slice(-5),
    placedAt: new Date().toISOString(),
    paymentMethod: "cod",
    paymentStatus: "pending",
    secret: SHARED_SECRET,
    customer: {
      name: "Test Customer", phone: "9876543210",
      address: "Shop No. 7, TCP2, Sainik Adarsh Enclave",
      city: "Hisar", pin: "125006", note: "This is a test — delete this row."
    },
    lines: [
      { sku: "320W500G2601", name: "Kaju W-320 500g", qty: 1, price: 490, lineTotal: 490 },
      { sku: "HALDI100G", name: "Haldi-P 100g", qty: 2, price: 60, lineTotal: 120 }
    ],
    subtotal: 610, shipping: 79, total: 689
  };
  doPost({ postData: { contents: JSON.stringify(fake) } });
  SpreadsheetApp.getActiveSpreadsheet().toast("Test order added — check row 2 and your email.", "Done", 6);
}

/** Adds the House of Charly menu to the spreadsheet toolbar. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("House of Charly")
    .addItem("Set up / repair Orders tab", "setupOrdersSheet")
    .addItem("Add a test order", "testOrder")
    .addToUi();
}
