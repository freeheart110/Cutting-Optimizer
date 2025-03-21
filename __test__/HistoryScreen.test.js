import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HistoryScreen from "../screens/HistoryScreen";
import {
  getDocs,
  deleteDoc,
} from "firebase/firestore";

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn((callback) =>
        callback({
          id: "report1",
          data: () => ({
            projectName: "Test Project",
            materialType: "Steel",
            createdAt: new Date("2025-03-10"),
            stockLengths: [{ length: 100, quantity: 2 }],
            desiredCuttings: [{ length: 50, quantity: 1 }],
            cuttingPlans: [{ stock: 100, cutting: [50], remaining: 50 }],
            unplacedCuttings: [],
            unplacedStocks: [],
            usageRate: 0.5,
          }),
        })
      ),
    })
  ),
  deleteDoc: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Auth
jest.mock("../firebaseConfig", () => ({
  auth: { currentUser: { uid: "user123" } },
}));

describe("HistoryScreen", () => {
  it("renders correctly when user is logged in", async () => {
    const { getByText } = render(<HistoryScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(getByText("Pull down to refresh. Swipe left to delete a report.")).toBeTruthy();
      expect(getByText("Test Project (Created: 3/10/2025)")).toBeTruthy();
    });
  });

  it("shows login prompt when no user is logged in", () => {
    jest.mock("../firebaseConfig", () => ({
      auth: { currentUser: null },
    }));

    const { getByText } = render(<HistoryScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText("You must be logged in to view your report history.")).toBeTruthy();
  });

  it("triggers data fetch when refresh button is pressed", async () => {
    const { getByText } = render(<HistoryScreen navigation={{ navigate: jest.fn() }} />);

    const refreshButton = getByText("Refresh");
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
    });
  });

  it("deletes a report when swipe delete is confirmed", async () => {
    const { getByText } = render(<HistoryScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(getByText("Test Project (Created: 3/10/2025)")).toBeTruthy();
    });

    // Simulate deleting a report
    fireEvent.press(getByText("Delete Report"));

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
