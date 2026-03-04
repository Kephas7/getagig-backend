import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

process.env.NODE_ENV = "test";

const originalConsoleLog = console.log.bind(console);
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);

const noisyLogPatterns = ["[dotenv@"];
const noisyWarnPatterns = ["Firebase Admin initialization failed:"];
const noisyErrorPatterns = ["Failed to send notification:"];

const containsNoisyPattern = (args: unknown[], patterns: string[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : String(arg)))
    .join(" ");

  return patterns.some((pattern) => message.includes(pattern));
};

jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
  if (containsNoisyPattern(args, noisyLogPatterns)) return;
  originalConsoleLog(...(args as Parameters<typeof console.log>));
});

jest.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
  if (containsNoisyPattern(args, noisyWarnPatterns)) return;
  originalConsoleWarn(...(args as Parameters<typeof console.warn>));
});

jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (containsNoisyPattern(args, noisyErrorPatterns)) return;
  originalConsoleError(...(args as Parameters<typeof console.error>));
});

beforeAll(async () => {
  const testUri = MONGODB_URI.includes("?")
    ? MONGODB_URI.replace(/\?/, "_test?")
    : `${MONGODB_URI}_test`;

  try {
    await mongoose.connect(testUri);
  } catch (error) {
    console.error("Test Database Error:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
