import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  listSessions,
  listMySessions,
  joinSession,
  leaveSession,
  Session,
} from "../lib/api";
import SessionCard from "../components/SessionCard";

type Tab = "discover" | "mine";

export default function HomeScreen() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(
    async (tab: Tab) => {
      if (!token) return;
      setError(null);
      try {
        const result =
          tab === "discover"
            ? await listSessions()
            : await listMySessions(token);
        setSessions(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions",
        );
      }
    },
    [token],
  );

  useEffect(() => {
    setLoading(true);
    loadSessions(activeTab).finally(() => setLoading(false));
  }, [activeTab, loadSessions]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadSessions(activeTab);
    setRefreshing(false);
  }

  async function handleCardAction(session: Session) {
    if (!token || !user) return;
    const isOwner = session.owner.id === user.id;
    const isParticipant = session.participants.some((p) => p.id === user.id);

    try {
      if (activeTab === "mine" && isOwner) {
        // Manage screen doesn't exist yet — placeholder for now.
        Alert.alert(
          "Manage session",
          "Editing/canceling sessions is coming soon.",
        );
        return;
      }

      if (activeTab === "mine" && isParticipant) {
        await leaveSession(token, session.id);
        Alert.alert("Left session", `You've left ${session.games[0]}.`);
      } else if (!isParticipant) {
        await joinSession(token, session.id);
        Alert.alert("Joined!", `You're in for ${session.games[0]}.`);
      }

      await loadSessions(activeTab);
    } catch (err) {
      Alert.alert(
        "Something went wrong",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingLabel}>Good evening,</Text>
          <Text style={styles.greetingName}>{user?.name}</Text>
        </View>
        <Pressable onPress={logout}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "discover" && styles.tabActive]}
          onPress={() => setActiveTab("discover")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "discover" && styles.tabTextActive,
            ]}
          >
            Discover
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "mine" && styles.tabActive]}
          onPress={() => setActiveTab("mine")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "mine" && styles.tabTextActive,
            ]}
          >
            Your sessions
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : sessions.length === 0 ? (
        <Text style={styles.empty}>
          {activeTab === "discover"
            ? "No upcoming sessions nearby yet."
            : "You haven't joined or hosted anything yet."}
        </Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              currentUserId={user?.id ?? ""}
              onPress={() => handleCardAction(item)}
            />
          )}
        />
      )}

      <Pressable
        style={styles.hostButton}
        onPress={() =>
          Alert.alert(
            "Host a table",
            "The create-session screen is coming soon.",
          )
        }
      >
        <Text style={styles.hostButtonText}>+ Host a table</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greetingLabel: { fontSize: 13, color: "#666" },
  greetingName: { fontSize: 18, fontWeight: "600" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#faece7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "600", color: "#993c1d" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f1efe8",
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, color: "#666" },
  tabTextActive: { fontWeight: "600", color: "#222" },
  error: { color: "#c53030", textAlign: "center", marginTop: 40 },
  empty: { color: "#999", textAlign: "center", marginTop: 40 },
  hostButton: {
    backgroundColor: "#c05621",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  hostButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
