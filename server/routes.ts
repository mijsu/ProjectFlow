import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertDocumentSchema, 
  insertTaskSchema, 
  insertTimeEntrySchema, 
  insertActivitySchema, 
  insertEventSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid user data" });
    }
  });

  app.get("/api/users/firebase/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const { ownerId } = req.query;
      if (!ownerId) {
        return res.status(400).json({ message: "Owner ID is required" });
      }
      const projects = await storage.getProjectsByOwnerId(Number(ownerId));
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(Number(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      
      // Create activity
      await storage.createActivity({
        type: "project_created",
        description: `Created project "${project.name}"`,
        userId: project.ownerId,
        entityType: "project",
        entityId: project.id,
        metadata: {}
      });
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), projectData);
      
      // Create activity
      await storage.createActivity({
        type: "project_updated",
        description: `Updated project "${project.name}"`,
        userId: project.ownerId,
        entityType: "project",
        entityId: project.id,
        metadata: {}
      });
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(Number(req.params.id));
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    try {
      const { ownerId, projectId } = req.query;
      
      let documents;
      if (projectId) {
        documents = await storage.getDocumentsByProjectId(Number(projectId));
      } else if (ownerId) {
        documents = await storage.getDocumentsByOwnerId(Number(ownerId));
      } else {
        return res.status(400).json({ message: "Owner ID or Project ID is required" });
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(Number(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      
      // Create activity
      await storage.createActivity({
        type: "document_created",
        description: `Created document "${document.title}"`,
        userId: document.ownerId,
        entityType: "document",
        entityId: document.id,
        metadata: {}
      });
      
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid document data" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(Number(req.params.id), documentData);
      
      // Create activity
      await storage.createActivity({
        type: "document_updated",
        description: `Updated document "${document.title}"`,
        userId: document.ownerId,
        entityType: "document",
        entityId: document.id,
        metadata: {}
      });
      
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid document data" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(Number(req.params.id));
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const { assigneeId, projectId } = req.query;
      
      let tasks;
      if (projectId) {
        tasks = await storage.getTasksByProjectId(Number(projectId));
      } else if (assigneeId) {
        tasks = await storage.getTasksByAssigneeId(Number(assigneeId));
      } else {
        return res.status(400).json({ message: "Assignee ID or Project ID is required" });
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), taskData);
      
      // Create activity if task completed
      if (taskData.status === "completed") {
        await storage.createActivity({
          type: "task_completed",
          description: `Completed task "${task.title}"`,
          userId: task.assigneeId || 0,
          entityType: "task",
          entityId: task.id,
          metadata: {}
        });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid task data" });
    }
  });

  // Time Entries
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { userId, projectId } = req.query;
      
      let timeEntries;
      if (projectId) {
        timeEntries = await storage.getTimeEntriesByProjectId(Number(projectId));
      } else if (userId) {
        timeEntries = await storage.getTimeEntriesByUserId(Number(userId));
      } else {
        return res.status(400).json({ message: "User ID or Project ID is required" });
      }
      
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      
      // Create activity
      await storage.createActivity({
        type: "time_logged",
        description: `Logged ${Math.round(timeEntry.duration / 60)} hours`,
        userId: timeEntry.userId,
        entityType: "time_entry",
        entityId: timeEntry.id,
        metadata: {}
      });
      
      res.json(timeEntry);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time entry data" });
    }
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const activities = await storage.getActivitiesByUserId(Number(userId));
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const events = await storage.getEventsByUserId(Number(userId));
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid event data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
