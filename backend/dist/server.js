import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
app.get("/api/tasks", async (req, res) => {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
});
app.post("/api/tasks", async (req, res) => {
    const { title } = req.body;
    const newTask = await prisma.task.create({
        data: { title },
    });
    res.json(newTask);
});
app.patch("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    const updatedTask = await prisma.task.update({
        where: { id: Number(id) },
        data: { completed },
    });
    res.json(updatedTask);
});
app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ message: "Deleted" });
});
app.listen(3000, () => console.log(" Server running at http://localhost:3000"));
//# sourceMappingURL=server.js.map