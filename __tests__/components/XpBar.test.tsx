import React from "react";
import { render, screen } from "@testing-library/react-native";
import { XpBar } from "../../components/XpBar";

describe("XpBar", () => {
  it("renders with 0% progress", () => {
    const { toJSON } = render(<XpBar progress={0} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with 50% progress", () => {
    const { toJSON } = render(<XpBar progress={0.5} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with 100% progress", () => {
    const { toJSON } = render(<XpBar progress={1} />);
    expect(toJSON()).toBeTruthy();
  });

  it("displays label text when provided", () => {
    render(<XpBar progress={0.5} label="Level 3" />);
    expect(screen.getByText("Level 3")).toBeTruthy();
  });

  it("does not render label when not provided", () => {
    render(<XpBar progress={0.5} />);
    expect(screen.queryByText(/Level/)).toBeNull();
  });
});
