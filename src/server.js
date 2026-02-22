import app from "./app.js";
import { connectDb } from "./database/main.js";
const port = process.env.PORT || 3000;

startServer();

async function startServer() {
  try {
    await connectDb();

    const server = app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    server.on("error", (error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to connect to db:", err);
    process.exit(1);
  }
}
