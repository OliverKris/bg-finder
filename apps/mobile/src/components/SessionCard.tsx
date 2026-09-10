import { View, Text, Pressable, StyleSheet } from "react-native";
import { Session } from "../lib/api";
import { formatSessionTime, formatSeats } from "../lib/format";

interface SessionCardProps {
  session: Session;
  currentUserId: string;
  onPress: () => void;
}

export default function SessionCard({
  session,
  currentUserId,
  onPress,
}: SessionCardProps) {
  const isOwner = session.owner.id === currentUserId;
  const isMineTab = session.participants.some((p) => p.id === currentUserId);

  // Badge logic: on "Your sessions" we show relationship (Hosting/Joined);
  // on Discover we show seats remaining, since that's what a browser cares about.
  const badge = isMineTab
    ? isOwner
      ? { text: "Hosting", color: styles.badgeViolet }
      : { text: "Joined", color: styles.badgeBlue }
    : {
        text: formatSeats(session.participants.length, session.maxPlayers),
        color: styles.badgeGreen,
      };

  const actionLabel = isMineTab ? (isOwner ? "Manage" : "Leave") : "View";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {session.games.join(" · ")}
          </Text>
          <Text style={styles.subtitle}>
            {formatSessionTime(session.startTime)} · {session.location}
          </Text>
        </View>
        <View style={[styles.badge, badge.color]}>
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>
          {isMineTab && !isOwner
            ? `Hosted by ${session.owner.name}`
            : `${session.participants.length} of ${session.maxPlayers} joined`}
        </Text>
        <Pressable style={styles.actionButton} onPress={onPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontWeight: "600", fontSize: 15, marginBottom: 2 },
  subtitle: { fontSize: 13, color: "#666" },
  badge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 10 },
  badgeGreen: { backgroundColor: "#e6f4ea" },
  badgeBlue: { backgroundColor: "#e6f1fb" },
  badgeViolet: { backgroundColor: "#eeedfe" },
  badgeText: { fontSize: 12, fontWeight: "500" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  meta: { fontSize: 12, color: "#999" },
  actionButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  actionText: { fontSize: 13, fontWeight: "500" },
});
