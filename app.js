let express = require("express");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let bcrypt = require("bcrypt");

let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "userData.db");

let db = null;

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, function () {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Register API
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE 
                username = '${username}';`;
  let userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    let newUserDetails = await db.run(postNewUserQuery);
    response.status(200);
    response.send("User created successfully");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Login API
app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let checkValidUser = `
        SELECT *
        FROM user
        WHERE
            username='${username}'`;
  let isValidUser = await db.get(checkValidUser);
  if (isValidUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isValidPassword = await bcrypt.compare(password, isValidUser.password);
    if (isValidPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// Change Password
app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let checkUsername = `
        SELECT *
        FROM user
        WHERE 
            username= '${username}';`;
  let user = await db.get(checkUsername);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isValidPass = await bcrypt.compare(oldPassword, user.password);
    if (isValidPass === true) {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      let putUserDetails = `
        UPDATE 
         user 
        SET 
            password= '${hashedPassword}'; 
        WHERE 
            username= '${username}'`;
      let newPass = await db.run(putUserDetails);
      response.status(200);
      response.send("Password updated");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  }

  //let updatedPass = await db.run(putUserDetails);
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
