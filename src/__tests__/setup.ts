import { connectDatabase } from "../database/mongodb";
import mongoose from "mongoose";

beforeAll(async () => {
    await connectDatabase();
});

afterAll(async () => {
    // Add any teardown logic if necessary
    await mongoose.connection.close();
});

// export const connectDBTest = async () => {
//     const testUri = MONGO_URI + "_test"; // Use a separate test database
//     try{
//         await mongoose.connect(testUri);
//         console.log("MongoDB Test Database connected!");
//     }catch(error){
//         console.error("Database error:", error);
//         process.exit(1); // Exit process with failure
//     }
// }