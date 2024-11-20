
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dotenv=require("dotenv")
dotenv.config('.env')
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
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

app.post("/location", async (req, res) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;
     await Vehicle.findOneAndUpdate({vehicleId:vehicleId},{ $set:{latitude:latitude,longitude:longitude}},{upsert:true,new:true})
    setInterval(()=>{
      io.emit("location-update", { vehicleId, latitude, longitude });
    },5000)
    res.status(200).send({ success: true,data:{ vehicleId, latitude, longitude } });
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});


// Start the Server
server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on http://localhost:3000");
});


                    // map.innerHTML='<iframe width="700" height="300" src="https://maps.google.com/maps?q='+latitude+','+longitude+'&amp;z=15&amp;output=embed"></iframe>'
                    // map.innerHTML='<iframe width="700" height="300" src=" https://www.google.com/maps/dir/?api=1&origin=12.911955547392678,77.62682971505754&destination=12.913955547392678,77.62882971505754"></iframe>'
