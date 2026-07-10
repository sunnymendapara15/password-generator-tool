import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App overview", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("renders password generator and auth controls", () => {
    render(<App />);

    expect(screen.getByText(/password generator/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up mode/i })).toBeInTheDocument();
  });

  test("signup form validates required fields", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/fill every signup field/i)).toBeInTheDocument();
  });

  test("login mode shows error when no account exists", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /log in mode/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /log in$/i }));

    expect(screen.getByText(/no account found/i)).toBeInTheDocument();
  });
});
