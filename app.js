const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const dotenv = require("dotenv");

const Lead = require("./models/Lead");
const Admin = require("./models/Admin");
const isAuthenticated = require("./middleware/auth");


// ===============================
// LOAD ENVIRONMENT VARIABLES
// ===============================

dotenv.config();


// ===============================
// CREATE APP
// ===============================

const app = express();

const PORT = process.env.PORT || 3000;

const MONGO_URL = process.env.MONGO_URI;

console.log("Mongo URI exists:", !!process.env.MONGO_URI);
// ===============================
// CONNECT TO DATABASE
// ===============================

main()
    .then(() => {
        console.log("Connected to database");
    })
    .catch((error) => {
        console.log("Database connection error:", error);
    });


async function main() {

    await mongoose.connect(MONGO_URL);

}


// ===============================
// APP CONFIGURATION
// ===============================

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));


// ===============================
// SESSION CONFIGURATION
// ===============================

app.use(

    session({

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({

            mongoUrl: MONGO_URL

        }),

        cookie: {

            maxAge: 1000 * 60 * 60

        }

    })

);


// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {

    res.render("home");

});


// ===============================
// SUBMIT A NEW LEAD
// ===============================

app.post("/leads", async (req, res) => {

    try {

        const {

            name,

            email,

            budget,

            message

        } = req.body;


        // ===============================
        // REQUIRED FIELDS VALIDATION
        // ===============================

        if (!name || !email || !budget || !message) {

            return res.status(400).send(

                "All fields are required"

            );

        }


        // ===============================
        // NAME VALIDATION
        // ===============================

        if (name.trim().length < 2) {

            return res.status(400).send(

                "Name must be at least 2 characters"

            );

        }


        // ===============================
        // EMAIL VALIDATION
        // ===============================

        const emailRegex =

            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            return res.status(400).send(

                "Please enter a valid email"

            );

        }


        // ===============================
        // MESSAGE VALIDATION
        // ===============================

        if (message.trim().length < 10) {

            return res.status(400).send(

                "Message must be at least 10 characters"

            );

        }


        // ===============================
        // CREATE LEAD
        // ===============================

        const newLead = new Lead({

            name: name.trim(),

            email: email.trim().toLowerCase(),

            budget: budget,

            message: message.trim()

        });


        // ===============================
        // SAVE LEAD
        // ===============================

        await newLead.save();


        // ===============================
        // SHOW SUCCESS PAGE
        // ===============================

        res.render("success");

    }


    catch (error) {

        console.log(error);

        res.status(500).send(

            "Something went wrong"

        );

    }

});


// ===============================
// ADMIN LOGIN PAGE
// ===============================

app.get("/admin/login", (req, res) => {

    res.render("login");

});


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/admin/login", async (req, res) => {

    try {

        const {

            username,

            password

        } = req.body;


        const admin = await Admin.findOne({

            username: username

        });


        if (!admin) {

            return res.send(

                "Invalid username or password"

            );

        }


        const isPasswordCorrect =

            await bcrypt.compare(

                password,

                admin.password

            );


        if (!isPasswordCorrect) {

            return res.send(

                "Invalid username or password"

            );

        }


        // ===============================
        // CREATE LOGIN SESSION
        // ===============================

        req.session.adminId = admin._id;


        res.redirect("/admin");

    }


    catch (error) {

        console.log(error);

        res.status(500).send(

            "Something went wrong"

        );

    }

});


// ===============================
// ADMIN DASHBOARD + SEARCH
// ===============================

app.get(

    "/admin",

    isAuthenticated,

    async (req, res) => {

        try {

            const search =

                req.query.search || "";


            const leads = await Lead.find({

                $or: [

                    {

                        name: {

                            $regex: search,

                            $options: "i"

                        }

                    },

                    {

                        email: {

                            $regex: search,

                            $options: "i"

                        }

                    }

                ]

            });


            res.render(

                "admin",

                {

                    leads: leads,

                    search: search

                }

            );

        }


        catch (error) {

            console.log(error);

            res.status(500).send(

                "Something went wrong"

            );

        }

    }

);


// ===============================
// UPDATE LEAD STATUS
// ===============================

app.post(

    "/admin/leads/:id/status",

    isAuthenticated,

    async (req, res) => {

        try {

            const {

                id

            } = req.params;


            const {

                status

            } = req.body;


            await Lead.findByIdAndUpdate(

                id,

                {

                    status: status

                }

            );


            res.redirect("/admin");

        }


        catch (error) {

            console.log(error);

            res.status(500).send(

                "Something went wrong"

            );

        }

    }

);


// ===============================
// ADMIN LOGOUT
// ===============================

app.get(

    "/admin/logout",

    (req, res) => {

        req.session.destroy(

            (error) => {

                if (error) {

                    return res.status(500).send(

                        "Could not log out"

                    );

                }


                res.redirect(

                    "/admin/login"

                );

            }

        );

    }

);


// ===============================
// START SERVER
// ===============================

app.listen(

    PORT,

    () => {

        console.log(

            `Server running on http://localhost:${PORT}`

        );

    }

);