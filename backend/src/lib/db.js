// import mongoose from "mongoose";

// export const connectDB  = async ()=>{

// try {
//     const conn =await mongoose.connect(process.env.MONGODB_URL);
//     console.log (`MongoDB connected:${conn.connection.host}`);
// } catch (error) {
//     console.log(`MongoDB not  connected:${conn.connection.host}`);
// }
// };
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "chat_db",
    });
    console.log(`✔️ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection FAILED");
    console.error(error.message);
    process.exit(1); // 🟥 server ko yahin stop karo
  }
};
