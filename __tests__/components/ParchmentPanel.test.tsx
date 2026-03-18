import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ParchmentPanel } from "../../components/ParchmentPanel";

describe("ParchmentPanel", () => {
  it("renders children content", () => {
    render(
      <ParchmentPanel>
        <Text>Hello from inside</Text>
      </ParchmentPanel>
    );
    expect(screen.getByText("Hello from inside")).toBeTruthy();
  });

  it("renders multiple children", () => {
    render(
      <ParchmentPanel>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </ParchmentPanel>
    );
    expect(screen.getByText("Child 1")).toBeTruthy();
    expect(screen.getByText("Child 2")).toBeTruthy();
  });
});
