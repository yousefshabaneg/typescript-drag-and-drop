import { Component } from "./base-component.js";
import { DragTarget } from "./../models/drag-drop.js";
import { Project, ProjectStatus } from "./../models/project.js";
import { projectState } from "./../state/project-state.js";
import { ProjectItem } from "./project-item.js";
import { autobind } from "./../decorators/autobind.js";

//ProjectList Class
export class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[] = [];
  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.templateElement = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement;
    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @autobind
  dragLeaveHandler(event: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  @autobind
  dropHandler(event: DragEvent) {
    const projectId = +event.dataTransfer!.getData("text/plain");
    const newStatus =
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished;
    projectState.moveProject(projectId, newStatus);
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector(
      "h2"
    )!.textContent = `${this.type.toUpperCase()} PROJECTS`;
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((p) => {
        if (this.type === "active") {
          return p.status === ProjectStatus.Active;
        }
        return p.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const proj of this.assignedProjects) {
      new ProjectItem(listEl.id, proj);
    }
  }
}
