const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { eq } = require("drizzle-orm");
const { users, todos } = require("./db/schema");

const app = express();
app.use(cors());
app.use(express.json());

// DB
const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite);

// Middleware JWT
function verifyToken(req, res, next) {
  const header = req.headers.authorization; // "Bearer <token>"
  if (!header) return res.status(401).json({ message: "No token provided" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    await db.insert(users).values({ email, password: hashedPassword });

    return res.status(201).json({ message: "User registered" });
  } catch (err) {
    // email unique error
    if (String(err).includes("UNIQUE")) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const found = await db.select().from(users).where(eq(users.email, email));
    const user = found[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET TODOS (protected)
app.get("/todos", verifyToken, async (req, res) => {
  try {
    const list = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, req.user.userId));
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ADD TODO (protected) - pratique pour tester
app.post("/todos", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });

    await db.insert(todos).values({
      content,
      completed: false,
      userId: req.user.userId,
    });

    return res.status(201).json({ message: "Todo created" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE TODO (protected) - optionnel
app.patch("/todos/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { completed } = req.body;

    // Update only if belongs to user
    const owned = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id));

    if (!owned[0] || owned[0].userId !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    sqlite
      .prepare("UPDATE todos SET completed = ? WHERE id = ?")
      .run(completed ? 1 : 0, id);

    return res.json({ message: "Todo updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});