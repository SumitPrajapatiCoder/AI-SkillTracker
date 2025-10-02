const mongoose = require("mongoose");

const connect_DB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected successfully on host: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
    }
};

module.exports = connect_DB;
