const SHEET_NAME = "RSVP";
const ORGANIZER_EMAIL = "vaishshashank93@gmail.com.com";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ok:true, service:"The Heartians Ignite RSVP"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const headers = [
      "Invite ID", "Role", "Year", "Guest Name", "Viewed At",
      "RSVP Response", "RSVP At", "Phone", "Message", "Last Event"
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }

    // Find the guest's existing row by unique Invite ID.
    const lastRow = sheet.getLastRow();
    const idValues = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
      : [];
    const rowIndex = idValues.findIndex(id => String(id) === String(payload.inviteId)) + 2;

    if (payload.action === "view") {
      const viewedAt = new Date();

      if (rowIndex >= 2) {
        // Refresh guest identity and record latest view.
        sheet.getRange(rowIndex, 1, 1, 5).setValues([[
          payload.inviteId || "",
          payload.guestType || "",
          payload.year || "",
          payload.guestName || "",
          viewedAt
        ]]);
        sheet.getRange(rowIndex, 10).setValue("Viewed");
      } else {
        sheet.appendRow([
          payload.inviteId || "",
          payload.guestType || "",
          payload.year || "",
          payload.guestName || "",
          viewedAt,
          "",
          "",
          "",
          "",
          "Viewed"
        ]);
      }
    }

    if (payload.action === "rsvp") {
      const now = new Date();

      if (rowIndex >= 2) {
        // Update the same row instead of creating duplicate RSVP rows.
        sheet.getRange(rowIndex, 1, 1, 10).setValues([[
          payload.inviteId || "",
          payload.guestType || "",
          payload.year || "",
          payload.guestName || "",
          sheet.getRange(rowIndex, 5).getValue() || now,
          payload.response || "",
          now,
          payload.phone || "",
          payload.message || "",
          "RSVP"
        ]]);
      } else {
        // Handles the unlikely case where the RSVP arrives before the view.
        sheet.appendRow([
          payload.inviteId || "",
          payload.guestType || "",
          payload.year || "",
          payload.guestName || "",
          now,
          payload.response || "",
          now,
          payload.phone || "",
          payload.message || "",
          "RSVP"
        ]);
      }

      if (ORGANIZER_EMAIL && !ORGANIZER_EMAIL.includes("YOUR_EMAIL")) {
        const subject = "Fresher RSVP — " + (payload.guestName || "Guest") +
                        " — " + (payload.response || "");
        const body =
          "Guest: " + (payload.guestName || "") + "\n" +
          "Invite ID: " + (payload.inviteId || "") + "\n" +
          "Role: " + (payload.guestType || "") + "\n" +
          "Year: " + (payload.year || "") + "\n" +
          "Response: " + (payload.response || "") + "\n" +
          "Phone: " + (payload.phone || "") + "\n" +
          "Message: " + (payload.message || "");
        MailApp.sendEmail(ORGANIZER_EMAIL, subject, body);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
