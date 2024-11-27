const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dotenv = require("dotenv");
dotenv.config(".env");

app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Connection Error:", err));

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  vehicleId: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// Endpoint to receive and save vehicle location
app.post("/location", async (req, res) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;

    // Save or update the vehicle location in the database
    await Vehicle.findOneAndUpdate(
      { vehicleId: vehicleId },
      { $set: { latitude: latitude, longitude: longitude } },
      { upsert: true, new: true }
    );

    // Emit the updated location to all connected clients
    io.emit("location-update", { vehicleId, latitude, longitude });

    console.log("Location Updated:", vehicleId, latitude, longitude);
    res.status(200).send({ success: true, data: { vehicleId, latitude, longitude } });
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

// Serve the frontend
app.get("/location", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the Server
server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on http://localhost:3000");
});
