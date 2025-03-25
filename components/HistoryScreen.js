import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  Pressable,
  Animated,
} from "react-native";
import { auth } from "../firebaseConfig";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import BarChart from "./BarChart"; 

const db = getFirestore();

/* ---------- Helper Functions ---------- */

// Format an array of stock objects to a string.
const formatStockLengths = (stocks = []) =>
  stocks
    .map((stock) => `${stock.length || 0} (x${stock.quantity || 1})`)
    .join(", ");

// Format an array of desired cuttings to a string.
const formatDesiredCuttings = (cuttings = []) =>
  cuttings
    .map((cutting) => `${cutting.length || 0} (x${cutting.quantity || 1})`)
    .join(", ");

// Format cutting plans to a string.
const formatCuttingPlans = (plans = []) =>
  plans
    .map(
      (plan) =>
        `• Stock: ${plan.stock || "None"}, Cuttings: [${
          plan.cutting ? plan.cutting.join(", ") : "None"
        }], Remaining: ${plan.remaining || 0}`
    )
    .join("\n");

/*
  Group reports by project name.
  Returns an array where each section includes:
    - project: the project name.
    - createdAt: the earliest creation date.
    - data: the reports for that project.
*/
const groupReportsByProject = (reportsArray) => {
  const groups = {};
  reportsArray.forEach((report) => {
    const project = report.projectName || "Unspecified Project";
    const createdAt =
      report.createdAt && typeof report.createdAt.toDate === "function"
        ? report.createdAt.toDate()
        : new Date(report.createdAt);
    if (!groups[project]) {
      groups[project] = { project, createdAt, data: [] };
    } else {
      // Keep the earliest createdAt
      if (createdAt < groups[project].createdAt) {
        groups[project].createdAt = createdAt;
      }
    }
    groups[project].data.push(report);
  });
  const sectionArray = Object.keys(groups).map((project) => groups[project]);
  // Sort sections by the creation date (oldest first)
  sectionArray.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  return sectionArray;
};

/* ---------- ReportItem Component ---------- */
const ReportItem = ({
  item,
  deleteReport,
  styles,
  formatStockLengths,
  formatDesiredCuttings,
  formatCuttingPlans,
}) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);

  // Convert createdAt to a JavaScript Date.
  const createdAtDate =
    item.createdAt && typeof item.createdAt.toDate === "function"
      ? item.createdAt.toDate()
      : new Date(item.createdAt);
  const formattedDate = createdAtDate ? createdAtDate.toLocaleString() : "";

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          style={styles.deleteContainer}
          onPress={() =>
            Alert.alert(
              "Delete Report",
              "Are you sure you want to delete this report?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteReport(item.id),
                },
              ]
            )
          }
        >
          <Ionicons name="trash" size={24} color="white" />
        </Pressable>
      )}
      containerStyle={styles.swipeableContainer}
    >
      <Pressable onPress={toggleExpanded} style={styles.reportItem}>
        {/* Header row: show Material Type and report date */}
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.reportName}>
              {item.materialType || "No Material"}
            </Text>
          </View>
          <Text style={[styles.reportDetails, { textAlign: "right" }]}>
            {formattedDate}
          </Text>
        </View>
        {expanded && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.groupContainer}>
              <Text style={styles.sectionHeader}>Desired Cuttings</Text>
              <Text style={styles.reportText}>
                {formatDesiredCuttings(item.desiredCuttings)}
              </Text>
              <Text style={styles.sectionHeader}>Stock Lengths</Text>
              <Text style={styles.reportText}>
                {formatStockLengths(item.stockLengths)}
              </Text>
            </View>
            <View style={styles.separator} />
            <Text style={styles.sectionHeader}>Cutting Plans</Text>
            <BarChart cuttingPlans={item.cuttingPlans} />
            <View style={styles.separator} />
            <Text style={styles.sectionHeader}>Report Details</Text>
            <Text style={styles.reportText}>
              {formatCuttingPlans(item.cuttingPlans)}
              {"\n"}Unplaced Cuttings: {item.unplacedCuttings?.join(", ") || "None"}
              {"\n"}Unplaced Stocks: {item.unplacedStocks?.join(", ") || "None"}
              {"\n"}Usage Rate: {((item.usageRate || 0) * 100).toFixed(2)}%
            </Text>
          </View>
        )}
      </Pressable>
    </Swipeable>
  );
};

