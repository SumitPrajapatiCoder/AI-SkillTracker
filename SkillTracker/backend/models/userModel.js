const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name Is required"],
    },
    email: {
        type: String,
        required: [true, "Email Is Required"],
    },
    password: {
        type: String,
        required: [true, "Password Is Required"],
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
    quizHistory: [
        {
            language: String,
            correct: Number,
            total: Number,
            date: { type: Date, default: Date.now },
        },
    ],
    mockHistory: [
        {
            language: String,
            correct: Number,
            total: Number,
            date: { type: Date, default: Date.now },
        }
    ],
    completedMocks: [{
        language: { type: String, required: true },
        completed: { type: Boolean, default: false },
        date: { type: Date }
    }],
    studyPlans: {
        type: Map,
        of: String,
        default: {},
    },
    roadmap: {
        type: Map,
        of: String,
        default: {},
    },
    chatHistory: [
        {
            role: { type: String, enum: ["user", "bot"], required: true },
            text: { type: String, required: true },
            time: { type: Date, default: Date.now },
        },
    ],

}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
