/**
 * House of Charly — order recorder
 * ---------------------------------------------------------------------------
 * Appends every order placed on the website to an "Orders" tab in this
 * spreadsheet, and emails you a copy. Free, no servers, no third parties.
 *
 * SETUP (about 3 minutes)
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Delete anything in the editor and paste this whole file
 *  3. Change NOTIFY_EMAIL below to your address
 *  4. Deploy → New deployment → type "Web app"
 *       Execute as:        Me
 *       Who has access:    Anyone            ← required, the site posts anonymously
 *     Deploy, authorise, and copy the /exec URL
 *  5. In Netlify → Environment variables add:
 *       ORDERS_WEBHOOK_URL = <that /exec URL>
 *     then Clear cache and deploy site
 *
 * The "Orders" tab is created automatically on the first order.
 */

var NOTIFY_EMAIL = "Official@houseofcharly.com";  // ← change me
var TAB = "Orders";

var HEADERS = [
  "placed_at", "ref", "payment_method", "payment_status", "total",
  "customer_name", "phone", "address", "city", "pin", "notes",
  "items", "subtotal", "shipping", "razorpay_order_id", "razorpay_payment_id"
];

function doPost(e) {
  try {
    var o = JSON.parse(e.postData.contents);
    var sheet = getOrdersSheet_();

    var items = (o.lines || [])
      .map(function (l) { return l.name + " (" + l.sku + ") x" + l.qty + " = " + l.lineTotal; })
      .join("\n");

    var cust = o.customer || {};
    sheet.appendRow([
      o.placedAt || new Date().toISOString(),
      o.ref || "",
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.total || 0,
      cust.name || "", cust.phone || "", cust.address || "", cust.city || "", cust.pin || "", cust.note || "",
      items, o.subtotal || 0, o.shipping || 0,
      o.razorpayOrderId || "", o.razorpayPaymentId || ""
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New order " + (o.ref || "") + " — Rs " + (o.total || 0) +
                 " (" + (o.paymentMethod || "") + ")",
        body:
          "Ref: " + (o.ref || "") + "\n" +
          "Payment: " + (o.paymentMethod || "") + " / " + (o.paymentStatus || "") + "\n" +
          "Total: Rs " + (o.total || 0) + "\n\n" +
          "Customer: " + (cust.name || "") + "\n" +
          "Phone: " + (cust.phone || "") + "\n" +
          "Address: " + (cust.address || "") + ", " + (cust.city || "") + " " + (cust.pin || "") + "\n" +
          (cust.note ? "Notes: " + cust.note + "\n" : "") + "\n" +
          "Items:\n" + items
      });
    }

    return json_({ ok: true });
  } catch (err) {
    // Log and still return 200 — the customer has already paid; never make the
    // storefront think the order failed because a spreadsheet hiccuped.
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

function getOrdersSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB);
  if (!sheet) {
    sheet = ss.insertSheet(TAB);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
