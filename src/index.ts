import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";
import app from "./app";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket";

async function startServer() {
  await connectDatabase();

  const httpServer = createServer(app);

  // Initialize Socket.io
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Socket.IO Server ready`);
  });
}
startServer();
