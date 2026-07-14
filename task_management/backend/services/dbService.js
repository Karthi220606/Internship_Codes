const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const db = require('../config/db');

// Helper to sanitize fallback data structure
const getSanitizedFallbackData = () => {
  const data = db.readFallbackFile();
  if (!data.users) data.users = [];
  if (!data.projects) data.projects = [];
  if (!data.tasks) data.tasks = [];
  return data;
};

// --- USER OPERATIONS ---
const getUsers = async () => {
  if (db.isUsingMongo()) {
    return await User.find({}, '-password');
  } else {
    const data = getSanitizedFallbackData();
    return data.users.map(({ password, ...u }) => u);
  }
};

const getUserByEmail = async (email) => {
  if (db.isUsingMongo()) {
    return await User.findOne({ email });
  } else {
    const data = getSanitizedFallbackData();
    return data.users.find(u => u.email === email) || null;
  }
};

const getUserById = async (id) => {
  if (db.isUsingMongo()) {
    return await User.findById(id, '-password');
  } else {
    const data = getSanitizedFallbackData();
    const user = data.users.find(u => u._id === id);
    if (user) {
      const { password, ...u } = user;
      return u;
    }
    return null;
  }
};

const addUser = async (userData) => {
  if (db.isUsingMongo()) {
    const user = new User(userData);
    return await user.save();
  } else {
    const data = getSanitizedFallbackData();
    const newUser = {
      _id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    db.writeFallbackFile(data);
    const { password, ...u } = newUser;
    return u;
  }
};

// --- PROJECT OPERATIONS ---
const getProjects = async () => {
  if (db.isUsingMongo()) {
    return await Project.find().sort({ createdAt: -1 });
  } else {
    const data = getSanitizedFallbackData();
    return data.projects || [];
  }
};

const addProject = async (projectData) => {
  if (db.isUsingMongo()) {
    const project = new Project(projectData);
    return await project.save();
  } else {
    const data = getSanitizedFallbackData();
    const newProject = {
      _id: Date.now().toString(),
      ...projectData,
      createdAt: new Date().toISOString()
    };
    data.projects.push(newProject);
    db.writeFallbackFile(data);
    return newProject;
  }
};

const updateProject = async (id, projectData) => {
  if (db.isUsingMongo()) {
    return await Project.findByIdAndUpdate(id, projectData, { new: true });
  } else {
    const data = getSanitizedFallbackData();
    const index = data.projects.findIndex(p => p._id === id);
    if (index !== -1) {
      data.projects[index] = { ...data.projects[index], ...projectData };
      db.writeFallbackFile(data);
      return data.projects[index];
    }
    return null;
  }
};

const deleteProject = async (id) => {
  if (db.isUsingMongo()) {
    await Task.deleteMany({ project: id });
    return await Project.findByIdAndDelete(id);
  } else {
    const data = getSanitizedFallbackData();
    const index = data.projects.findIndex(p => p._id === id);
    if (index !== -1) {
      const deleted = data.projects.splice(index, 1);
      data.tasks = data.tasks.filter(t => t.project !== id);
      db.writeFallbackFile(data);
      return deleted[0];
    }
    return null;
  }
};

// --- TASK OPERATIONS ---
const getTasks = async (query = {}) => {
  if (db.isUsingMongo()) {
    return await Task.find(query).sort({ createdAt: -1 });
  } else {
    const data = getSanitizedFallbackData();
    let tasks = data.tasks || [];
    if (query.project) {
      tasks = tasks.filter(t => t.project === query.project);
    }
    if (query.creator) {
      tasks = tasks.filter(t => t.creator === query.creator);
    }
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const addTask = async (taskData) => {
  if (db.isUsingMongo()) {
    const task = new Task(taskData);
    return await task.save();
  } else {
    const data = getSanitizedFallbackData();
    const newTask = {
      _id: Date.now().toString(),
      status: 'todo',
      priority: 'medium',
      tags: [],
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.tasks.push(newTask);
    db.writeFallbackFile(data);
    return newTask;
  }
};

const updateTask = async (id, taskData) => {
  if (db.isUsingMongo()) {
    return await Task.findByIdAndUpdate(id, { ...taskData, updatedAt: Date.now() }, { new: true });
  } else {
    const data = getSanitizedFallbackData();
    const index = data.tasks.findIndex(t => t._id === id);
    if (index !== -1) {
      data.tasks[index] = { 
        ...data.tasks[index], 
        ...taskData, 
        updatedAt: new Date().toISOString() 
      };
      db.writeFallbackFile(data);
      return data.tasks[index];
    }
    return null;
  }
};

const deleteTask = async (id) => {
  if (db.isUsingMongo()) {
    return await Task.findByIdAndDelete(id);
  } else {
    const data = getSanitizedFallbackData();
    const index = data.tasks.findIndex(t => t._id === id);
    if (index !== -1) {
      const deleted = data.tasks.splice(index, 1);
      db.writeFallbackFile(data);
      return deleted[0];
    }
    return null;
  }
};

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  addUser,
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getTasks,
  addTask,
  updateTask,
  deleteTask
};
