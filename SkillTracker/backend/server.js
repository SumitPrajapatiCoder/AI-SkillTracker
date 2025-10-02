const dotenv = require("dotenv");
dotenv.config();  
const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const connect_DB = require("./config/db");
const cors = require("cors");
const path = require("path");


connect_DB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/v1/user', require("./routes/userRoute"));
app.use('/api/v1/admin', require("./routes/adminRoute"));
app.use('/api/v1/quiz', require("./routes/quizRoute"));




// ------------------------- Deployment Setup -------------------------
const __dirname1 = path.resolve();

// Serve frontend (React build)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "/frontend/build")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("API is running...");
    });
}
// ---------------------------------------------------------------------



const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server Running In ${process.env.NODE_MODE} Mode on Port ${port}`.bgCyan.white);
});

