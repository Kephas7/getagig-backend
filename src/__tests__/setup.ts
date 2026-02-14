import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

beforeAll(async () => {

    const testUri = MONGODB_URI.includes('?')
        ? MONGODB_URI.replace(/\?/, '_test?')
        : `${MONGODB_URI}_test`;

    try {
        await mongoose.connect(testUri);
        console.log("Connected to Test MongoDB!");
    } catch (error) {
        console.error("Test Database Error:", error);
        process.exit(1);
    }
});

afterAll(async () => {
    await mongoose.connection.close();
});
