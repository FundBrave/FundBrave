/**
 * Calendar Utilities
 * Generate calendar URLs and ICS files for adding reminders
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  url?: string;
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHmmssZ format)
 */
function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Format date for Outlook Web (ISO format)
 */
function formatDateForOutlook(date: Date): string {
  return date.toISOString();
}

/**
 * Format date for Yahoo (YYYYMMDDTHHmmssZ format, same as Google)
 */
function formatDateForYahoo(date: Date): string {
  return formatDateForGoogle(date);
}

/**
 * Format date for ICS file (YYYYMMDDTHHmmssZ format)
 */
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate Google Calendar URL
 * Opens Google Calendar with pre-filled event details
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
    details: event.url
      ? `${event.description}\n\nCampaign link: ${event.url}`
      : event.description,
  });

  if (event.location) {
    params.set("location", event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Web Calendar URL
 * Opens Outlook Web with pre-filled event details
 */
export function generateOutlookWebUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: formatDateForOutlook(event.startDate),
    enddt: formatDateForOutlook(event.endDate),
    body: event.url
      ? `${event.description}<br><br>Campaign link: <a href="${event.url}">${event.url}</a>`
      : event.description,
  });

  if (event.location) {
    params.set("location", event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 * Opens Yahoo Calendar with pre-filled event details
 */
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    v: "60",
    title: event.title,
    st: formatDateForYahoo(event.startDate),
    et: formatDateForYahoo(event.endDate),
    desc: event.url
      ? `${event.description}\n\nCampaign link: ${event.url}`
      : event.description,
  });

  if (event.location) {
    params.set("in_loc", event.location);
  }

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Generate ICS file content as a Blob
 * Compatible with Apple Calendar, Outlook Desktop, and other calendar apps
 */
export function generateICSFile(event: CalendarEvent): Blob {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@fundbrave.com`;
  const now = formatDateForICS(new Date());

  const description = event.url
    ? `${event.description}\\n\\nCampaign link: ${event.url}`
    : event.description;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FundBrave//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDateForICS(event.startDate)}`,
    `DTEND:${formatDateForICS(event.endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    event.location ? `LOCATION:${escapeICSText(event.location)}` : "",
    event.url ? `URL:${event.url}` : "",
    // Add reminder 1 day before
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${escapeICSText(event.title)}`,
    "END:VALARM",
    // Add reminder 1 hour before
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${escapeICSText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

/**
 * Download ICS file
 * Triggers a download of the ICS file in the browser
 */
export function downloadICSFile(
  event: CalendarEvent,
  filename?: string
): void {
  const blob = generateICSFile(event);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_reminder.ics`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Create a reminder event from campaign data
 * Sets the reminder for 1 day before the campaign end date
 */
export function createCampaignReminderEvent(
  campaignTitle: string,
  campaignEndDate: Date,
  campaignUrl?: string,
  campaignDescription?: string
): CalendarEvent {
  // Set reminder to start at 9 AM, 1 day before campaign ends
  const reminderDate = new Date(campaignEndDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0, 0);

  // End time is 1 hour after start
  const endDate = new Date(reminderDate);
  endDate.setHours(endDate.getHours() + 1);

  return {
    title: `Donate to: ${campaignTitle}`,
    description:
      campaignDescription ||
      `This is your reminder to donate to the "${campaignTitle}" campaign before it ends!`,
    startDate: reminderDate,
    endDate: endDate,
    url: campaignUrl,
  };
}

/**
 * Open calendar based on provider
 */
export function openCalendar(
  provider: string,
  event: CalendarEvent
): void {
  switch (provider) {
    case "google":
      window.open(generateGoogleCalendarUrl(event), "_blank");
      break;
    case "outlook-web":
      window.open(generateOutlookWebUrl(event), "_blank");
      break;
    case "yahoo":
      window.open(generateYahooCalendarUrl(event), "_blank");
      break;
    case "apple":
    case "outlook":
      downloadICSFile(event);
      break;
    default:
      console.warn(`Unknown calendar provider: ${provider}`);
  }
}
