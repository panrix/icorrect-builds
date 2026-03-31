/**
 * 14 email templates for Monday status4 → Intercom notification emails.
 *
 * Each function takes a data object and returns an HTML string.
 * Ported verbatim from the notification docs (builds/monday/icorrect-status-notification-documentation.md).
 *
 * Corporate check: templates 3 (booking-confirmed), 5 (courier-gophr), and
 * 6 (courier-mailin) conditionally exclude Typeform links when clientType === "Corporate".
 */

const TYPEFORM_BASE = "https://form.typeform.com/to/sDieaFMs";

function typeformLink(itemId, intercomId) {
  return `${TYPEFORM_BASE}#monday_item_id=${itemId}&conversation_id=${intercomId}`;
}

function trackingLink(tracking) {
  const clean = (tracking || "").replace(/ /g, "");
  return `https://www.royalmail.com/track-your-item#/tracking-results/${clean}`;
}

// 1. Received — Walk-In
function receivedWalkin({ contactFirstName }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Thank you for dropping off your device with iCorrect.</p>
<p>Your device will be pre-tested and then join our repair queue - we will contact you before proceeding with our repair if we find any additional faults.</p>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
}

// 2. Received — Remote (Mail-In / Gophr)
function receivedRemote({ contactFirstName }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Thank you for sending your device for repair with iCorrect.</p>
<p>Your device will be pre-tested and then join our repair queue - we will contact you before proceeding with our repair if we find any additional faults.</p>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
}

// 3. Booking Confirmed — Standard
function bookingConfirmed({ contactFirstName, formattedBooking, itemId, intercomId, clientType }) {
  const isCorporate = clientType === "Corporate";
  let body = `<p>Hi ${contactFirstName},</p>
<p>Your appointment with iCorrect is booked for ${formattedBooking}. Please give your name at reception on arrival.</p>`;
  if (!isCorporate) {
    body += `<p>To help us prepare and make your appointment as smooth as possible, please complete this short questionnaire about your device: <a href="${typeformLink(itemId, intercomId)}">${typeformLink(itemId, intercomId)}</a></p>`;
  }
  body += `<p>If you haven't already paid online, we will take payment during your appointment. We accept card (including AMEX) and cash.</p>
<p>Thank you for choosing us for your repair, we look forward to seeing you.</p>
<p>Kind regards,</p>`;
  return body;
}

// 4. Booking Confirmed — Warranty
function bookingConfirmedWarranty({ contactFirstName, formattedBooking }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Your warranty appointment with iCorrect is booked for ${formattedBooking}. Please give your name at reception on arrival.</p>
<p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
}

// 5. Courier Booked — Gophr
function courierGophr({ contactFirstName, gophrLink, gophrTimeWindow, itemId, intercomId, clientType }) {
  const isCorporate = clientType === "Corporate";
  let body = `<p>Hi ${contactFirstName},</p>
<p>Your courier has now been arranged.</p>
<p>You can track your collection here: <a href="${gophrLink}">${gophrLink}</a></p>
<p>Your collection time window is: ${gophrTimeWindow}</p>`;
  if (!isCorporate) {
    body += `<p>IMPORTANT! There is essential information we need before we can begin your repair. Please complete this form before your device arrives:<br><a href="${typeformLink(itemId, intercomId)}">${typeformLink(itemId, intercomId)}</a></p>`;
  }
  body += `<p>If you have any questions, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
  return body;
}

// 6. Courier Booked — Mail-In Standard
function courierMailin({ contactFirstName, outboundTracking, itemId, intercomId, clientType }) {
  const isCorporate = clientType === "Corporate";
  let body = `<p>Hi ${contactFirstName},</p>
<p>Your packaging has been shipped via Royal Mail Tracked 24. Your delivery can be tracked using this link:<br><a href="${trackingLink(outboundTracking)}">${trackingLink(outboundTracking)}</a></p>
<p>When your packaging arrives, please follow these steps:</p>
<ol>
<li>Cover the shipping label on the box with the label included.</li>
<li>Place your device inside the inflated sleeve. Do not include any accessories, such as chargers, cases, bags.</li>
<li>Tape the box shut.</li>
</ol>
<p>You can drop your package at a Post Office or Parcelshop, or reply to this email to arrange a collection. Requests must be made before 4pm for next-day collections.</p>`;
  if (!isCorporate) {
    body += `<p>IMPORTANT: There is essential information we need before we can begin your repair. Please complete this form before your device arrives: <a href="${typeformLink(itemId, intercomId)}">${typeformLink(itemId, intercomId)}</a></p>`;
  }
  body += `<p>If you have any questions, just let us know.</p>
<p>Kind regards,</p>`;
  return body;
}

// 7. Courier Booked — Mail-In Warranty
function courierWarranty({ contactFirstName, outboundTracking }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Your packaging has been shipped via Royal Mail Tracked 24. Your delivery can be tracked using this link:<br><a href="${trackingLink(outboundTracking)}">${trackingLink(outboundTracking)}</a></p>
<p>When your packaging arrives, please follow these steps:</p>
<ol>
<li>Cover the shipping label on the box with the label included.</li>
<li>Place your device inside the inflated sleeve. Do not include any accessories, such as chargers, cases, bags.</li>
<li>Tape the box shut.</li>
</ol>
<p>You can drop your package at a Post Office or Parcelshop, or reply to this email to arrange a collection. Requests must be made before 4pm for next-day collections.</p>
<p>If you have any questions, just let us know.</p>
<p>Kind regards,</p>`;
}

