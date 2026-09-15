# The Heartians Ignite — Fresher Digital Invitation v2

## Event
- Date: 17 September 2026
- Time: 11:00 AM
- Venue: SHIMT Atrium
- Department: Computer Science
- Theme: Purple / Pink neon fresher party, inspired by the supplied poster

## User flow (V5)

1. Visitor opens the website.
2. Selects **Role**: Student, Faculty, or Administration.
3. If Student, selects **BCA1 / BCA2 / BCA3**.
4. Selects their name from the matching dropdown.
5. Clicks **Open My Invitation**.
6. The personalized invitation opens **directly** — there is no separate RSVP page.
7. The invitation-open event is sent to Google Sheets as `Viewed`.
8. The guest can choose **I'm In / Maybe / Can't Attend** directly below the invitation.
9. The RSVP updates the same guest's row in Google Sheets.
10. The guest can download the invitation card as a PDF.

## Add real names

Edit:

`data/invites.json`

Student example:

```json
{
  "id": "STU101",
  "name": "Rahul Gupta",
  "year": "BCA1"
}
```

Use `BCA1`, `BCA2`, or `BCA3` exactly.

Faculty example:

```json
{
  "id": "FAC101",
  "name": "Dr. ABC"
}
```

Administration example:

```json
{
  "id": "ADM101",
  "name": "Principal ABC"
}
```

## Run locally

Recommended:
1. Open the folder in VS Code.
2. Install **Live Server** extension.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

Do not double-click `index.html`, because browsers may block loading `data/invites.json`.

## Google Sheet RSVP setup

1. Create a Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Delete the default code.
4. Copy the full contents of `google-apps-script/Code.gs` into Apps Script.
5. Change:
   `const ORGANIZER_EMAIL = "YOUR_EMAIL@example.com";`
   to your email.
6. Save.
7. Click **Deploy → New deployment**.
8. Select **Web app**.
9. Execute as: **Me**.
10. Who has access: **Anyone**.
11. Deploy and authorize when Google asks.
12. Copy the Web App URL.
13. Open `app.js`.
14. Replace:
   `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`
   with the copied Web App URL.
15. Save and deploy the website.

The first invitation view creates an `RSVP` tab in the spreadsheet. Each invite gets one row with:
Invite ID, Role, Year, Guest Name, Viewed At, RSVP Response, RSVP At, Phone, Message, Last Event.

Opening an invitation records `Viewed`. Selecting an RSVP option updates that same row, so the sheet stays current instead of creating duplicate rows for every click.

If `ORGANIZER_EMAIL` is configured, an email is also sent for each RSVP.

## Hosting

For actual student phones, upload the whole project to a static host such as GitHub Pages, Netlify, or Vercel.

The website must contain:
- `index.html`
- `styles.css`
- `app.js`
- `data/invites.json`
- `assets/theme-poster.jpg` (reference only)

After hosting, share the main website URL. Unlike the previous version, this version does not require a query-string ID: the visitor chooses role/year/name inside the invitation.

## PDF

The invitation page includes a **Download Invitation PDF** button. It uses html2canvas + jsPDF from CDN. If those libraries are unavailable, the button falls back to the browser's Print → Save as PDF.

## Important privacy note

Only collect information you actually need. The example RSVP form makes phone optional. Avoid collecting sensitive personal information.

### PDF rendering fix
The PDF renderer now handles the CSS gradient text safely. The previous renderer could turn `background-clip:text` into large white/pink rectangles. V4 removes that renderer-specific artifact while preserving the invitation's typography, spacing and overall appearance.
