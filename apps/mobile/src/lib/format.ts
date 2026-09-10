// Formats an ISO startTime into "Today, 7:00 pm" / "Thu, 6:30 pm" / "Sep 20, 6:30 pm"
export function formatSessionTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const timePart = date
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .toLowerCase();

  let dayPart: string;
  if (isSameDay(date, now)) {
    dayPart = "Today";
  } else if (isSameDay(date, tomorrow)) {
    dayPart = "Tomorrow";
  } else {
    const daysAway = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    dayPart =
      daysAway < 7
        ? date.toLocaleDateString(undefined, { weekday: "short" })
        : date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
  }

  return `${dayPart}, ${timePart}`;
}

// "3 of 5 joined" / "Open seating" style label
export function formatSeats(
  participantCount: number,
  maxPlayers: number,
): string {
  const seatsLeft = maxPlayers - participantCount;
  if (seatsLeft <= 0) return "Full";
  return `${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"}`;
}
