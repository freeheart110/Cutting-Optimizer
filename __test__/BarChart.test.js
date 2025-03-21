import React from "react";
import { render } from "@testing-library/react-native";
import BarChart from "./BarChart";

describe("BarChart Component", () => {
  it("renders error message when no cutting plans are provided", () => {
    const { getByText } = render(<BarChart cuttingPlans={[]} />);
    expect(getByText("No cutting plans available.")).toBeTruthy();
  });

  it("renders correctly with cutting plans", () => {
    const cuttingPlans = [
      { stock: 10, cutting: [5, 3], remaining: 2 },
      { stock: 8, cutting: [4, 4], remaining: 0 },
    ];

    const { getByText } = render(<BarChart cuttingPlans={cuttingPlans} />);

    // Check if stock labels are displayed
    expect(getByText("Stock: 10")).toBeTruthy();
    expect(getByText("Stock: 8")).toBeTruthy();

    // Check if cutting lengths are displayed
    expect(getByText("5")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });
});
