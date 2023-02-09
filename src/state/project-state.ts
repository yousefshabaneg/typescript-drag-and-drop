import { Project, ProjectStatus } from "./../models/project";

type Listener<T> = (items: T[]) => void;

// State Base

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

// Project State Management
export class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;
  private constructor() {
    super();
  }

  static getInstance() {
    if (!this.instance) this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, people: number) {
    const newProject = new Project(
      Date.now(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.notifyListeners();
  }

  moveProject(projectId: number, newStatus: ProjectStatus) {
    const project = this.projects.find((p) => p.id === projectId);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

export const projectState = ProjectState.getInstance();
