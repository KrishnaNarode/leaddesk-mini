const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Admin = require("./models/Admin");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URI;

async function createAdmin() {

    try {

        await mongoose.connect(MONGO_URL);

        console.log("Connected to database");

        // Delete existing admin with this username
        await Admin.deleteOne({
            username: "admin"
        });

        const hashedPassword = await bcrypt.hash(
            "admin123",
            10
        );

        const admin = new Admin({

            username: "admin",

            password: hashedPassword

        });

        await admin.save();

        console.log(
            "Admin created successfully"
        );

        await mongoose.connection.close();

    } catch (error) {

        console.log(error);

    }

}

createAdmin();