// 8. Ready To Collect — Standard
function readyWalkin({ contactFirstName }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Thank you for arranging your repair with iCorrect. Your repair has been completed and your device is ready for collection.</p>
<p>Our collection opening hours are:</p>
<ul>
<li>Monday – Thursday: 9:30am - 5:30pm</li>
<li>Friday: 10am - 5:30pm</li>
</ul>
<p>Kind regards,</p>`;
}

// 9. Ready To Collect — Warranty
function readyWarranty({ contactFirstName }) {
  return `<p>Hi ${contactFirstName},</p>
<p>We have completed your warranty repair and your device is ready for collection.</p>
<p>Our collection opening hours are:</p>
<ul>
<li>Monday – Thursday: 9:30am - 5:30pm</li>
<li>Friday: 10am - 5:30pm</li>
</ul>
<p>Kind regards,</p>`;
}

// 10. Password Request — With Passcode
function passwordRequest({ contactFirstName, passcode }) {
  return `<p>Hi ${contactFirstName},</p>
<p>We are unable to unlock your device using the login information that you have provided: "${passcode}"</p>
<p>Could you please let us know if we have recorded your password incorrectly, or if you have another password that we could try?</p>
<p>If you prefer not to provide this information through email, please call us on 02070998517.</p>
<p>Kind regards,</p>`;
}

// 11. Password Request — No Passcode
function passwordRequestEmpty({ contactFirstName }) {
  return `<p>Hi ${contactFirstName},</p>
<p>We need to unlock your device in order to fully test it before and after our repair and currently don't have any login information.</p>
<p>Please could you reply to this email or call us on 02070998517 to provide your password, or let us know if you are unable to provide access to your device.</p>
<p>Kind regards,</p>`;
}

// 12. Return Courier — Standard
function returnCourier({ contactFirstName, outboundTracking }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Thank you for arranging your repair with iCorrect - your device is on the way back to you, please use the link below to track your delivery:</p>
<p><a href="${trackingLink(outboundTracking)}">${trackingLink(outboundTracking)}</a></p>
<p>Kind regards,</p>`;
}

// 13. Return Courier — Warranty
function returnCourierWarranty({ contactFirstName, outboundTracking }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Your warranty repair has been completed and we have arranged for your device to be delivered back to you via Royal Mail.</p>
<p>To view the tracking information, please use the following link:</p>
<p><a href="${trackingLink(outboundTracking)}">${trackingLink(outboundTracking)}</a></p>
<p>Should you have any problems with the delivery, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
}

// 14. Return Courier — Gophr
function returnCourierGophr({ contactFirstName, gophrLink, gophrTimeWindow }) {
  return `<p>Hi ${contactFirstName},</p>
<p>Your repair has been completed and your device is on the way back to you via courier.</p>
<p>You can track your delivery here: <a href="${gophrLink}">${gophrLink}</a></p>
<p>Your delivery time window is: ${gophrTimeWindow}</p>
<p>Should you have any problems with the delivery, please don't hesitate to contact us.</p>
<p>Kind regards,</p>`;
}

// Map webhookType → template function
const TEMPLATES = {
  "received-walkin": receivedWalkin,
  "received-remote": receivedRemote,
  "booking-confirmed": bookingConfirmed,
  "booking-confirmed-warranty": bookingConfirmedWarranty,
  "courier-gophr": courierGophr,
  "courier-mailin": courierMailin,
  "courier-warranty": courierWarranty,
  "ready-walkin": readyWalkin,
  "ready-warranty": readyWarranty,
  "password-request": passwordRequest,
  "password-request-empty": passwordRequestEmpty,
  "return-courier": returnCourier,
  "return-courier-warranty": returnCourierWarranty,
  "return-courier-gophr": returnCourierGophr,
};

module.exports = { TEMPLATES };
