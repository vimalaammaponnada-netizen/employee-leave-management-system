const Task = require("../models/Task");

// POST /api/tasks
async function createTask(req, res) {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      owner: req.userId, // from the auth middleware — ties the task to the logged-in user
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    res.status(500).json({ message: "Server error while creating task", error: err.message });
  }
}

// GET /api/tasks  (only the logged-in user's tasks)
async function getTasks(req, res) {
  try {
    const tasks = await Task.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching tasks", error: err.message });
  }
}

// GET /api/tasks/:id
async function getTaskById(req, res) {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ task });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching task", error: err.message });
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    // findOneAndUpdate with owner in the filter ensures a user can
    // only ever update a task that actually belongs to them.
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { title, description, status, priority, dueDate },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found or you don't have permission to edit it" });
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (err) {
    res.status(500).json({ message: "Server error while updating task", error: err.message });
  }
}

// PATCH /api/tasks/:id/status — quick toggle between pending/completed
async function updateTaskStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'pending' or 'completed'" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found or you don't have permission to edit it" });
    }

    res.status(200).json({ message: `Task marked as ${status}`, task });
  } catch (err) {
    res.status(500).json({ message: "Server error while updating task status", error: err.message });
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found or you don't have permission to delete it" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting task", error: err.message });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
