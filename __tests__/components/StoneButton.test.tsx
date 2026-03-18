import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { StoneButton } from "../../components/StoneButton";

describe("StoneButton", () => {
  it("shows label text", () => {
    render(<StoneButton label="Climb!" onPress={() => {}} />);
    expect(screen.getByText("Climb!")).toBeTruthy();
  });

  it("fires onPress callback when pressed", () => {
    const onPress = jest.fn();
    render(<StoneButton label="Go" onPress={onPress} />);
    fireEvent.press(screen.getByText("Go"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without crashing", () => {
    const { toJSON } = render(
      <StoneButton label="Test" onPress={() => {}} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