/* ---------- Main HistoryScreen Component ---------- */
export default function HistoryScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // For animated header scroll
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = new Animated.Value(0);

  // Fetch reports from Firestore
  const fetchReports = async () => {
    const user = auth.currentUser;
    if (!user) {
      setReports([]);
      setSections([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const reportsRef = collection(db, "users", user.uid, "reports");
      const q = query(reportsRef);
      const querySnapshot = await getDocs(q);
      const fetchedReports = [];
      querySnapshot.forEach((docSnap) => {
        fetchedReports.push({ id: docSnap.id, ...docSnap.data() });
      });
      console.log("Fetched Reports:", fetchedReports);
      setReports(fetchedReports);
      setSections(groupReportsByProject(fetchedReports));
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Error", error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete a report from Firestore.
  const deleteReport = async (reportId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user is logged in.");
      const reportDoc = doc(db, "users", user.uid, "reports", reportId);
      await deleteDoc(reportDoc);
      const updatedReports = reports.filter((report) => report.id !== reportId);
      setReports(updatedReports);
      setSections(groupReportsByProject(updatedReports));
      Alert.alert("Success", "Report deleted successfully.");
    } catch (error) {
      console.error("Error deleting report:", error);
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const renderReport = ({ item }) => (
    <ReportItem
      item={item}
      deleteReport={deleteReport}
      styles={styles}
      formatStockLengths={formatStockLengths}
      formatDesiredCuttings={formatDesiredCuttings}
      formatCuttingPlans={formatCuttingPlans}
    />
  );

  // Animate header translation based on scroll position.
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Absolute positioned animated header with refresh button */}
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateY: headerTranslateY }] },
        ]}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <Text style={styles.instruction}>
          Pull down to refresh. Swipe left to delete a report.
        </Text>
        <Pressable
          style={styles.refreshButton}
          onPress={() => {
            setLoading(true);
            fetchReports();
          }}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </Animated.View>

      {/* Show login prompt if not authenticated */}
      {!auth.currentUser ? (
        <View style={styles.loginPrompt}>
          <Text style={styles.error}>
            You must be logged in to view your report history.
          </Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <Text>Loading...</Text>
      ) : sections.length > 0 ? (
        <Animated.SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          renderSectionHeader={({ section: { project, createdAt } }) => (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeaderLeft}>{project}</Text>
              <Text style={styles.sectionHeaderRight}>
                Created: {createdAt.toLocaleDateString()}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReports();
              }}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: headerHeight + 10 }}
        />
      ) : (
        <Text>No reports found.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  headerContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: 0,
  },
  instruction: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: "#2864f0",
    width: 100,
    padding: 10,
    alignSelf: "center",
    marginBottom: 5,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 1,
  },
  sectionHeaderLeft: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  sectionHeaderRight: {
    fontSize: 14,
    color: "#333",
  },
  swipeableContainer: {
    marginBottom: 10,
  },
  reportItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#68b7e7",
    borderRadius: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 2,
    color: "#333",
  },
  reportText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 5,
  },
  reportDetails: {
    fontSize: 14,
    color: "#333",
  },
  deleteContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
    borderRadius: 10,
    width: 80,
    alignSelf: "stretch",
    paddingVertical: 10,
  },
  groupContainer: {
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
  },
  loginPrompt: {
    alignItems: "center",
    marginTop: 20,
  },
  loginButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});