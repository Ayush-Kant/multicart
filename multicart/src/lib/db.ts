import mongoose from "mongoose";

const mongoDbUrl = process.env.MONGODB_URL;

if (!mongoDbUrl) {
    throw new Error("DB Error");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDb = async () => {
    if (cached.conn) {
        console.log("✅ Using existing MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoDbUrl).then((mongoose) => {
            console.log("✅ MongoDB Connected Successfully");
            return mongoose.connection;
        });
    }

    try {
        const conn = await cached.promise;
        cached.conn = conn;
        return conn;
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        throw error;
    }
};

export default connectDb;