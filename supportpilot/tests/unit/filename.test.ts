import { describe, expect, it } from "vitest";
import { getStorageFileNameError, getStorageUploadError } from "@/lib/validation/document";

describe("getStorageFileNameError", () => {
  it("allows a safe knowledge file name", () => {
    expect(getStorageFileNameError("refund-policy.pdf")).toBeNull();
  });

  it("asks the user to rename files with spaces and special characters", () => {
    const message = getStorageFileNameError(
      "Task Report with Time Estimates — July 2026.pdf",
    );
    expect(message).toMatch(/spaces and special characters/i);
    expect(message).toMatch(/Rename the file/i);
  });

  it("maps Invalid key storage errors to the rename message", () => {
    const mapped = getStorageUploadError(
      "Invalid key: org/doc/Task Report.pdf",
      "Task Report.pdf",
    );
    expect(mapped).toMatch(/Rename the file/i);
  });
});
