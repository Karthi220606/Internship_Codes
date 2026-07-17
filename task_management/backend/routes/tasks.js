const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dbService = require('../services/dbService');

const triggerBroadcast = (req, type, payload) => {
  const broadcast = req.app.get('broadcast');
  if (broadcast) {
    broadcast({ type, payload });
  }
};

// @route   GET /api/tasks
// @desc    Get tasks by project or user
router.get('/', auth, async (req, res) => {
  const { project } = req.query;
  try {
    const query = {};
    if (project) {
      query.project = project;
    } else {
      query.creator = req.user.id;
    }
    const tasks = await dbService.getTasks(query);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a task
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, dueDate, project, assigneeName, tags } = req.body;

  if (!title || !project) {
    return res.status(400).json({ message: 'Title and project are required' });
  }

  try {
    const newTask = await dbService.addTask({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      project,
      creator: req.user.id,
      assigneeName,
      tags: tags || []
    });

    triggerBroadcast(req, 'TASK_CREATED', newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedTask = await dbService.updateTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    triggerBroadcast(req, 'TASK_UPDATED', updatedTask);
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedTask = await dbService.deleteTask(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    triggerBroadcast(req, 'TASK_DELETED', { _id: req.params.id, project: deletedTask.project });
    res.json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
