import { 
  users, 
  projects, 
  documents, 
  tasks, 
  timeEntries, 
  activities, 
  events,
  type User, 
  type Project, 
  type Document, 
  type Task, 
  type TimeEntry, 
  type Activity, 
  type Event,
  type InsertUser, 
  type InsertProject, 
  type InsertDocument, 
  type InsertTask, 
  type InsertTimeEntry, 
  type InsertActivity, 
  type InsertEvent
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByOwnerId(ownerId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByOwnerId(ownerId: number): Promise<Document[]>;
  getDocumentsByProjectId(projectId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByAssigneeId(assigneeId: number): Promise<Task[]>;
  getTasksByProjectId(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Time Entries
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByUserId(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByProjectId(projectId: number): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;
  
  // Activities
  getActivitiesByUserId(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Events
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByUserId(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private documents: Map<number, Document> = new Map();
  private tasks: Map<number, Task> = new Map();
  private timeEntries: Map<number, TimeEntry> = new Map();
  private activities: Map<number, Activity> = new Map();
  private events: Map<number, Event> = new Map();
  
  private currentId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByOwnerId(ownerId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.ownerId === ownerId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentId++;
    const project: Project = { 
      ...insertProject, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject = { 
      ...project, 
      ...projectData, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByOwnerId(ownerId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.ownerId === ownerId);
  }

  async getDocumentsByProjectId(projectId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.projectId === projectId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) throw new Error("Document not found");
    
    const updatedDocument = { 
      ...document, 
      ...documentData, 
      updatedAt: new Date() 
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByAssigneeId(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assigneeId === assigneeId);
  }

  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = { 
      ...insertTask, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Task not found");
    
    const updatedTask = { 
      ...task, 
      ...taskData, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks.delete(id);
  }

  // Time Entries
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntriesByUserId(userId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.userId === userId);
  }

  async getTimeEntriesByProjectId(projectId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.projectId === projectId);
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.currentId++;
    const timeEntry: TimeEntry = { 
      ...insertTimeEntry, 
      id,
      createdAt: new Date()
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const timeEntry = this.timeEntries.get(id);
    if (!timeEntry) throw new Error("Time entry not found");
    
    const updatedTimeEntry = { ...timeEntry, ...timeEntryData };
    this.timeEntries.set(id, updatedTimeEntry);
    return updatedTimeEntry;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    this.timeEntries.delete(id);
  }

  // Activities
  async getActivitiesByUserId(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Events
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByUserId(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.userId === userId);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentId++;
    const event: Event = { 
      ...insertEvent, 
      id,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error("Event not found");
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
  }
}

export const storage = new MemStorage();
