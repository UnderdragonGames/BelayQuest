import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SectionHeader } from "../../components/SectionHeader";

describe("SectionHeader", () => {
  it("renders title text", () => {
    render(<SectionHeader title="My Quests" />);
    expect(screen.getByText("My Quests")).toBeTruthy();
  });

  it("renders different titles correctly", () => {
    render(<SectionHeader title="Party Members" />);
    expect(screen.getByText("Party Members")).toBeTruthy();
  });
});
