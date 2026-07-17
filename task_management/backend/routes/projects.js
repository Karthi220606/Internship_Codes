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

// @route   GET /api/projects
// @desc    Get all project boards
router.get('/', auth, async (req, res) => {
  try {
    const projects = await dbService.getProjects();
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/projects
// @desc    Create a project board
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const newProject = await dbService.addProject({
      title,
      description,
      creator: req.user.id
    });

    triggerBroadcast(req, 'PROJECT_CREATED', newProject);
    res.status(201).json(newProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project board
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await dbService.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Project not found' });
    }
    triggerBroadcast(req, 'PROJECT_UPDATED', updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project board
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await dbService.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    triggerBroadcast(req, 'PROJECT_DELETED', { _id: req.params.id });
    res.json({ message: 'Project removed successfully', project: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
