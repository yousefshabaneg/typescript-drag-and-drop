import { autobind } from "./../decorators/autobind.js";
import { Draggable } from "./../models/drag-drop.js";
import { Project } from "./../models/project.js";
import { Component } from "./base-component.js";

// ProjectItem Class
export class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project;

  get persons() {
    const isPlural = this.project.people === 1 ? "" : "s";
    return `${this.project.people} person${isPlural}`;
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, `${project.id}`);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", `${this.project.id}`);
    event.dataTransfer!.effectAllowed = "move";
  }

  @autobind
  dragEndHandler(event: DragEvent) {
    console.log("Drag End");
  }

  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = `${this.persons} assigned`;
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}
